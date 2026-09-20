import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveServerMessage, Session } from '@google/genai';
import { apiFetch } from './api';

/* AI Speaking: a real-time spoken conversation with Gemini Live - the student
   talks, AI LEX answers in a natural voice, and either side can speak at any
   moment (talking over AI LEX interrupts it, as in a real call).

   Audio path:
   microphone -> AudioWorklet (16 kHz, 16-bit PCM, 100 ms chunks) -> Gemini Live
   Gemini Live -> 24 kHz PCM chunks -> scheduled back-to-back on an AudioContext

   The browser never holds the API key: /api/live-token returns a single-use
   token with the model, voice and tutor instructions locked on the server. */

export type LiveStatus = 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';

export interface LiveHandlers {
  onStatus: (status: LiveStatus) => void;
  /** Running captions of the current turn; `done` once the turn is over. */
  onStudentText: (text: string, done: boolean) => void;
  onTutorText: (text: string, done: boolean) => void;
  /** 0..1 loudness of the microphone and of AI LEX's voice, for the orb. */
  onLevels: (mic: number, voice: number) => void;
  onError: (message: string) => void;
}

export interface LiveConversation {
  stop: () => void;
  setMuted: (muted: boolean) => void;
}

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

/* Runs on the audio thread: resamples the microphone to 16 kHz and posts
   100 ms chunks of 16-bit PCM together with their loudness. */
const CAPTURE_WORKLET = `
class LexCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.step = sampleRate / ${INPUT_RATE};
    this.pos = 0;
    this.out = new Int16Array(${INPUT_RATE / 10});
    this.n = 0;
    this.peak = 0;
  }
  process(inputs) {
    const x = inputs[0] && inputs[0][0];
    if (!x) return true;
    while (this.pos < x.length) {
      const i = Math.floor(this.pos);
      const f = this.pos - i;
      const b = i + 1 < x.length ? x[i + 1] : x[i];
      let v = x[i] + (b - x[i]) * f;
      v = v > 1 ? 1 : v < -1 ? -1 : v;
      const a = v < 0 ? -v : v;
      if (a > this.peak) this.peak = a;
      this.out[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
      if (this.n === this.out.length) {
        this.port.postMessage({ pcm: this.out.buffer, level: this.peak }, [this.out.buffer]);
        this.out = new Int16Array(${INPUT_RATE / 10});
        this.n = 0;
        this.peak = 0;
      }
      this.pos += this.step;
    }
    this.pos -= x.length;
    return true;
  }
}
registerProcessor('lex-capture', LexCapture);
`;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function pcmToFloat(base64: string): Float32Array {
  const binary = atob(base64);
  const samples = new Float32Array(Math.floor(binary.length / 2));
  for (let i = 0; i < samples.length; i++) {
    let v = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
    if (v >= 0x8000) v -= 0x10000;
    samples[i] = v / 0x8000;
  }
  return samples;
}

function describe(reason: string): string {
  if (/credit|quota|RESOURCE_EXHAUSTED|billing/i.test(reason)) {
    return 'AI Speaking is unavailable: the Gemini API credits have run out.';
  }
  return reason ? `The conversation ended: ${reason}` : 'The conversation ended unexpectedly.';
}

/* Must be called from a tap: audio playback on phones only starts inside a user
   gesture. Returns at once, so the call can be ended even while it connects. */
export function startLiveConversation(h: LiveHandlers): LiveConversation {
  // Create both audio contexts synchronously, inside the gesture.
  const AudioCtx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const micCtx = new AudioCtx();
  const voiceCtx = new AudioCtx({ sampleRate: OUTPUT_RATE });
  void micCtx.resume();
  void voiceCtx.resume();

  let stopped = false;
  let muted = false;
  let session: Session | null = null;
  let stream: MediaStream | null = null;
  let studentText = '';
  let tutorText = '';
  let nextStart = 0;
  let micLevel = 0;
  const playing = new Set<AudioBufferSourceNode>();

  const voiceOut = voiceCtx.createGain();
  const voiceMeter = voiceCtx.createAnalyser();
  voiceMeter.fftSize = 512;
  voiceOut.connect(voiceMeter);
  voiceMeter.connect(voiceCtx.destination);
  const meterData = new Uint8Array(voiceMeter.fftSize);

  // Loudness for the orb, about 30 times a second.
  const meter = window.setInterval(() => {
    voiceMeter.getByteTimeDomainData(meterData);
    let peak = 0;
    for (const v of meterData) peak = Math.max(peak, Math.abs(v - 128) / 128);
    h.onLevels(muted ? 0 : micLevel, peak);
    micLevel *= 0.6;
  }, 33);

  const cleanup = () => {
    window.clearInterval(meter);
    playing.forEach(s => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    playing.clear();
    stream?.getTracks().forEach(t => t.stop());
    void micCtx.close().catch(() => {});
    void voiceCtx.close().catch(() => {});
  };

  const fail = (message: string) => {
    if (stopped) return;
    stopped = true;
    try {
      session?.close();
    } catch {
      /* ignore */
    }
    cleanup();
    h.onError(message);
    h.onStatus('error');
  };

  const stopPlayback = () => {
    playing.forEach(s => {
      try {
        s.stop();
      } catch {
        /* ignore */
      }
    });
    playing.clear();
    nextStart = 0;
  };

  const finishTurn = () => {
    if (studentText.trim()) h.onStudentText(studentText.trim(), true);
    if (tutorText.trim()) h.onTutorText(tutorText.trim(), true);
    studentText = '';
    tutorText = '';
  };

  const onMessage = (msg: LiveServerMessage) => {
    const content = msg.serverContent;
    if (!content) return;

    if (content.interrupted) {
      // The student spoke over AI LEX: silence it at once.
      stopPlayback();
      if (tutorText.trim()) h.onTutorText(tutorText.trim(), true);
      tutorText = '';
      h.onStatus('listening');
    }

    if (content.inputTranscription?.text) {
      studentText += content.inputTranscription.text;
      h.onStudentText(studentText.trim(), false);
    }

    for (const part of content.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (!data || !part.inlineData?.mimeType?.startsWith('audio/')) continue;
      if (studentText.trim()) {
        h.onStudentText(studentText.trim(), true);
        studentText = '';
      }
      const samples = pcmToFloat(data);
      if (!samples.length) continue;
      const buffer = voiceCtx.createBuffer(1, samples.length, OUTPUT_RATE);
      buffer.copyToChannel(samples, 0);
      const src = voiceCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(voiceOut);
      const at = Math.max(nextStart, voiceCtx.currentTime + 0.03);
      src.start(at);
      nextStart = at + buffer.duration;
      playing.add(src);
      h.onStatus('speaking');
      src.onended = () => {
        playing.delete(src);
        if (playing.size === 0 && !stopped) h.onStatus('listening');
      };
    }

    if (content.outputTranscription?.text) {
      tutorText += content.outputTranscription.text;
      h.onTutorText(tutorText.trim(), false);
    }

    if (content.turnComplete) {
      finishTurn();
      if (playing.size === 0) h.onStatus('listening');
    }
  };

  h.onStatus('connecting');

  void (async () => {
  try {
    const res = await apiFetch('/api/live-token', { method: 'POST' });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.message || 'Voice conversation is not available right now.');
    if (stopped) throw new Error('stopped');

    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (stopped) {
      // Ended while the permission prompt was open: release the microphone at once.
      stream.getTracks().forEach(t => t.stop());
      throw new Error('stopped');
    }

    const workletUrl = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
    await micCtx.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    const client = new GoogleGenAI({ apiKey: data.token, httpOptions: { apiVersion: 'v1alpha' } });
    session = await client.live.connect({
      model: data.model,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {},
        onmessage: onMessage,
        onerror: (e: ErrorEvent) => fail(describe(e?.message || '')),
        onclose: (e: CloseEvent) => {
          if (stopped) return;
          if (e.code === 1000 && !e.reason) {
            stopped = true;
            cleanup();
            h.onStatus('ended');
          } else {
            fail(describe(e.reason || ''));
          }
        },
      },
    });
    if (stopped) {
      session.close();
      throw new Error('stopped');
    }

    // Microphone -> worklet -> Gemini Live. The silent gain keeps the graph running.
    const source = micCtx.createMediaStreamSource(stream);
    const capture = new AudioWorkletNode(micCtx, 'lex-capture');
    const silent = micCtx.createGain();
    silent.gain.value = 0;
    source.connect(capture);
    capture.connect(silent);
    silent.connect(micCtx.destination);
    capture.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; level: number }>) => {
      micLevel = Math.max(micLevel, e.data.level);
      if (stopped || muted || !session) return;
      session.sendRealtimeInput({ audio: { data: toBase64(e.data.pcm), mimeType: `audio/pcm;rate=${INPUT_RATE}` } });
    };

    // AI LEX opens the call with a greeting.
    session.sendClientContent({ turns: 'The student has joined the call.', turnComplete: true });
    h.onStatus('listening');
  } catch (err: any) {
    if (!stopped) {
      const name = err?.name || '';
      fail(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone access is blocked. Allow the microphone for this site and try again.'
          : name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : describe(err?.message || '')
      );
    }
  }
  })();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      finishTurn();
      try {
        session?.close();
      } catch {
        /* ignore */
      }
      cleanup();
      h.onStatus('ended');
    },
    setMuted: (value: boolean) => {
      muted = value;
    },
  };
}

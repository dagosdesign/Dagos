import { SpeechRecognition as Native } from '@capacitor-community/speech-recognition';
import type { PluginListenerHandle } from '@capacitor/core';
import { isNative } from './runtime';

/* SPEECH RECOGNITION for the games and AI Lex.

   On the web the browser's own SpeechRecognition is used. Inside the phone app
   there is none (iOS has no Web Speech API), so the native recogniser is wrapped
   in a class with the same shape - lang, interimResults, maxAlternatives,
   onresult / onerror / onend, start / stop / abort - and the screens do not know
   the difference. One utterance per session, like the browser: the session ends
   about a second after the student stops speaking. */

export interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

const SILENCE_MS = 1100; // after the last words: the utterance is over
const NO_SPEECH_MS = 6000; // nothing said at all: give up, as browsers do

class NativeRecognition implements RecognitionLike {
  lang = 'en-US';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;

  private active = false;
  private matches: string[] = [];
  private timer: number | undefined;
  private handles: PluginListenerHandle[] = [];

  private event(matches: string[], isFinal: boolean) {
    const alternatives: any = matches.map(transcript => ({ transcript, confidence: 1 }));
    alternatives.isFinal = isFinal;
    return { results: [alternatives], resultIndex: 0 };
  }

  private arm(ms: number) {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.stop(), ms);
  }

  async start() {
    if (this.active) return;
    this.active = true;
    this.matches = [];
    try {
      const { available } = await Native.available();
      if (!available) throw Object.assign(new Error('unavailable'), { code: 'service-not-allowed' });
      const perm = await Native.requestPermissions();
      if (perm.speechRecognition !== 'granted') throw Object.assign(new Error('denied'), { code: 'not-allowed' });
      this.handles.push(
        await Native.addListener('partialResults', ({ matches }) => {
          if (!this.active) return;
          this.matches = (matches ?? []).filter(Boolean);
          if (this.interimResults && this.matches.length) this.onresult?.(this.event(this.matches, false));
          this.arm(SILENCE_MS);
        }),
        await Native.addListener('listeningState', ({ status }) => {
          if (status === 'stopped') this.finish();
        })
      );
      await Native.start({ language: this.lang, maxResults: Math.max(1, this.maxAlternatives), partialResults: true, popup: false });
      this.arm(NO_SPEECH_MS);
    } catch (err: any) {
      this.onerror?.({ error: err?.code || 'aborted' });
      this.finish();
    }
  }

  private finish() {
    if (!this.active) return;
    this.active = false;
    window.clearTimeout(this.timer);
    for (const h of this.handles) void h.remove();
    this.handles = [];
    if (this.matches.length) this.onresult?.(this.event(this.matches, true));
    else this.onerror?.({ error: 'no-speech' });
    this.onend?.();
  }

  stop() {
    void Native.stop().catch(() => {});
    this.finish();
  }

  abort() {
    this.matches = [];
    void Native.stop().catch(() => {});
    this.finish();
  }
}

/* The recogniser class for this platform, or null where there is none. */
export function getSpeechRecognition(): (new () => RecognitionLike) | null {
  if (isNative) return NativeRecognition;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SR ?? null;
}

export const speechSupported = () => getSpeechRecognition() !== null;

/* Answer sounds for tests and games.

   The sounds are files in public/sounds/ (correct.m4a, wrong.m4a), shipped inside the
   app so they play offline and without delay. Each file is decoded once into Web Audio
   on first use. Until a file exists (or if it cannot be decoded) a short synthesised
   stand-in plays instead, so the game never goes silent by accident.

   Off switch: Profile → Notifications → Sound effects (saved on this device). */

const KEY = 'lex_sound_effects';
const FILES = { correct: '/sounds/correct.m4a', wrong: '/sounds/wrong.m4a' } as const;
// The files peak around 0.2-0.25; this brings them to a clear but comfortable level.
const VOLUME = 2.5;

type Kind = keyof typeof FILES;

export function soundsOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundsOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx: typeof AudioContext | undefined = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  // Phones start the context suspended until a tap; every answer comes from a tap.
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

// null = the file is missing or unreadable: use the stand-in.
const buffers: Partial<Record<Kind, Promise<AudioBuffer | null>>> = {};

function load(ac: AudioContext, kind: Kind): Promise<AudioBuffer | null> {
  return (buffers[kind] ??= fetch(FILES[kind])
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
    .then(data => new Promise<AudioBuffer>((ok, fail) => ac.decodeAudioData(data, ok, fail)))
    .catch(() => null));
}

/* Decodes both files ahead of the first answer, so the first sound is not late. */
export function preloadSounds() {
  const ac = audio();
  if (!ac) return;
  void load(ac, 'correct');
  void load(ac, 'wrong');
}

function playFile(ac: AudioContext, buffer: AudioBuffer) {
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  gain.gain.value = VOLUME;
  src.buffer = buffer;
  src.connect(gain).connect(ac.destination);
  src.start();
}

/* ---- stand-in sounds, used only while a file is missing ---- */

interface Note {
  freq: number;
  at: number;
  dur: number;
  type: OscillatorType;
  gain: number;
  glideTo?: number;
}

function synth(ac: AudioContext, notes: Note[], lowpass: number) {
  const start = ac.currentTime + 0.01;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  filter.connect(ac.destination);
  for (const n of notes) {
    const t = start + n.at;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = n.type;
    osc.frequency.setValueAtTime(n.freq, t);
    if (n.glideTo) osc.frequency.exponentialRampToValueAtTime(n.glideTo, t + n.dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(n.gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
    osc.connect(amp).connect(filter);
    osc.start(t);
    osc.stop(t + n.dur + 0.02);
  }
}

const STAND_IN: Record<Kind, () => void> = {
  correct: () =>
    ctx &&
    synth(
      ctx,
      [
        { freq: 880, at: 0, dur: 0.22, type: 'sine', gain: 0.16 },
        { freq: 1318.5, at: 0.09, dur: 0.38, type: 'sine', gain: 0.16 },
      ],
      6000
    ),
  wrong: () =>
    ctx &&
    synth(
      ctx,
      [
        { freq: 233, at: 0, dur: 0.16, type: 'triangle', gain: 0.2 },
        { freq: 196, at: 0.13, dur: 0.3, type: 'triangle', gain: 0.2, glideTo: 185 },
      ],
      1400
    ),
};

function play(kind: Kind) {
  if (!soundsOn()) return;
  const ac = audio();
  if (!ac) return;
  void load(ac, kind).then(buffer => (buffer ? playFile(ac, buffer) : STAND_IN[kind]()));
}

export const playCorrect = () => play('correct');
export const playWrong = () => play('wrong');
export const playAnswer = (correct: boolean) => play(correct ? 'correct' : 'wrong');

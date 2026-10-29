// Plays SOUNDS with the Web Audio API. Everything is guarded: no AudioContext
// (old browsers, tests) or a blocked one just means silence.
import { load, save } from '../game/storage.ts';
import { SOUNDS, type Note, type SoundId } from './sounds.ts';

const SETTINGS_KEY = 'sound';
const SETTINGS_VERSION = 1;
const MASTER_VOLUME = 0.22;
/** The same sound won't restart within this many ms (fast playback, many hits). */
const MIN_GAP_MS = 60;

let enabled = load(SETTINGS_KEY, (x): x is boolean => typeof x === 'boolean', SETTINGS_VERSION) ?? true;
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const lastPlayed = new Map<SoundId, number>();

export function soundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  save(SETTINGS_KEY, on, SETTINGS_VERSION);
  if (on) play('choose');
  listeners.forEach((l) => l());
}

/** For useSyncExternalStore. */
export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  try {
    if (!ctx) {
      const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    // Browsers start audio suspended until a user gesture; every sound follows one.
    if (ctx.state === 'suspended') void ctx.resume();
    return { ctx, out: master! };
  } catch {
    return null;
  }
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    // Noise texture only; this is UI, not game logic, so Math.random is fine here.
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function playNote(c: AudioContext, out: AudioNode, note: Note, t0: number): void {
  const start = t0 + note.at;
  const end = start + note.dur;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(note.vol, start + Math.min(0.01, note.dur / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  gain.connect(out);
  let src: AudioScheduledSourceNode;
  if (note.wave === 'noise') {
    const buf = c.createBufferSource();
    buf.buffer = noise(c);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = note.freq;
    buf.connect(filter).connect(gain);
    src = buf;
  } else {
    const osc = c.createOscillator();
    osc.type = note.wave;
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
    osc.connect(gain);
    src = osc;
  }
  src.start(start);
  src.stop(end + 0.02);
}

/** Play a sound now, if sound is on (null plays nothing). */
export function play(id: SoundId | null): void {
  if (!enabled || !id) return;
  const now = performance.now();
  if (now - (lastPlayed.get(id) ?? -Infinity) < MIN_GAP_MS) return;
  lastPlayed.set(id, now);
  const a = audio();
  if (!a) return;
  try {
    const t0 = a.ctx.currentTime + 0.005;
    for (const note of SOUNDS[id]) playNote(a.ctx, a.out, note, t0);
  } catch {
    // Audio is optional.
  }
}

/** Play several sounds, staggered slightly so they don't mask each other. */
export function playAll(ids: readonly SoundId[]): void {
  ids.forEach((id, i) => (i === 0 ? play(id) : setTimeout(() => play(id), i * 45)));
}

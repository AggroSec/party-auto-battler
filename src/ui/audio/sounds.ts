// Retro sound effects (M8), as data: each sound is a few synth notes. Brandon
// chose sounds made in code over audio files, so there is nothing to license.
import type { Frame } from '../game/playback.ts';

export type SoundId =
  | 'hit'
  | 'block'
  | 'cast'
  | 'heal'
  | 'shield'
  | 'death'
  | 'burst'
  | 'summon'
  | 'overtime'
  | 'buy'
  | 'sell'
  | 'reroll'
  | 'lock'
  | 'choose'
  | 'levelUp'
  | 'error'
  | 'fight'
  | 'victory'
  | 'defeat'
  | 'achievement';

export interface Note {
  /** An oscillator shape, or white noise. */
  wave: OscillatorType | 'noise';
  /** Start frequency in Hz (for noise: the low-pass cutoff). */
  freq: number;
  /** Slide to this frequency over the note. */
  to?: number;
  /** Start, in seconds after the sound begins. */
  at: number;
  dur: number;
  /** Peak volume, 0–1, before the master volume. */
  vol: number;
}

const n = (wave: Note['wave'], freq: number, at: number, dur: number, vol: number, to?: number): Note => ({ wave, freq, at, dur, vol, ...(to ? { to } : {}) });

/** Notes of a rising run, `step` seconds apart. */
const run = (wave: OscillatorType, freqs: number[], step: number, dur: number, vol: number) => freqs.map((f, i) => n(wave, f, i * step, dur, vol));

// Note frequencies (Hz).
const C5 = 523, E5 = 659, G5 = 784, C6 = 1047, A4 = 440, F4 = 349, D4 = 294, B3 = 247;

export const SOUNDS: Record<SoundId, Note[]> = {
  hit: [n('noise', 2400, 0, 0.07, 0.5), n('square', 180, 0, 0.08, 0.25, 90)],
  block: [n('triangle', 900, 0, 0.06, 0.3, 700), n('noise', 5000, 0, 0.04, 0.2)],
  cast: run('square', [392, 523, 659], 0.05, 0.09, 0.18),
  heal: [n('sine', 600, 0, 0.18, 0.3, 1200), n('sine', 900, 0.06, 0.18, 0.2, 1500)],
  shield: [n('triangle', 1200, 0, 0.16, 0.22, 1600), n('triangle', 1800, 0.05, 0.12, 0.15)],
  death: [n('square', 330, 0, 0.32, 0.25, 70), n('noise', 900, 0, 0.25, 0.25)],
  burst: [n('noise', 3000, 0, 0.3, 0.6), n('sine', 160, 0, 0.35, 0.5, 40)],
  summon: run('triangle', [C5, G5, C6], 0.05, 0.1, 0.22),
  overtime: [n('sawtooth', 220, 0, 0.25, 0.2), n('sawtooth', 208, 0.28, 0.3, 0.2)],
  buy: [n('square', 988, 0, 0.06, 0.2), n('square', 1319, 0.06, 0.12, 0.2)],
  sell: [n('square', 1319, 0, 0.06, 0.18), n('square', 880, 0.06, 0.1, 0.18)],
  reroll: run('square', [440, 554, 659, 880], 0.035, 0.05, 0.14),
  lock: [n('square', 1600, 0, 0.03, 0.2), n('noise', 6000, 0.02, 0.03, 0.2)],
  choose: [n('triangle', 784, 0, 0.08, 0.25), n('triangle', 1175, 0.06, 0.12, 0.25)],
  levelUp: run('square', [C5, E5, G5, C6], 0.07, 0.12, 0.18),
  error: [n('square', 110, 0, 0.16, 0.2), n('square', 104, 0.08, 0.14, 0.2)],
  fight: [n('noise', 400, 0, 0.12, 0.5), n('square', A4, 0.1, 0.12, 0.2), n('square', C5 * 1.5, 0.2, 0.2, 0.2)],
  victory: [...run('square', [C5, E5, G5], 0.1, 0.12, 0.2), n('square', C6, 0.3, 0.4, 0.22), n('triangle', C5, 0.3, 0.4, 0.2)],
  defeat: [...run('square', [A4, F4, D4], 0.16, 0.18, 0.2), n('triangle', B3, 0.48, 0.5, 0.22, 196)],
  achievement: run('triangle', [E5, G5, C6, E5 * 2], 0.06, 0.16, 0.22),
};

/** Most important first: a busy frame plays at most MAX_PER_FRAME of these. */
const COMBAT_PRIORITY: SoundId[] = ['death', 'burst', 'overtime', 'cast', 'summon', 'hit', 'block', 'heal', 'shield'];
export const MAX_PER_FRAME = 3;

/** The sounds a combat frame makes (the final frame's result sound is played by the result panel). */
export function frameSounds(frame: Frame): SoundId[] {
  const s = new Set<SoundId>();
  if (frame.kind === 'overtime') s.add('overtime');
  if (frame.ability) s.add('cast');
  for (const f of frame.fx) {
    if (f.kind === 'damage') {
      if (f.value > 0) s.add('hit');
      else if (f.absorbed > 0) s.add('block');
    } else if (f.kind === 'heal' && f.value > 0) s.add('heal');
    else if (f.kind === 'shield' && f.value > 0) s.add('shield');
    else if (f.kind === 'death') s.add('death');
    else if (f.kind === 'burst') s.add('burst');
    else if (f.kind === 'summon') s.add('summon');
  }
  return COMBAT_PRIORITY.filter((id) => s.has(id)).slice(0, MAX_PER_FRAME);
}

import { describe, expect, it } from 'vitest';
import type { Frame, Fx } from '../game/playback.ts';
import { frameSounds, MAX_PER_FRAME, SOUNDS } from './sounds.ts';

const frame = (fx: Fx[], over: Partial<Frame> = {}): Frame => ({
  kind: 'turn',
  tick: 1,
  gap: 0,
  units: {},
  actor: null,
  ability: null,
  attacked: [],
  fx,
  events: [],
  ...over,
});

describe('sounds', () => {
  it('are short, audible and valid', () => {
    for (const [id, notes] of Object.entries(SOUNDS)) {
      expect(notes.length, id).toBeGreaterThan(0);
      for (const n of notes) {
        expect(n.freq, id).toBeGreaterThan(0);
        expect(n.vol, id).toBeGreaterThan(0);
        expect(n.vol, id).toBeLessThanOrEqual(1);
        expect(n.at + n.dur, id).toBeLessThan(1.2);
      }
    }
  });

  it('maps a frame to its sounds, most important first', () => {
    expect(frameSounds(frame([{ kind: 'damage', target: 'e0', value: 5, absorbed: 0 }]))).toEqual(['hit']);
    expect(frameSounds(frame([{ kind: 'damage', target: 'e0', value: 0, absorbed: 5 }]))).toEqual(['block']);
    expect(
      frameSounds(
        frame(
          [
            { kind: 'heal', target: 'p0', value: 4 },
            { kind: 'damage', target: 'e0', value: 9, absorbed: 0 },
            { kind: 'death', target: 'e0' },
            { kind: 'shield', target: 'p1', value: 3 },
          ],
          { ability: 'Fireball' },
        ),
      ),
    ).toEqual(['death', 'cast', 'hit']);
  });

  it('caps a busy frame and stays quiet on an empty one', () => {
    const busy: Fx[] = [
      { kind: 'burst', target: 'e0', name: 'Rune' },
      { kind: 'summon', target: 'p5' },
      { kind: 'heal', target: 'p0', value: 1 },
      { kind: 'shield', target: 'p0', value: 1 },
      { kind: 'death', target: 'e1' },
    ];
    expect(frameSounds(frame(busy))).toHaveLength(MAX_PER_FRAME);
    expect(frameSounds(frame([]))).toEqual([]);
    expect(frameSounds(frame([], { kind: 'overtime' }))).toEqual(['overtime']);
  });
});

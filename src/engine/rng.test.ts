import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from './rng.ts';

const take = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.next());

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    expect(take(new Rng(42), 20)).toEqual(take(new Rng(42), 20));
    expect(take(new Rng('run-7'), 20)).toEqual(take(new Rng('run-7'), 20));
  });

  it('produces different sequences for different seeds', () => {
    expect(take(new Rng(1), 5)).not.toEqual(take(new Rng(2), 5));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  it('keeps next() in [0, 1) and int() in range', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 5000; i++) {
      const f = rng.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = rng.int(5);
      expect(Number.isInteger(n) && n >= 0 && n < 5).toBe(true);
    }
  });

  it('is roughly uniform', () => {
    const rng = new Rng(99);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 40_000; i++) counts[rng.int(4)]! += 1;
    for (const c of counts) expect(Math.abs(c - 10_000)).toBeLessThan(500);
  });

  it('chance() short-circuits at 0 and 1 without consuming state', () => {
    const a = new Rng(5);
    const b = new Rng(5);
    expect(a.chance(1)).toBe(true);
    expect(a.chance(0)).toBe(false);
    expect(a.next()).toBe(b.next());
  });

  it('pick() throws on an empty array', () => {
    expect(() => new Rng(1).pick([])).toThrow();
  });

  it('fork() is deterministic and independent of later parent draws', () => {
    const a = new Rng(3).fork();
    const b = new Rng(3).fork();
    expect(take(a, 10)).toEqual(take(b, 10));
  });
});

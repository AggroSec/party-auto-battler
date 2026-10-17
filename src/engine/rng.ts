/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * The engine never touches Math.random. Every random decision takes an Rng
 * that the caller passes in, so the same seed and the same inputs always
 * produce the same result.
 */
export class Rng {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    if (p >= 1) return true;
    if (p <= 0) return false;
    return this.next() < p;
  }

  /** Uniformly pick one element. Throws on an empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty array');
    return items[this.int(items.length)] as T;
  }

  /** Derive an independent generator, e.g. one per combat in a run. */
  fork(): Rng {
    return new Rng(this.int(4294967296));
  }
}

/** Hash a string seed to a 32-bit integer (FNV-1a with a final avalanche). */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

import { describe, expect, it } from 'vitest';
import { absorb, mitigate, resolveAmount } from './damage.ts';

describe('mitigate', () => {
  it('deals full damage at 0 DEF', () => {
    expect(mitigate(10, 0)).toBe(10);
  });

  it('halves damage at 10 DEF (diminishing returns)', () => {
    expect(mitigate(10, 10)).toBe(5);
    expect(mitigate(10, 30)).toBe(3); // 2.5 rounds to 3
  });

  it('always deals at least 1 for a positive hit', () => {
    expect(mitigate(1, 1000)).toBe(1);
  });

  it('deals 0 for non-positive raw damage', () => {
    expect(mitigate(0, 0)).toBe(0);
    expect(mitigate(-5, 0)).toBe(0);
  });

  it('ignores DEF when piercing', () => {
    expect(mitigate(10, 10, true)).toBe(10);
  });

  it('treats negative DEF as 0', () => {
    expect(mitigate(10, -5)).toBe(10);
  });
});

describe('resolveAmount', () => {
  const src = { atk: 6, def: 2, maxHp: 30 };

  it('combines flat and stat scalings', () => {
    expect(resolveAmount({ flat: 2, atk: 1.5 }, src)).toBe(11);
    expect(resolveAmount({ def: 2, maxHp: 0.1 }, src)).toBe(7);
  });

  it('never goes negative', () => {
    expect(resolveAmount({ flat: -50 }, src)).toBe(0);
  });
});

describe('absorb', () => {
  it('soaks damage with shields first', () => {
    expect(absorb(7, 5)).toEqual({ toShield: 5, toHp: 2 });
    expect(absorb(3, 5)).toEqual({ toShield: 3, toHp: 0 });
    expect(absorb(3, 0)).toEqual({ toShield: 0, toHp: 3 });
  });
});

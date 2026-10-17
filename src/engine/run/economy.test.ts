import { describe, expect, it } from 'vitest';
import { interestFor, roundIncome, streakBonusFor } from './economy.ts';
import { TEST_CONFIG as cfg } from './test-fixtures.ts';

describe('economy', () => {
  it('pays 1 interest per interestPer unspent gold, capped', () => {
    expect(interestFor(0, cfg)).toBe(0);
    expect(interestFor(4, cfg)).toBe(0);
    expect(interestFor(5, cfg)).toBe(1);
    expect(interestFor(9, cfg)).toBe(1);
    expect(interestFor(10, cfg)).toBe(2);
    expect(interestFor(50, cfg)).toBe(2);
    expect(interestFor(-3, cfg)).toBe(0);
  });

  it('applies the highest streak tier reached by wins or losses', () => {
    expect(streakBonusFor(0, 0, cfg)).toBe(0);
    expect(streakBonusFor(1, 0, cfg)).toBe(0);
    expect(streakBonusFor(2, 0, cfg)).toBe(1);
    expect(streakBonusFor(0, 3, cfg)).toBe(1);
    expect(streakBonusFor(5, 0, cfg)).toBe(2);
  });

  it('sums base, interest and streak into round income', () => {
    expect(roundIncome(12, 4, 0, cfg)).toEqual({ base: 5, interest: 2, streak: 2, total: 9 });
    expect(roundIncome(0, 0, 0, cfg)).toEqual({ base: 5, interest: 0, streak: 0, total: 5 });
  });
});

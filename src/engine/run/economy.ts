import type { IncomeBreakdown, RunConfig } from './types.ts';

export function interestFor(gold: number, config: RunConfig): number {
  return Math.min(config.maxInterest, Math.floor(Math.max(0, gold) / config.interestPer));
}

/** Highest streak tier reached by either a win or a loss streak. */
export function streakBonusFor(winStreak: number, lossStreak: number, config: RunConfig): number {
  const streak = Math.max(winStreak, lossStreak);
  return config.streakBonuses.reduce((best, tier) => (streak >= tier.streak ? Math.max(best, tier.gold) : best), 0);
}

/**
 * Gold granted between rounds. Interest is paid on gold left unspent at the
 * end of the shop phase; streaks reward both momentum and comebacks.
 */
export function roundIncome(
  unspentGold: number,
  winStreak: number,
  lossStreak: number,
  config: RunConfig,
): IncomeBreakdown {
  const base = config.baseIncome;
  const interest = interestFor(unspentGold, config);
  const streak = streakBonusFor(winStreak, lossStreak, config);
  return { base, interest, streak, total: base + interest + streak };
}

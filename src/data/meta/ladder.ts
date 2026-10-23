import type { EliteRules, LadderTier } from '../../engine/run/content-types.ts';

/**
 * The difficulty ladder (M7). Tier 0 is the base game; winning a run on tier
 * N unlocks tier N+1, and each tier adds its modifier on top of every
 * earlier one (Brandon: 10 stacking tiers).
 */
export const LADDER: LadderTier[] = [
  { tier: 1, description: 'Rerolls cost 1 more gold.', modifier: { rerollCost: 1 } },
  { tier: 2, description: 'Start with 1 less gold.', modifier: { startingGold: -1 } },
  { tier: 3, description: 'Interest is capped 1 gold lower.', modifier: { maxInterest: -1 } },
  { tier: 4, description: 'Start with one less life.', modifier: { startingLives: -1 } },
  { tier: 5, description: 'Enemies have +5% HP and ATK.', modifier: { enemyStats: 0.05 } },
  { tier: 6, description: 'From round 8, every enemy carries one more item.', modifier: { enemyExtraItemFrom: 8 } },
  { tier: 7, description: 'From round 8, one enemy per fight is an Elite.', modifier: { elitesFrom: 8 } },
  { tier: 8, description: 'Rounds 5, 10 and 15 are boss fights.', modifier: { bossRounds: [5, 10, 15] } },
  { tier: 9, description: 'Elites appear from round 5.', modifier: { elitesFrom: 5 } },
  { tier: 10, description: 'Enemies have +5% more HP and ATK, and bosses cast a second ability.', modifier: { enemyStats: 0.05, empoweredBosses: true } },
];

/** Elites: tougher and hit harder than their peers. */
export const ELITE: EliteRules = { statMultiplier: { hp: 1.2, atk: 1.2 }, levels: 0 };

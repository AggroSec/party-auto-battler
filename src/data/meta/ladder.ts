import type { EliteRules, LadderTier } from '../../engine/run/content-types.ts';

/**
 * The difficulty ladder (M7). Tier 0 is the base game; winning a run on tier
 * N unlocks tier N+1, and each tier adds its modifier on top of every
 * earlier one (Brandon: 10 stacking tiers).
 */
export const LADDER: LadderTier[] = [
  { tier: 1, description: 'Enemies have +10% HP and ATK.', modifier: { enemyStats: 0.1 } },
  { tier: 2, description: 'Start with 2 less gold.', modifier: { startingGold: -2 } },
  { tier: 3, description: 'From round 5, every enemy carries one more item.', modifier: { enemyExtraItemFrom: 5 } },
  { tier: 4, description: 'Start with one less life.', modifier: { startingLives: -1 } },
  { tier: 5, description: 'From round 6, one enemy per fight is an Elite.', modifier: { elitesFrom: 6 } },
  { tier: 6, description: 'Rerolls cost 1 more gold.', modifier: { rerollCost: 1 } },
  { tier: 7, description: 'Enemies are about one level higher.', modifier: { enemyLevels: 1 } },
  { tier: 8, description: 'Rounds 5, 10 and 15 are boss fights.', modifier: { bossRounds: [5, 10, 15] } },
  { tier: 9, description: 'Interest is capped 1 gold lower.', modifier: { maxInterest: -1 } },
  { tier: 10, description: 'Enemies have +15% more HP and ATK, and bosses cast a second ability.', modifier: { enemyStats: 0.15, empoweredBosses: true } },
];

/** Elites: tougher, hit harder and are a level ahead of their peers. */
export const ELITE: EliteRules = { statMultiplier: { hp: 1.3, atk: 1.3 }, levels: 1 };

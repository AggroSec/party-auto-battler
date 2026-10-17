import type { EnemyArchetype, EnemyScaling } from '../engine/run/types.ts';

/**
 * Enemy roster. Each archetype fights as a class with small stat tweaks so
 * enemies read as their own faction rather than mirror copies of the player.
 */
export const ENEMY_ARCHETYPES: readonly EnemyArchetype[] = [
  { id: 'brute', name: 'Bandit Brute', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.1, atk: 0.9 } },
  { id: 'cutthroat', name: 'Cutthroat', classId: 'rogue', minRound: 1 },
  { id: 'poacher', name: 'Poacher', classId: 'ranger', minRound: 1, statMultiplier: { hp: 0.9 } },
  { id: 'hedge-mage', name: 'Hedge Mage', classId: 'mage', minRound: 2 },
  { id: 'acolyte', name: 'Cult Acolyte', classId: 'cleric', minRound: 3 },
  { id: 'bonecaller', name: 'Bonecaller', classId: 'necromancer', minRound: 5 },
];

/** Tuned with `npm run sim`; see docs/BALANCE.md. */
export const ENEMY_SCALING: EnemyScaling = {
  unitsByRound: [2, 3, 4, 5],
  // Full-size enemy parties arrive early but weaker (75%), then outgrow the player's
  // base units around round 8. Retune in M3 once units gain XP, talents and items.
  baseMultiplier: 0.75,
  hpGrowthPerRound: 0.0375,
  atkGrowthPerRound: 0.0275,
};

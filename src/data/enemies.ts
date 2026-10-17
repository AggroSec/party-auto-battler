import type { EnemyArchetype, EnemyProgression, EnemyScaling } from '../engine/run/types.ts';

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
  // M3: player units now level, advance and gear up, so enemies start near
  // full strength and grow 7% HP / 4.5% ATK per round on top of their own levels.
  baseMultiplier: 0.95,
  hpGrowthPerRound: 0.07,
  atkGrowthPerRound: 0.045,
};

/** Enemies level, advance and gear up alongside the player. Tuned with `npm run sim`. */
export const ENEMY_PROGRESSION: EnemyProgression = {
  // Fractional: e.g. 2.4 = each unit is level 3 with 40% chance, else level 2.
  levelByRound: [1, 1.3, 1.7, 2, 2.4, 2.8, 3, 3.3, 3.6, 3.9, 4.2, 4.5, 4.8, 5],
  itemsByRound: [0, 0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2],
};

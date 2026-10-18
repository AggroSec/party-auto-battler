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
  { id: 'brawler', name: 'Temple Brawler', classId: 'monk', minRound: 2 },
  { id: 'minstrel', name: 'Wandering Minstrel', classId: 'bard', minRound: 3 },
  { id: 'grove-keeper', name: 'Grove Keeper', classId: 'druid', minRound: 3 },
  { id: 'tinker', name: 'Goblin Tinker', classId: 'engineer', minRound: 4, statMultiplier: { hp: 0.9 } },
  { id: 'cultist', name: 'Blood Cultist', classId: 'warlock', minRound: 4 },
  { id: 'bonecaller', name: 'Bonecaller', classId: 'necromancer', minRound: 5 },
];

/** Tuned with `npm run sim`; see docs/BALANCE.md. */
export const ENEMY_SCALING: EnemyScaling = {
  unitsByRound: [2, 3, 4, 5],
  // M5: players now choose their stat points (stronger than the old random
  // rolls), so enemies start at full strength and grow 8% HP / 5% ATK per
  // round on top of their own levels.
  baseMultiplier: 1,
  hpGrowthPerRound: 0.08,
  atkGrowthPerRound: 0.05,
};

/** Enemies level, advance and gear up alongside the player. Tuned with `npm run sim`. */
export const ENEMY_PROGRESSION: EnemyProgression = {
  // Fractional: e.g. 2.4 = each unit is level 3 with 40% chance, else level 2.
  // M5: a gentler climb through level 3 (advanced classes) and a plateau
  // after round 10, so the late game is hard without being a wall.
  levelByRound: [1, 1.3, 1.7, 2.1, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.1, 4.3, 4.4, 4.5],
  itemsByRound: [0, 0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.3, 1.4, 1.5, 1.6],
};

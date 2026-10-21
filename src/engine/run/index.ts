export { applyShopAction, autoAllocate, createRun, fight } from './run.ts';
export {
  allSlots,
  autoPlaceSlot,
  emptyBoard,
  getSlot,
  instantiate,
  isValidSlot,
  unitCount,
  FRONT_ROW_MAX_PLACEMENT,
} from './board.ts';
export {
  activeSynergies,
  boardUnits,
  buildModifiers,
  buildSources,
  classFor,
  effectiveClassId,
  newUnit,
  resolveBoard,
  resolveUnit,
  synergyModifiersFor,
  synergySources,
  unitTags,
  type ActiveSynergy,
  type ModifierSource,
} from './build.ts';
export { explainUnit, type Contribution, type UnitExplanation } from './explain.ts';
export { interestFor, roundIncome, streakBonusFor } from './economy.ts';
export { enemyCount, generateEnemy, roundScaling, type EnemyParty } from './enemies.ts';
export {
  allocatePoints,
  grantXp,
  isMaxLevel,
  maxLevel,
  recommendedAllocation,
  sample,
  spentPoints,
  statWeights,
  STATS,
  talentOptions,
  type StatPoints,
} from './progression.ts';
export { rollShop } from './shop.ts';
export type * from './types.ts';
export type { PlayLogEntry } from './log.ts';

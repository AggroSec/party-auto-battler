export { applyShopAction, autoAllocate, createRun, equipError, fight, rerollCost } from './run.ts';
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
  classTiers,
  effectiveClassId,
  filledSlots,
  matchesFilter,
  newUnit,
  resolveBoard,
  resolveUnit,
  synergyModifiersFor,
  synergySources,
  tierMet,
  unitTags,
  type ActiveSynergy,
  type ModifierSource,
} from './build.ts';
export { explainUnit, type Contribution, type UnitExplanation } from './explain.ts';
export { interestFor, roundIncome, streakBonusFor } from './economy.ts';
export { enemyCount, generateEnemy, roundScaling, type EnemyParty } from './enemies.ts';
export {
  allocatePoints,
  choiceOptions,
  classOptions,
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
export { rollShop, tertiaryItemFor, wantedTertiaryItems, TERTIARY_ITEM_CHANCE } from './shop.ts';
export { defaultSetup, mergeRunModifiers, recruitCost, runContext, setupModifiers } from './setup.ts';
export type * from './types.ts';
export type { PlayLogEntry } from './log.ts';

import type { ClassTemplate } from '../engine/run/content-types.ts';

export type ClassId =
  | 'warrior'
  | 'rogue'
  | 'mage'
  | 'cleric'
  | 'ranger'
  | 'necromancer'
  | 'monk'
  | 'bard'
  | 'druid'
  | 'warlock'
  | 'engineer'
  | 'runeblade'
  | 'dark-knight'
  | 'cultist';

export type ClassRole = 'frontline' | 'striker' | 'caster' | 'support';

/**
 * A playable class. `triggers` are innate passives; `statWeights` is the
 * recommended stat-point spread; `talents` is the level-2 pool and
 * `advancedClasses` the level-3 choice.
 */
export interface ClassDef extends ClassTemplate {
  id: ClassId;
  role: ClassRole;
  /** Locked behind meta progression. */
  unlockable: boolean;
  description: string;
}

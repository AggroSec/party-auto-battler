// Shapes for build content: talents, advanced classes, items and synergies.
// All of it is data (src/data); special behaviour goes through UnitModifier.
import type { AbilityDef, StatKey, Stats, TargetSelector, TriggeredEffect, UnitTemplate } from '../types.ts';

/**
 * A bundle of changes to a unit. Talents, items, advanced classes and
 * synergies are all expressed as modifiers, and they stack.
 */
export interface UnitModifier {
  /** Flat stat changes. */
  stats?: Partial<Stats>;
  /** Extra triggered effects. */
  triggers?: readonly TriggeredEffect[];
  /** Ignore the back-row melee penalty. */
  reach?: boolean;
  /** Additive lifesteal fraction (0.2 = heal 20% of damage dealt). */
  lifesteal?: number;
  /** Additive ability power (0.25 = +25% ability damage/heals/shields). */
  abilityPower?: number;
  /** Change to ability cooldown in turns (negative = faster; never below 1). Applies to every ability. */
  abilityCooldown?: number;
  /** An extra ability with its own cadence, cast alongside the class ability (M6). */
  grantAbility?: AbilityDef;
}

export interface TalentDef extends UnitModifier {
  id: string;
  name: string;
  description: string;
}

export interface AdvancedClassDef {
  id: string;
  name: string;
  /** The base class this advances from. */
  baseClassId: string;
  description: string;
  /** Replaces the base class's synergy tags. */
  tags: readonly string[];
  /** Replaces the base class's ability. */
  ability: AbilityDef;
  /** Overrides basic-attack targeting, if set. */
  attackTarget?: TargetSelector;
  /** Stat bonus and passive(s) granted on advancing. */
  modifier: UnitModifier;
  /** Describes the modifier's triggers and traits (not its stats). */
  passive?: PassiveText;
  /** Talent ids offered at levels 4 and 5. */
  talents: readonly string[];
  /** Replaces the base class's recommended stat spread. */
  statWeights?: StatWeights;
  /** The two tertiary classes offered at the ascend level (M6). */
  tertiaryClasses?: readonly string[];
}

/**
 * A tertiary class (M6): the level-7 step after an advanced class. Same shape
 * as an advanced class; its ability, tags and talent pool replace the
 * advanced class's, and its modifier stacks on top.
 */
export interface TertiaryClassDef extends Omit<AdvancedClassDef, 'tertiaryClasses'> {
  advancedClassId: string;
}

/**
 * Relative weights for the recommended stat-point spread (e.g. a Warrior
 * leans HP and DEF). Players may ignore it; enemies and "Recommended" use it.
 */
export type StatWeights = Readonly<Record<StatKey, number>>;

/** Rules text for a class's built-in passive, shown in the UI (display only). */
export interface PassiveText {
  name: string;
  description: string;
}

/** A playable class as the run layer sees it. */
export interface ClassTemplate extends UnitTemplate {
  tags: readonly string[];
  /** Describes the class's built-in triggers, if it has any. */
  passive?: PassiveText;
  statWeights: StatWeights;
  /** Talent ids offered at level 2. */
  talents: readonly string[];
  /** The two advanced classes offered at level 3. */
  advancedClasses: readonly string[];
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  modifier: UnitModifier;
  /**
   * Extra effect when equipped by one of these classes (base or advanced).
   * Anyone can equip the item; the tied class gets more out of it.
   */
  classBonus?: { classIds: readonly string[]; description: string; modifier: UnitModifier };
}

export type SynergyRequirement =
  | { kind: 'tag'; tag: string; count: number }
  /** Number of different base classes on the board. */
  | { kind: 'distinctClasses'; count: number };

export interface SynergyTier {
  /** All requirements must be met. */
  requires: readonly SynergyRequirement[];
  description: string;
  modifier: UnitModifier;
  /** Who gets the modifier: units with this tag, or the whole party. */
  appliesTo: { tag: string } | 'all';
}

export interface SynergyDef {
  id: string;
  name: string;
  /** Ordered weakest first; the highest tier whose requirements are met is active. */
  tiers: readonly SynergyTier[];
}

/** XP, levels and training. */
export interface ProgressionConfig {
  /** Cumulative XP needed for each level: index 0 = level 1 (always 0). */
  xpForLevel: readonly number[];
  xpPerWin: number;
  xpPerLoss: number;
  xpPerDraw: number;
  /** Level at which a unit chooses its advanced class. */
  advanceLevel: number;
  /** Level at which a unit picks a tertiary class (M6). */
  ascendLevel: number;
  /** Stat points granted on reaching each level: index 0 = level 1 (always 0). */
  statPointsByLevel: readonly number[];
  /** What one stat point buys in each stat. */
  statPointValue: Readonly<Stats>;
  /** Talent options offered per level-up. */
  talentChoices: number;
  trainingXp: number;
  trainingCost: number;
  maxItemsPerUnit: number;
  /** Refund per equipped item when its unit is sold. */
  itemSellRefund: number;
}

export interface ShopLayout {
  unitSlots: number;
  /** Slots that roll items or training. */
  extraSlots: number;
  /** Chance an extra slot rolls training (if you own a unit) instead of an item. */
  trainingChance: number;
  /** Recruit slots once the board is full; the rest go to items and training. */
  fullPartyUnitSlots: number;
}

/**
 * Enemy development by round (index 0 = round 1; later rounds reuse the last
 * entry). Values may be fractional: 2.4 means each unit is level 3 with 40%
 * chance, else level 2, so enemy power ramps smoothly instead of in steps.
 */
export interface EnemyProgression {
  levelByRound: readonly number[];
  /** Items per enemy unit (fractional = chance of one more). */
  itemsByRound: readonly number[];
}

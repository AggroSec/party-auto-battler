// Shapes for build content: talents, advanced classes, items and synergies.
// All of it is data (src/data); special behaviour goes through UnitModifier.
import type { AbilityDef, Rule, StatKey, Stats, TargetSelector, TriggeredEffect, UnitTemplate } from '../types.ts';

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
  /** Survive one lethal hit at this fraction of max HP. Each source adds one revive (M7). */
  revive?: number;
  /** Additive extra damage against targets below 50% HP (0.5 = +50%) (M7). */
  executeBonus?: number;
  /** Statuses that each satisfy an execution on their own (rules mode, Soulreaver's signature). */
  executeWith?: readonly string[];
  /** Additive chance of critical hits (0.15 = 15%) (Mercenary). */
  critChance?: number;
  /** Rules mode (skill augments): extra power for one skill, by skill id (0.3 = +30%). */
  skillPower?: Readonly<Record<string, number>>;
  /** Rules mode (skill augments): cooldown change for one skill, by skill id. */
  skillCooldown?: Readonly<Record<string, number>>;
  /** Rules mode (skill augments): skills that use their `empowered` version, by skill id. */
  skillUpgrade?: readonly string[];
  /** A start-of-combat speed burst that wears off after a tick (Strength of the Tribe). The biggest burst wins. */
  speedBurst?: { spd: number; untilTick: number };
  /** Additive fraction of overhealing that becomes a shield (Sylvan's Lifebinder). */
  overhealShield?: number;
}

/** Rules mode: a class tier's skills and the default rules that use them. */
export interface SkillKit {
  /** Skills this tier adds to the unit's kit. */
  skills?: readonly AbilityDef[];
  /** Default rules for them, tried before the earlier tiers' defaults. */
  rules?: readonly Rule[];
}

/**
 * How many items a class tier can carry, if not the usual (Mercenary). A unit
 * keeps what it already holds when it changes class; the rules apply to new items.
 */
export interface ItemRules {
  slots: number;
  /** At most this many items that aren't weapons (Walking Armory: 0). */
  maxNonWeapons?: number;
  /** The first weapon counts twice (Oathsworn's sworn weapon). */
  doubleFirstWeapon?: boolean;
}

export interface TalentDef extends UnitModifier {
  id: string;
  name: string;
  description: string;
  /** The base class it comes from; a class that borrows talents only draws from unlocked ones, and shows this. */
  sourceClassId?: string;
  /** Extra synergy tags while the unit has this talent (borrowed abilities). */
  tags?: readonly string[];
}

/** A class's passive that a borrowing class picks up once its build uses that class's status. */
export interface BorrowedPassive {
  statusId: string;
  passive: PassiveText;
  triggers: readonly TriggeredEffect[];
}

export interface AdvancedClassDef extends SkillKit {
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
  /** Borrowing classes: by level, the granted-ability talents this tier can choose from. */
  borrows?: Readonly<Record<number, readonly string[]>>;
  /** Extra talent options per level-up while this is the unit's class. */
  extraTalentChoices?: number;
  /** Talents from this tier come only from the base class of the ability borrowed at the ascend level. */
  focusBorrowed?: boolean;
  /** Item slots, if not the usual. */
  items?: ItemRules;
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
export interface ClassTemplate extends UnitTemplate, SkillKit {
  tags: readonly string[];
  /** Party role ('frontline', 'striker', 'caster', 'support'), for role synergies. */
  role?: string;
  /** Describes the class's built-in triggers, if it has any. */
  passive?: PassiveText;
  statWeights: StatWeights;
  /** Talent ids offered at level 2. */
  talents: readonly string[];
  /** The two advanced classes offered at level 3. */
  advancedClasses: readonly string[];
  /** At most one per party. */
  uniqueInParty?: boolean;
  /** Recruits of this class always have this name. */
  fixedName?: string;
  /** Levels that also offer a borrowed ability (see AdvancedClassDef.borrows); talents come from other classes. */
  borrowLevels?: readonly number[];
  /** Other classes' passives this class picks up when its build needs them. */
  borrowedPassives?: readonly BorrowedPassive[];
  /** Gold earned after every won fight per unit of this class (Mercenary's Hazard Pay). */
  goldPerWin?: number;
  /** A boss's own class: never offered in the shop or used by regular enemies. */
  bossOnly?: boolean;
  /** Rules-mode classes: the class whose colour and icon it shares (e.g. 'warrior'). */
  look?: string;
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
  /**
   * Signature item of a tertiary class (M7): only that class can equip it, it is
   * offered only while one is in the party, and a unit holds at most one copy.
   */
  tertiaryClassId?: string;
  /** Gold earned after every won fight while equipped (M7). */
  goldPerWin?: number;
  /** A weapon: counts for weapon slots and per-weapon effects (Mercenary). */
  weapon?: boolean;
  /** A consumable: goes in the unit's consumable slot and is used up when its trigger fires. */
  consumable?: boolean;
}

/**
 * Which units count for (or receive) a synergy. A unit matches if it has any
 * of `tags`, its base class has one of `roles`, or its base, advanced or
 * tertiary class is one of `classIds`. Set several fields to widen the match.
 */
export interface UnitFilter {
  tags?: readonly string[];
  roles?: readonly string[];
  classIds?: readonly string[];
}

export type SynergyRequirement =
  | { kind: 'tag'; tag: string; count: number }
  /** Number of different base classes on the board. */
  | { kind: 'distinctClasses'; count: number }
  /** At least `count` units matching the filter (M7). `label` names them in the UI ("Light units"). */
  | { kind: 'units'; filter: UnitFilter; count: number; label: string }
  /**
   * A different unit for each filter, e.g. a guardian, a healer and a damage
   * dealer (M7). `label` names the line-up in the UI ("trinity roles"). With
   * `count`, at least that many of the filters (each a different unit) will do:
   * Strength of the Tribe wants 3, 4 or 5 different Tribe classes, no doubles.
   */
  | { kind: 'party'; slots: readonly UnitFilter[]; label: string; count?: number };

export interface SynergyTier {
  /** All requirements must be met. */
  requires: readonly SynergyRequirement[];
  description: string;
  modifier: UnitModifier;
  /** Who gets the modifier: units with this tag, units matching a filter, or the whole party. */
  appliesTo: { tag: string } | { filter: UnitFilter } | 'all';
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
  /** Slots that always offer a consumable (default 0). */
  consumableSlots?: number;
  /** Chance a won fight drops a free consumable into the next shop (default 0). */
  consumableDropChance?: number;
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

/**
 * A change to a whole run (M7): ladder tiers and starting perks are both
 * expressed as run modifiers, and they stack (numbers add up, flags combine).
 */
export interface RunModifier {
  startingGold?: number;
  startingLives?: number;
  rerollCost?: number;
  lockCost?: number;
  /** Extra shop offers that can be locked at once. */
  lockSlots?: number;
  maxInterest?: number;
  trainingCost?: number;
  /** Extra talent options per level-up. */
  talentChoices?: number;
  /** Extra item/training slots in the shop. */
  shopSlots?: number;
  /** Extra stat points on every level-up. */
  statPointsPerLevel?: number;
  /** The first reroll each round is free. */
  freeReroll?: boolean;
  /** The first recruit of the run starts at level 2. */
  veteranRecruit?: boolean;
  /** The first lost fight costs no life. */
  secondWind?: boolean;
  /** Recruits cost `cost` during the first `rounds` rounds. */
  earlyRecruitCost?: { rounds: number; cost: number };
  /** Round 1's shop has an extra, free item. */
  freeItem?: boolean;
  /** Enemy HP and ATK multiplier bonus (0.1 = +10%). */
  enemyStats?: number;
  /** From this round, every enemy carries one more item (up to the item limit). */
  enemyExtraItemFrom?: number;
  /** Extra enemy levels, ramping in over the first rounds. */
  enemyLevels?: number;
  /** From this round, one enemy per fight is an Elite. */
  elitesFrom?: number;
  /** These rounds are boss fights. */
  bossRounds?: readonly number[];
  /** Bosses also cast their second ability. */
  empoweredBosses?: boolean;
  /** Lives a lost boss fight costs (instead of 1). The largest value wins. */
  bossLossLives?: number;
  /** bossLossLives applies only to boss rounds from this round on (tier 11: the late bosses). */
  bossLossFrom?: number;
  /** Boss rounds field the unique bosses instead of the class-based ones. */
  uniqueBosses?: boolean;
  /** From this round, a second enemy per fight is an Elite. */
  secondEliteFrom?: number;
  /** From this round, enemies carry consumables. */
  enemyConsumablesFrom?: number;
  /** The shop never offers recruits (story mode: the story gives the party). */
  noRecruits?: boolean;
}

/** One rung of the difficulty ladder; tier N applies tiers 1..N. */
export interface LadderTier {
  tier: number;
  description: string;
  modifier: RunModifier;
}

/** A starting perk, picked at the start of a run. */
export interface PerkDef {
  id: string;
  name: string;
  description: string;
  modifier: RunModifier;
}

/**
 * A boss (M7): replaces one enemy on a boss round. It fights as its class,
 * levelled and scaled like the other enemies, then multiplied, with its own
 * passive and (on empowered tiers) a second ability.
 */
export interface BossDef {
  id: string;
  name: string;
  classId: string;
  /** First round the boss can appear. */
  minRound: number;
  statMultiplier: Partial<Stats>;
  passive: PassiveText;
  modifier: UnitModifier;
  /** Granted when bosses are empowered. */
  ability: AbilityDef;
  /** A unique boss with its own class (ladder tier 13+), not a boss version of a regular class. */
  unique?: boolean;
}

/** How much stronger an Elite enemy is than its peers. */
export interface EliteRules {
  statMultiplier: Partial<Stats>;
  /** Extra levels on top of the round's enemy level. */
  levels: number;
}

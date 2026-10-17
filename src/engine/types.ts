/**
 * Core engine types. Content (classes, talents, items) is plain data that
 * conforms to these shapes. Special behaviour is expressed through Effects
 * attached to Triggers, never through bespoke code per class.
 */

export type StatKey = 'hp' | 'atk' | 'def' | 'spd';
export type BuffableStat = 'atk' | 'def' | 'spd';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export type Side = 'player' | 'enemy';
export type Row = 'front' | 'back';

export const FRONT_SLOTS = 3;
export const BACK_SLOTS = 2;

export interface BoardPos {
  row: Row;
  /** Front row: 0..2, back row: 0..1. */
  col: number;
}

/**
 * Who an effect hits. Enemy/ally is relative to the unit producing the effect.
 * - nearest: frontmost enemy row, preferring the closest column
 * - backlineFirst: lowest-HP enemy in the back row, else nearest rule
 * - lowestHp / highestAtk: across all living enemies
 * - randomEnemy: uniform pick via the seeded Rng
 * - enemyFrontRow: every living unit in the frontmost enemy row
 * - triggerSource / triggerTarget: the other units involved in a trigger
 *     onHurt:      triggerSource = attacker
 *     onAttack:    triggerTarget = unit attacked
 *     onKill:      triggerTarget = victim
 *     onAllyDeath: triggerSource = killer, triggerTarget = fallen ally
 */
export type TargetSelector =
  | 'nearest'
  | 'backlineFirst'
  | 'lowestHp'
  | 'highestAtk'
  | 'randomEnemy'
  | 'enemyFrontRow'
  | 'allEnemies'
  | 'self'
  | 'lowestHpAlly'
  | 'allAllies'
  | 'triggerSource'
  | 'triggerTarget';

/**
 * A number derived from the source unit's current stats:
 * flat + atk*source.atk + def*source.def + maxHp*source.maxHp
 */
export interface Amount {
  flat?: number;
  atk?: number;
  def?: number;
  maxHp?: number;
}

export type Effect =
  | {
      kind: 'damage';
      target: TargetSelector;
      amount: Amount;
      /** Repeat the effect N times, re-selecting the target each time. */
      hits?: number;
      /** Fraction of raw damage also dealt to row neighbours of each target. */
      splash?: number;
      /** Ignore the target's DEF. */
      pierce?: boolean;
    }
  | { kind: 'heal'; target: TargetSelector; amount: Amount }
  | { kind: 'shield'; target: TargetSelector; amount: Amount }
  /** Lasts until the end of combat. */
  | { kind: 'buff'; target: TargetSelector; stat: BuffableStat; amount: Amount }
  /** Lowers a stat for the rest of combat (never below 0). */
  | { kind: 'debuff'; target: TargetSelector; stat: BuffableStat; amount: Amount }
  /**
   * Shifts the target's ability cooldown by `turns`: negative = cast sooner
   * (haste), positive = delay. A hasted ability casts no sooner than next turn.
   */
  | { kind: 'cooldown'; target: TargetSelector; turns: number };

export type TriggerEvent =
  | 'startOfCombat'
  | 'onTurnStart'
  | 'onAttack'
  /** After the unit casts its ability. */
  | 'onAbility'
  | 'onHurt'
  /** The first time the unit drops below 50% HP in a combat (and survives). */
  | 'onBloodied'
  | 'onKill'
  | 'onAllyDeath';

export interface TriggeredEffect {
  /** Short display name, shown in the combat log ("Battle Hardened"). */
  label: string;
  on: TriggerEvent;
  effects: Effect[];
  /** Probability (0..1) the trigger fires each time. Defaults to 1. */
  chance?: number;
  /** Maximum number of times this trigger can fire per combat. */
  limit?: number;
}

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  /** The unit casts this on every Nth turn instead of a basic attack. */
  cooldown: number;
  /** Turns until the first cast. Defaults to `cooldown`. */
  initialCooldown?: number;
  effects: Effect[];
}

/**
 * Everything the combat engine needs to know about a unit. The run loop
 * (M2) and build systems (M3) assemble this from class data, talents and
 * items; the engine never looks content up by id.
 */
export interface UnitSetup {
  name: string;
  classId: string;
  stats: Stats;
  /** Melee units deal reduced damage from the back row while their front row stands. */
  range: Range;
  /** Targeting for basic attacks. Damage is 1x ATK. */
  attackTarget: TargetSelector;
  ability: AbilityDef;
  triggers: readonly TriggeredEffect[];
  /** Ignores the back-row melee penalty. */
  reach?: boolean;
  /** Heals the unit for this fraction of all damage it deals. */
  lifesteal?: number;
  /** Multiplier on the unit's ability damage, heals and shields (default 1). */
  abilityPower?: number;
}

export type Range = 'melee' | 'ranged';

/**
 * Class-level content the run layer turns into UnitSetups. Data files
 * (src/data) provide these; the combat engine itself never sees them.
 */
export interface UnitTemplate {
  id: string;
  name: string;
  baseStats: Stats;
  range: Range;
  attackTarget: TargetSelector;
  ability: AbilityDef;
  triggers: readonly TriggeredEffect[];
  /** Placement priority for auto-placement: lower = further forward. */
  placement: number;
}

export interface Party {
  front: readonly (UnitSetup | null)[];
  back: readonly (UnitSetup | null)[];
}

import type { CombatEvent, UnitId, UnitSnapshot, UnitSummary } from './events.ts';
import type { Rng } from './rng.ts';
import {
  BACK_SLOTS,
  FRONT_SLOTS,
  type BoardPos,
  type BuffableStat,
  type Party,
  type Side,
  type Stats,
  type StatusDef,
  type TriggeredEffect,
  type UnitSetup,
} from './types.ts';

/** A status on a unit (see StatusDef). */
export interface ActiveStatus {
  def: StatusDef;
  stacks: number;
  /** Who applied it last: credited for its damage, and its onBurst triggers fire. */
  source: CombatUnit;
  /** Own turns left; undefined = no duration. */
  turns?: number;
  /** DoT damage per stack, resolved from the applier. */
  dotPerStack: number;
  /** Stat changes currently applied by this status (so they undo exactly). */
  applied: Partial<Record<BuffableStat, number>>;
}

/** Mutable per-combat state of one unit. Lives only inside a simulateCombat call. */
export interface CombatUnit {
  id: UnitId;
  side: Side;
  pos: BoardPos;
  /** Index in board order (front 0..2, back 3..4). Used for deterministic tie-breaks. */
  order: number;
  setup: UnitSetup;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  shield: number;
  gauge: number;
  /** Turns until each ability is ready: the class ability first, then extraAbilities. */
  cooldowns: number[];
  /** Own turns of taunt left (0 = not taunting). */
  taunt: number;
  alive: boolean;
  /** Has dropped below 50% HP this combat (onBloodied fires once). */
  bloodied: boolean;
  /** Revives left (UnitSetup.revive). */
  revives: number;
  /** Fire counts per trigger, for TriggeredEffect.limit. */
  triggerFires: Map<TriggeredEffect, number>;
  stats: Omit<UnitSummary, 'id' | 'name' | 'side' | 'survived' | 'summonedBy'>;
  /** Set on summoned units. */
  summonedBy?: UnitId;
  /** Statuses by id (post-M7). */
  statuses: Map<string, ActiveStatus>;
}

export interface CombatState {
  tick: number;
  units: CombatUnit[];
  events: CombatEvent[];
  rng: Rng;
  /** Summons so far, for unique ids ("ps0", "es1", ...). */
  summons: number;
}

export function emit(state: CombatState, event: CombatEvent): void {
  state.events.push(event);
}

export function boardSlots(party: Party): { setup: UnitSetup; pos: BoardPos }[] {
  if (party.front.length > FRONT_SLOTS || party.back.length > BACK_SLOTS) {
    throw new Error(`Party has too many slots (max ${FRONT_SLOTS} front, ${BACK_SLOTS} back)`);
  }
  const slots: { setup: UnitSetup; pos: BoardPos }[] = [];
  party.front.forEach((setup, col) => {
    if (setup) slots.push({ setup, pos: { row: 'front', col } });
  });
  party.back.forEach((setup, col) => {
    if (setup) slots.push({ setup, pos: { row: 'back', col } });
  });
  return slots;
}

export function boardOrder(pos: BoardPos): number {
  return pos.row === 'front' ? pos.col : FRONT_SLOTS + pos.col;
}

export function createCombatUnits(party: Party, side: Side): CombatUnit[] {
  const prefix = side === 'player' ? 'p' : 'e';
  return boardSlots(party).map(({ setup, pos }) => makeCombatUnit(setup, side, pos, `${prefix}${boardOrder(pos)}`));
}

export function makeCombatUnit(setup: UnitSetup, side: Side, pos: BoardPos, id: UnitId): CombatUnit {
  const s: Stats = setup.stats;
  return {
    id,
    side,
    pos,
    order: boardOrder(pos),
    setup,
    maxHp: s.hp,
    hp: s.hp,
    atk: s.atk,
    def: s.def,
    spd: s.spd,
    shield: 0,
    gauge: 0,
    cooldowns: [setup.ability, ...(setup.extraAbilities ?? [])].map((a) => a.initialCooldown ?? a.cooldown),
    taunt: 0,
    alive: true,
    bloodied: false,
    revives: setup.revive?.times ?? 0,
    triggerFires: new Map(),
    statuses: new Map(),
    stats: { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldingDone: 0, kills: 0, attacks: 0, abilities: 0 },
  };
}

export function snapshot(unit: CombatUnit): UnitSnapshot {
  return {
    id: unit.id,
    name: unit.setup.name,
    classId: unit.setup.classId,
    side: unit.side,
    pos: { ...unit.pos },
    stats: { hp: unit.maxHp, atk: unit.atk, def: unit.def, spd: unit.spd },
  };
}

export function living(state: CombatState, side: Side): CombatUnit[] {
  return state.units.filter((u) => u.alive && u.side === side);
}

export function opponent(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

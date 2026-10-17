import type { CombatEvent, UnitId, UnitSnapshot, UnitSummary } from './events.ts';
import type { Rng } from './rng.ts';
import {
  BACK_SLOTS,
  FRONT_SLOTS,
  type BoardPos,
  type Party,
  type Side,
  type Stats,
  type TriggeredEffect,
  type UnitSetup,
} from './types.ts';

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
  cooldown: number;
  /** Own turns of taunt left (0 = not taunting). */
  taunt: number;
  alive: boolean;
  /** Has dropped below 50% HP this combat (onBloodied fires once). */
  bloodied: boolean;
  /** Fire counts per trigger, for TriggeredEffect.limit. */
  triggerFires: Map<TriggeredEffect, number>;
  stats: Omit<UnitSummary, 'id' | 'name' | 'side' | 'survived'>;
}

export interface CombatState {
  tick: number;
  units: CombatUnit[];
  events: CombatEvent[];
  rng: Rng;
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
  return boardSlots(party).map(({ setup, pos }) => {
    const order = boardOrder(pos);
    const s: Stats = setup.stats;
    return {
      id: `${prefix}${order}`,
      side,
      pos,
      order,
      setup,
      maxHp: s.hp,
      hp: s.hp,
      atk: s.atk,
      def: s.def,
      spd: s.spd,
      shield: 0,
      gauge: 0,
      cooldown: setup.ability.initialCooldown ?? setup.ability.cooldown,
      taunt: 0,
      alive: true,
      bloodied: false,
      triggerFires: new Map(),
      stats: { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldingDone: 0, kills: 0 },
    };
  });
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

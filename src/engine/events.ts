import type { BoardPos, BuffableStat, Side, Stats, TriggerEvent } from './types.ts';

/** Stable per-combat unit id: "p0".."p4" for the player, "e0".."e4" for the enemy. */
export type UnitId = string;

export type Winner = Side | 'draw';

/** `source` of damage/death events caused by sudden death rather than a unit. */
export const OVERTIME_SOURCE = 'overtime';

export interface UnitSnapshot {
  id: UnitId;
  name: string;
  classId: string;
  side: Side;
  pos: BoardPos;
  stats: Stats;
}

/**
 * The combat event log. The UI replays this; it never computes outcomes.
 * Every event carries the tick it happened on; most carry a source and/or target.
 */
export type CombatEvent =
  | { tick: number; type: 'combatStart'; units: UnitSnapshot[] }
  /** `gauges`: every living unit's action gauge as the turn starts (the actor's is still full). */
  | { tick: number; type: 'turn'; source: UnitId; gauges: Record<UnitId, number> }
  | { tick: number; type: 'attack'; source: UnitId; target: UnitId }
  | { tick: number; type: 'ability'; source: UnitId; abilityId: string; name: string }
  | { tick: number; type: 'trigger'; source: UnitId; label: string; on: TriggerEvent }
  | {
      tick: number;
      type: 'damage';
      /** A unit id, or OVERTIME_SOURCE for sudden-death damage. */
      source: UnitId;
      target: UnitId;
      /** HP actually lost. */
      value: number;
      /** Damage soaked by shields. */
      absorbed: number;
      hpAfter: number;
    }
  | { tick: number; type: 'heal'; source: UnitId; target: UnitId; value: number; hpAfter: number }
  | { tick: number; type: 'shield'; source: UnitId; target: UnitId; value: number; shieldAfter: number }
  | { tick: number; type: 'cooldown'; source: UnitId; target: UnitId; turns: number; cooldownAfter: number }
  | { tick: number; type: 'taunt'; source: UnitId; target: UnitId; turns: number }
  /** Stat change; `value` is negative for debuffs. */
  | {
      tick: number;
      type: 'buff';
      source: UnitId;
      target: UnitId;
      stat: BuffableStat;
      value: number;
      statAfter: number;
    }
  | { tick: number; type: 'death'; target: UnitId; source: UnitId }
  /** A sudden-death pulse: every living unit takes `percent` of max HP as true damage. */
  | { tick: number; type: 'overtime'; stage: number; percent: number }
  | { tick: number; type: 'combatEnd'; winner: Winner; reason: 'elimination' | 'tickCap' };

export type CombatEventType = CombatEvent['type'];

export interface UnitSummary {
  id: UnitId;
  name: string;
  side: Side;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  shieldingDone: number;
  kills: number;
  survived: boolean;
}

export interface CombatResult {
  winner: Winner;
  ticks: number;
  events: CombatEvent[];
  summary: UnitSummary[];
}

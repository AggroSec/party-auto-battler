// Turns a combat event log into animation frames. Pure: the UI only steps
// through frames; it never computes combat outcomes itself.
import type { BoardPos, BuffableStat, CombatEvent, CombatResult, Side, UnitId, Winner } from '../../engine/index.ts';

export interface UnitView {
  id: UnitId;
  name: string;
  classId: string;
  side: Side;
  pos: BoardPos;
  maxHp: number;
  hp: number;
  shield: number;
  atk: number;
  def: number;
  spd: number;
  alive: boolean;
  /** Own turns of taunt left. */
  taunt: number;
}

/** Something to animate on a unit during a frame. */
export type Fx =
  | { kind: 'damage'; target: UnitId; value: number; absorbed: number }
  | { kind: 'heal'; target: UnitId; value: number }
  | { kind: 'shield'; target: UnitId; value: number }
  | { kind: 'stat'; target: UnitId; stat: BuffableStat; value: number }
  | { kind: 'cooldown'; target: UnitId; turns: number }
  | { kind: 'taunt'; target: UnitId }
  | { kind: 'death'; target: UnitId }
  | { kind: 'trigger'; target: UnitId; label: string };

export type FrameKind = 'start' | 'turn' | 'overtime' | 'end';

export interface Frame {
  kind: FrameKind;
  tick: number;
  /** Unit state after this frame's events. */
  units: Record<UnitId, UnitView>;
  /** The unit taking its turn, if any. */
  actor: UnitId | null;
  /** Set when the actor cast its ability this frame. */
  ability: string | null;
  /** Units the actor's basic attack targeted. */
  attacked: UnitId[];
  fx: Fx[];
  /** Sudden-death stage, on overtime frames. */
  overtime?: { stage: number; percent: number };
  /** On the final frame. */
  winner?: Winner;
  /** The raw events in this frame (for the log). */
  events: CombatEvent[];
}

function emptyFrame(kind: FrameKind, tick: number, units: Record<UnitId, UnitView>): Frame {
  return { kind, tick, units, actor: null, ability: null, attacked: [], fx: [], events: [] };
}

function cloneUnits(units: Record<UnitId, UnitView>): Record<UnitId, UnitView> {
  const out: Record<UnitId, UnitView> = {};
  for (const [id, u] of Object.entries(units)) out[id] = { ...u };
  return out;
}

function apply(frame: Frame, e: CombatEvent): void {
  const u = frame.units;
  frame.events.push(e);
  switch (e.type) {
    case 'turn': {
      frame.actor = e.source;
      const actor = u[e.source];
      // Mirrors the engine: taunt ticks down at the start of the taunter's turn.
      if (actor && actor.taunt > 0) actor.taunt -= 1;
      return;
    }
    case 'attack':
      frame.attacked.push(e.target);
      return;
    case 'ability':
      frame.ability = e.name;
      return;
    case 'trigger':
      frame.fx.push({ kind: 'trigger', target: e.source, label: e.label });
      return;
    case 'damage': {
      const t = u[e.target];
      if (t) {
        t.hp = e.hpAfter;
        t.shield = Math.max(0, t.shield - e.absorbed);
      }
      frame.fx.push({ kind: 'damage', target: e.target, value: e.value, absorbed: e.absorbed });
      return;
    }
    case 'heal': {
      const t = u[e.target];
      if (t) t.hp = e.hpAfter;
      frame.fx.push({ kind: 'heal', target: e.target, value: e.value });
      return;
    }
    case 'shield': {
      const t = u[e.target];
      if (t) t.shield = e.shieldAfter;
      frame.fx.push({ kind: 'shield', target: e.target, value: e.value });
      return;
    }
    case 'buff': {
      const t = u[e.target];
      if (t) t[e.stat] = e.statAfter;
      frame.fx.push({ kind: 'stat', target: e.target, stat: e.stat, value: e.value });
      return;
    }
    case 'cooldown':
      frame.fx.push({ kind: 'cooldown', target: e.target, turns: e.turns });
      return;
    case 'taunt': {
      const t = u[e.target];
      if (t) t.taunt = e.turns;
      frame.fx.push({ kind: 'taunt', target: e.target });
      return;
    }
    case 'death': {
      const t = u[e.target];
      if (t) t.alive = false;
      frame.fx.push({ kind: 'death', target: e.target });
      return;
    }
    case 'overtime':
      frame.overtime = { stage: e.stage, percent: e.percent };
      return;
    case 'combatEnd':
      frame.winner = e.winner;
      return;
    case 'combatStart':
      return;
  }
}

/**
 * Frame 0 is the starting line-up. Start-of-combat effects form one frame,
 * then each unit turn and each sudden-death pulse is a frame, and the last
 * frame carries the winner.
 */
export function buildTimeline(result: CombatResult): Frame[] {
  const [start, ...rest] = result.events;
  if (start?.type !== 'combatStart') return [];
  const units: Record<UnitId, UnitView> = {};
  for (const s of start.units) {
    units[s.id] = {
      id: s.id,
      name: s.name,
      classId: s.classId,
      side: s.side,
      pos: s.pos,
      maxHp: s.stats.hp,
      hp: s.stats.hp,
      shield: 0,
      atk: s.stats.atk,
      def: s.stats.def,
      spd: s.stats.spd,
      alive: true,
      taunt: 0,
    };
  }
  const frames: Frame[] = [emptyFrame('start', 0, units)];
  let current: Frame | null = null;
  const open = (kind: FrameKind, tick: number) => {
    const prev = current ?? frames[0]!;
    current = emptyFrame(kind, tick, cloneUnits(prev.units));
    frames.push(current);
    return current;
  };
  for (const e of rest) {
    let frame: Frame = current ?? open('start', e.tick);
    if (e.type === 'turn') frame = open('turn', e.tick);
    else if (e.type === 'overtime') frame = open('overtime', e.tick);
    else if (e.type === 'combatEnd') frame = open('end', e.tick);
    apply(frame, e);
  }
  // Drop an empty start-of-combat frame (no triggers fired before the first turn).
  return frames.filter((f, i) => i === 0 || f.kind !== 'start' || f.fx.length > 0);
}

/** Living units on a side at a frame. */
export const aliveOn = (frame: Frame, side: Side) => Object.values(frame.units).filter((u) => u.side === side && u.alive);

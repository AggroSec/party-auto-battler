// Stacking statuses (post-M7): Runes that burst, Dread that saps ATK, damage
// over time, Undying Rage. See StatusDef for the rules.
import { resolveAmount } from './damage.ts';
import { applyHeal, dealDamage } from './hits.ts';
import { credit, emit, type ActiveStatus, type CombatState, type CombatUnit } from './state.ts';
import { selectTargets } from './targeting.ts';
import type { BuffableStat, StatusDef } from './types.ts';

// fireTriggers lives in effects.ts, which imports this file; take it as a parameter to avoid a cycle.
type FireBurst = (state: CombatState, unit: CombatUnit, target: CombatUnit, status: string, depth: number) => void;

/** Set a status's stack count, moving its stat changes with it, and log the change. */
function setStacks(state: CombatState, unit: CombatUnit, s: ActiveStatus, stacks: number, burst = false): void {
  for (const [stat, per] of Object.entries(s.def.stats ?? {}) as [BuffableStat, number][]) {
    const applied = s.applied[stat] ?? 0;
    const before = unit[stat];
    unit[stat] = Math.max(0, before + per * stacks - applied);
    const change = unit[stat] - before;
    s.applied[stat] = applied + change;
    if (change !== 0) {
      emit(state, { tick: state.tick, type: 'buff', source: s.source.id, target: unit.id, stat, value: change, statAfter: unit[stat] });
    }
  }
  s.stacks = stacks;
  emit(state, {
    tick: state.tick,
    type: 'status',
    source: s.source.id,
    target: unit.id,
    status: s.def.id,
    name: s.def.name,
    stacks,
    ...(burst ? { burst: true } : {}),
  });
  if (stacks === 0) unit.statuses.delete(s.def.id);
}

/** Give `target` stacks of a status from `source`; bursts it if that reaches `burstAt` (extra stacks carry over). */
export function applyStatus(
  state: CombatState,
  source: CombatUnit,
  target: CombatUnit,
  def: StatusDef,
  stacks: number,
  power: number,
  depth: number,
  fireBurst: FireBurst,
): void {
  if (!target.alive || stacks <= 0) return;
  let s = target.statuses.get(def.id);
  if (!s) {
    s = { def, stacks: 0, source, dotPerStack: 0, hotPerStack: 0, applied: {}, via: source.via };
    target.statuses.set(def.id, s);
  }
  // An Empowered version of the status (same id, bigger numbers) takes over its stat changes.
  const swapped = s.def !== def && s.stacks > 0 && JSON.stringify(s.def.stats) !== JSON.stringify(def.stats);
  s.def = def;
  s.source = source;
  s.via = source.via;
  if (def.dot) s.dotPerStack = resolveAmount(def.dot, source) * power;
  if (def.hot) s.hotPerStack = resolveAmount(def.hot, source) * power;
  if (def.thorns) s.thornsPerStack = resolveAmount(def.thorns, source) * power;
  if (def.duration !== undefined) s.turns = def.duration;
  const next = Math.min(def.maxStacks ?? Infinity, s.stacks + stacks);
  if (swapped) setStacks(state, target, s, s.stacks);
  if (next === s.stacks) return;
  if (def.affliction) credit(source, 'afflictions', next - s.stacks);
  if (def.burstAt === undefined || next < def.burstAt) {
    setStacks(state, target, s, next);
    return;
  }
  // Burst; stacks past the threshold carry over (never enough for a second burst).
  setStacks(state, target, s, def.burstAt);
  setStacks(state, target, s, 0, true);
  fireBurst(state, source, target, def.id, depth);
  const leftover = Math.min(next - def.burstAt, def.burstAt - 1);
  if (leftover > 0 && target.alive) applyStatus(state, source, target, def, leftover, power, depth, fireBurst);
}

/** Thorns: a melee hit on `target` hurts the attacker for each Thorns status on it. */
export function thornsDamage(target: CombatUnit): { source: CombatUnit; via: string; damage: number }[] {
  const out: { source: CombatUnit; via: string; damage: number }[] = [];
  for (const s of target.statuses.values()) {
    const damage = Math.round((s.thornsPerStack ?? 0) * s.stacks);
    if (damage > 0) out.push({ source: s.source, via: s.via, damage });
  }
  return out;
}

/** Remove a status entirely (Headsman's execution uses up Broken Limbs). */
export function clearStatus(state: CombatState, unit: CombatUnit, statusId: string): void {
  const s = unit.statuses.get(statusId);
  if (s) setStacks(state, unit, s, 0);
}

/** Start of the unit's turn: its healing-over-time statuses heal it, then damage over time deals its damage. */
export function tickStatuses(state: CombatState, unit: CombatUnit): void {
  for (const s of [...unit.statuses.values()]) {
    const heal = Math.round((s.hotPerStack ?? 0) * s.stacks);
    if (heal <= 0 || !unit.alive) continue;
    const previous = s.source.via;
    s.source.via = s.via;
    applyHeal(state, s.source, unit, heal);
    s.source.via = previous;
  }
  for (const s of [...unit.statuses.values()]) {
    if (!unit.alive) return;
    const damage = Math.round(s.dotPerStack * s.stacks);
    if (damage <= 0) continue;
    const before = unit.hp + unit.shield;
    // Credit the action that applied it, not whatever the applier did last.
    const previous = s.source.via;
    s.source.via = s.via;
    dealDamage(state, s.source, unit, damage, { pierce: true, dot: true }, 0);
    const dealt = before - Math.max(0, unit.hp) - unit.shield;
    if (s.def.dotHeals && s.source.alive && dealt > 0) {
      const [ally] = selectTargets(state, s.source, 'lowestHpAlly');
      if (ally) applyHeal(state, s.source, ally, dealt * s.def.dotHeals);
    }
    s.source.via = previous;
  }
}

/** End of the unit's turn: timed statuses count down and expire. */
export function expireStatuses(state: CombatState, unit: CombatUnit): void {
  for (const s of [...unit.statuses.values()]) {
    if (s.turns === undefined) continue;
    s.turns -= 1;
    if (s.turns <= 0) setStacks(state, unit, s, 0);
  }
}

/** True while a status keeps the unit from dropping below 1 HP. */
export function cannotDie(unit: CombatUnit): boolean {
  for (const s of unit.statuses.values()) if (s.def.preventDeath) return true;
  return false;
}

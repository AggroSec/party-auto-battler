// Damage resolution: one hit from source to target, and everything it sets off
// (shields, lifesteal, onHurt/onBloodied, deaths and death triggers).
import { absorb, mitigate } from './damage.ts';
import { fireTriggers } from './effects.ts';
import { OVERTIME_SOURCE } from './events.ts';
import { emit, living, type CombatState, type CombatUnit } from './state.ts';

/** Damage multiplier for melee units attacking from the back row while their front row stands. */
export const BACKLINE_MELEE_MULTIPLIER = 0.5;

/** HP fraction below which a unit becomes bloodied (fires onBloodied once). */
export const BLOODIED_THRESHOLD = 0.5;

/** True when a melee unit is stuck behind living allies and hits at reduced strength. */
export function isBacklineMelee(state: CombatState, unit: CombatUnit): boolean {
  return (
    unit.setup.range === 'melee' &&
    !unit.setup.reach &&
    unit.pos.row === 'back' &&
    living(state, unit.side).some((u) => u.pos.row === 'front')
  );
}

export interface DamageOptions {
  /** Ignore DEF. */
  pierce?: boolean;
  /** True damage: ignore DEF and shields (sudden death). */
  true?: boolean;
  /** For source-less damage: who the event log names as the source (default: sudden death). */
  by?: string;
}

/** Restore HP to `target`, capped at max HP. Returns the amount actually healed. */
export function applyHeal(state: CombatState, source: CombatUnit, target: CombatUnit, amount: number): number {
  const value = Math.max(0, Math.min(Math.round(amount), target.maxHp - target.hp));
  target.hp += value;
  source.stats.healingDone += value;
  emit(state, { tick: state.tick, type: 'heal', source: source.id, target: target.id, value, hpAfter: target.hp });
  return value;
}

/**
 * Apply one hit: mitigation, shields, HP loss, lifesteal, then onHurt /
 * onBloodied or death triggers. `source` is null for environmental damage
 * (sudden death), which credits no one.
 */
export function dealDamage(
  state: CombatState,
  source: CombatUnit | null,
  target: CombatUnit,
  raw: number,
  opts: DamageOptions,
  depth: number,
): void {
  if (!target.alive) return;
  const scaled = source && isBacklineMelee(state, source) ? raw * BACKLINE_MELEE_MULTIPLIER : raw;
  const damage = mitigate(scaled, target.def, opts.pierce === true || opts.true === true);
  const { toShield, toHp } = opts.true ? { toShield: 0, toHp: damage } : absorb(damage, target.shield);
  const hpLost = Math.min(target.hp, toHp);
  target.shield -= toShield;
  target.hp -= hpLost;
  if (source) source.stats.damageDealt += hpLost + toShield;
  target.stats.damageTaken += hpLost + toShield;
  emit(state, {
    tick: state.tick,
    type: 'damage',
    source: source?.id ?? opts.by ?? OVERTIME_SOURCE,
    target: target.id,
    value: hpLost,
    absorbed: toShield,
    hpAfter: target.hp,
  });

  if (source?.alive && source.setup.lifesteal && hpLost + toShield > 0) {
    const heal = Math.round((hpLost + toShield) * source.setup.lifesteal);
    if (heal > 0) applyHeal(state, source, source, heal);
  }

  if (target.hp <= 0) {
    kill(state, target, source, depth, opts.by);
    return;
  }
  if (damage > 0) {
    fireTriggers(state, target, 'onHurt', source ? { triggerSource: source } : {}, depth);
  }
  if (target.alive && !target.bloodied && target.hp < target.maxHp * BLOODIED_THRESHOLD) {
    target.bloodied = true;
    fireTriggers(state, target, 'onBloodied', source ? { triggerSource: source } : {}, depth);
  }
}

function kill(state: CombatState, target: CombatUnit, killer: CombatUnit | null, depth: number, by?: string): void {
  target.alive = false;
  emit(state, { tick: state.tick, type: 'death', target: target.id, source: killer?.id ?? by ?? OVERTIME_SOURCE });
  if (killer) {
    if (killer !== target && killer.side !== target.side) killer.stats.kills += 1;
    fireTriggers(state, killer, 'onKill', { triggerTarget: target }, depth);
  }
  for (const ally of living(state, target.side)) {
    const ctx = killer ? { triggerSource: killer, triggerTarget: target } : { triggerTarget: target };
    fireTriggers(state, ally, 'onAllyDeath', ctx, depth);
  }
}

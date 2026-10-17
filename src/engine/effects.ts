import { absorb, mitigate, resolveAmount } from './damage.ts';
import { emit, living, type CombatState, type CombatUnit } from './state.ts';
import { rowNeighbours, selectTargets, type TargetContext } from './targeting.ts';
import type { Effect, TriggerEvent } from './types.ts';

/**
 * Triggers can cause further triggers (a hit fires onHurt, whose effect kills
 * someone, which fires onKill...). Chains deeper than this are cut off so a
 * pair of reactive effects can never loop forever.
 */
export const MAX_TRIGGER_DEPTH = 4;

export function fireTriggers(
  state: CombatState,
  unit: CombatUnit,
  on: TriggerEvent,
  ctx: TargetContext,
  depth: number,
): void {
  if (depth > MAX_TRIGGER_DEPTH || !unit.alive) return;
  for (const trigger of unit.setup.triggers) {
    if (trigger.on !== on) continue;
    const fired = unit.triggerFires.get(trigger) ?? 0;
    if (trigger.limit !== undefined && fired >= trigger.limit) continue;
    if (trigger.chance !== undefined && !state.rng.chance(trigger.chance)) continue;
    unit.triggerFires.set(trigger, fired + 1);
    emit(state, { tick: state.tick, type: 'trigger', source: unit.id, label: trigger.label, on });
    applyEffects(state, unit, trigger.effects, ctx, depth + 1);
    if (!unit.alive) return;
  }
}

export function applyEffects(
  state: CombatState,
  source: CombatUnit,
  effects: readonly Effect[],
  ctx: TargetContext,
  depth: number,
): void {
  for (const effect of effects) applyEffect(state, source, effect, ctx, depth);
}

function applyEffect(
  state: CombatState,
  source: CombatUnit,
  effect: Effect,
  ctx: TargetContext,
  depth: number,
): void {
  switch (effect.kind) {
    case 'damage': {
      const hits = effect.hits ?? 1;
      for (let i = 0; i < hits; i++) {
        for (const target of selectTargets(state, source, effect.target, ctx)) {
          const raw = resolveAmount(effect.amount, source);
          // Capture neighbours before the primary hit, in case it kills the target.
          const neighbours = effect.splash ? rowNeighbours(state, target) : [];
          dealDamage(state, source, target, raw, effect.pierce ?? false, depth);
          for (const n of neighbours) {
            dealDamage(state, source, n, raw * (effect.splash ?? 0), effect.pierce ?? false, depth);
          }
        }
      }
      return;
    }
    case 'heal': {
      const amount = Math.round(resolveAmount(effect.amount, source));
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        const value = Math.min(amount, target.maxHp - target.hp);
        target.hp += value;
        source.stats.healingDone += value;
        emit(state, {
          tick: state.tick,
          type: 'heal',
          source: source.id,
          target: target.id,
          value,
          hpAfter: target.hp,
        });
      }
      return;
    }
    case 'shield': {
      const value = Math.round(resolveAmount(effect.amount, source));
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        target.shield += value;
        source.stats.shieldingDone += value;
        emit(state, {
          tick: state.tick,
          type: 'shield',
          source: source.id,
          target: target.id,
          value,
          shieldAfter: target.shield,
        });
      }
      return;
    }
    case 'buff': {
      const value = Math.round(resolveAmount(effect.amount, source));
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        target[effect.stat] += value;
        emit(state, {
          tick: state.tick,
          type: 'buff',
          source: source.id,
          target: target.id,
          stat: effect.stat,
          value,
          statAfter: target[effect.stat],
        });
      }
      return;
    }
  }
}

/** Apply one hit: mitigation, shields, HP loss, then onHurt or death triggers. */
export function dealDamage(
  state: CombatState,
  source: CombatUnit,
  target: CombatUnit,
  raw: number,
  pierce: boolean,
  depth: number,
): void {
  if (!target.alive) return;
  const damage = mitigate(raw, target.def, pierce);
  const { toShield, toHp } = absorb(damage, target.shield);
  const hpLost = Math.min(target.hp, toHp);
  target.shield -= toShield;
  target.hp -= hpLost;
  source.stats.damageDealt += hpLost + toShield;
  target.stats.damageTaken += hpLost + toShield;
  emit(state, {
    tick: state.tick,
    type: 'damage',
    source: source.id,
    target: target.id,
    value: hpLost,
    absorbed: toShield,
    hpAfter: target.hp,
  });

  if (target.hp <= 0) {
    kill(state, target, source, depth);
  } else if (damage > 0) {
    fireTriggers(state, target, 'onHurt', { triggerSource: source }, depth);
  }
}

function kill(state: CombatState, target: CombatUnit, killer: CombatUnit, depth: number): void {
  target.alive = false;
  emit(state, { tick: state.tick, type: 'death', target: target.id, source: killer.id });
  if (killer !== target && killer.side !== target.side) killer.stats.kills += 1;
  fireTriggers(state, killer, 'onKill', { triggerTarget: target }, depth);
  for (const ally of living(state, target.side)) {
    fireTriggers(state, ally, 'onAllyDeath', { triggerSource: killer, triggerTarget: target }, depth);
  }
}

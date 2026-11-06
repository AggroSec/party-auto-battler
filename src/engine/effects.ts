// Effects and triggers: the data-driven layer behind abilities, passives,
// talents, items and synergies.
import { resolveAmount } from './damage.ts';
import { applyHeal, dealDamage } from './hits.ts';
import { emit, type CombatState, type CombatUnit } from './state.ts';
import { applyStatus, clearStatus } from './statuses.ts';
import { summonUnit } from './summon.ts';
import { afflictionCount, rowNeighbours, selectTargets, type TargetContext } from './targeting.ts';
import type { BuffableStat, Effect, TriggerEvent } from './types.ts';

export { BACKLINE_MELEE_MULTIPLIER, BLOODIED_THRESHOLD, dealDamage, isBacklineMelee, type DamageOptions } from './hits.ts';

/**
 * Triggers can cause further triggers (a hit fires onHurt, whose effect kills
 * someone, which fires onKill...). Chains deeper than this are cut off so a
 * pair of reactive effects can never loop forever.
 */
export const MAX_TRIGGER_DEPTH = 4;

/** The stats a 'random' debuff picks from. */
const RANDOM_STATS: readonly BuffableStat[] = ['atk', 'def', 'spd'];

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
    if (trigger.status !== undefined && trigger.status !== ctx.status) continue;
    const fired = unit.triggerFires.get(trigger) ?? 0;
    if (trigger.limit !== undefined && fired >= trigger.limit) continue;
    if (trigger.chance !== undefined && !state.rng.chance(trigger.chance)) continue;
    unit.triggerFires.set(trigger, fired + 1);
    emit(state, { tick: state.tick, type: 'trigger', source: unit.id, label: trigger.label, on });
    if (trigger.consumable) emit(state, { tick: state.tick, type: 'consume', source: unit.id, label: trigger.label });
    applyEffects(state, unit, trigger.effects, ctx, depth + 1);
    if (!unit.alive) return;
  }
}

/**
 * Apply effects from `source`. `power` scales damage, heals and shields; it's
 * the unit's abilityPower when casting an ability, and 1 otherwise.
 */
export function applyEffects(
  state: CombatState,
  source: CombatUnit,
  effects: readonly Effect[],
  ctx: TargetContext,
  depth: number,
  power = 1,
): void {
  for (const effect of effects) applyEffect(state, source, effect, ctx, depth, power);
}

function applyEffect(
  state: CombatState,
  source: CombatUnit,
  effect: Effect,
  ctx: TargetContext,
  depth: number,
  power: number,
): void {
  switch (effect.kind) {
    case 'damage': {
      const hits = effect.hits ?? 1;
      for (let i = 0; i < hits; i++) {
        for (const target of selectTargets(state, source, effect.target, ctx)) {
          const req = effect.requires;
          if (req) {
            if ((target.statuses.get(req.status)?.stacks ?? 0) < req.stacks) continue;
            if (req.consume) clearStatus(state, target, req.status);
          }
          let base = resolveAmount(effect.amount, source);
          if (effect.perAffliction) base += effect.perAffliction * source.atk * afflictionCount(target);
          const per = effect.perStack;
          if (per) {
            base += per.atk * source.atk * (target.statuses.get(per.status)?.stacks ?? 0);
            if (per.consume) clearStatus(state, target, per.status);
          }
          const raw = base * power;
          // Capture neighbours before the primary hit, in case it kills the target.
          const neighbours = effect.splash ? rowNeighbours(state, target) : [];
          const opts = { pierce: effect.pierce ?? false };
          dealDamage(state, source, target, raw, opts, depth);
          for (const n of neighbours) {
            dealDamage(state, source, n, raw * (effect.splash ?? 0), opts, depth);
          }
        }
      }
      return;
    }
    case 'heal': {
      const amount = resolveAmount(effect.amount, source) * power;
      for (const target of selectTargets(state, source, effect.target, ctx)) applyHeal(state, source, target, amount);
      return;
    }
    case 'shield': {
      const value = Math.round(resolveAmount(effect.amount, source) * power);
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
    case 'buff':
    case 'debuff': {
      const magnitude = Math.round(resolveAmount(effect.amount, source));
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        const stat = effect.stat === 'random' ? state.rng.pick(RANDOM_STATS) : effect.stat;
        const before = target[stat];
        target[stat] = effect.kind === 'buff' ? before + magnitude : Math.max(0, before - magnitude);
        emit(state, {
          tick: state.tick,
          type: 'buff',
          source: source.id,
          target: target.id,
          stat,
          value: target[stat] - before,
          statAfter: target[stat],
        });
      }
      return;
    }
    case 'cooldown': {
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        // Shifts every ability the target has; haste never pulls one closer than the floor.
        const floor = effect.turns < 0 ? Math.max(1, effect.min ?? 1) : 1;
        target.cooldowns = target.cooldowns.map((cd) => Math.max(Math.min(floor, cd), cd + effect.turns));
        emit(state, {
          tick: state.tick,
          type: 'cooldown',
          source: source.id,
          target: target.id,
          turns: effect.turns,
          cooldownAfter: target.cooldowns[0]!,
        });
      }
      return;
    }
    case 'taunt': {
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        target.taunt = Math.max(target.taunt, effect.turns);
        emit(state, { tick: state.tick, type: 'taunt', source: source.id, target: target.id, turns: target.taunt });
      }
      return;
    }
    case 'payHp': {
      const value = Math.max(0, Math.round(resolveAmount(effect.amount, source)));
      if (value > 0) dealDamage(state, null, source, value, { true: true, by: source.id }, depth);
      return;
    }
    case 'status': {
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        applyStatus(state, source, target, effect.status, effect.stacks, power, depth, (st, unit, afflicted, status, d) =>
          fireTriggers(st, unit, 'onBurst', { triggerTarget: afflicted, status }, d),
        );
      }
      return;
    }
    case 'cure': {
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        for (let i = 0; i < effect.count; i++) {
          const ids = [...target.statuses.values()].filter((s) => s.def.affliction).map((s) => s.def.id);
          if (ids.length === 0) break;
          clearStatus(state, target, state.rng.pick(ids));
        }
      }
      return;
    }
    case 'execute': {
      for (const target of selectTargets(state, source, effect.target, ctx)) {
        if (!effect.requires.every((id) => target.statuses.has(id))) continue;
        const value = target.setup.boss ? Math.round(target.maxHp * effect.bossMaxHp) : target.hp + target.shield;
        dealDamage(state, source, target, value, { true: true }, depth);
      }
      return;
    }
    case 'summon': {
      if (!summonUnit(state, source, effect.summon, power) && effect.fallback) {
        applyEffects(state, source, effect.fallback, ctx, depth, power);
      }
      return;
    }
  }
}

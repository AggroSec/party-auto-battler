import { applyEffects, dealDamage, fireTriggers } from './effects.ts';
import type { CombatResult, Winner } from './events.ts';
import type { Rng } from './rng.ts';
import {
  createCombatUnits,
  emit,
  living,
  snapshot,
  type CombatState,
  type CombatUnit,
} from './state.ts';
import { selectTargets } from './targeting.ts';
import type { Party } from './types.ts';

/** A unit acts each time its gauge reaches this value. Gauge fills by SPD per tick. */
export const ACTION_THRESHOLD = 100;
/** Combat that runs this many ticks ends in a draw. */
export const DEFAULT_TICK_CAP = 1000;
/** SPD is clamped to this range for gauge fill (at most one action per tick). */
export const MIN_SPD = 1;
export const MAX_SPD = ACTION_THRESHOLD;

export interface CombatInput {
  player: Party;
  enemy: Party;
  rng: Rng;
  tickCap?: number;
}

/**
 * Resolve a fight. Pure: the result depends only on the inputs and the Rng's
 * state, so identical inputs and seed always produce an identical event log.
 */
export function simulateCombat({ player, enemy, rng, tickCap = DEFAULT_TICK_CAP }: CombatInput): CombatResult {
  const state: CombatState = {
    tick: 0,
    units: [...createCombatUnits(player, 'player'), ...createCombatUnits(enemy, 'enemy')],
    events: [],
    rng,
  };

  emit(state, { tick: 0, type: 'combatStart', units: state.units.map(snapshot) });

  for (const unit of state.units) fireTriggers(state, unit, 'startOfCombat', {}, 0);

  let winner = checkWinner(state);
  while (winner === null && state.tick < tickCap) {
    state.tick += 1;
    for (const unit of state.units) {
      if (unit.alive) unit.gauge += clampSpd(unit.spd);
    }
    for (const unit of readyUnits(state)) {
      if (!unit.alive) continue;
      unit.gauge -= ACTION_THRESHOLD;
      takeTurn(state, unit);
      winner = checkWinner(state);
      if (winner !== null) break;
    }
  }

  const reason = winner === null ? 'tickCap' : 'elimination';
  const finalWinner: Winner = winner ?? 'draw';
  emit(state, { tick: state.tick, type: 'combatEnd', winner: finalWinner, reason });

  return {
    winner: finalWinner,
    ticks: state.tick,
    events: state.events,
    summary: state.units.map((u) => ({
      id: u.id,
      name: u.setup.name,
      side: u.side,
      survived: u.alive,
      ...u.stats,
    })),
  };
}

function clampSpd(spd: number): number {
  return Math.min(MAX_SPD, Math.max(MIN_SPD, spd));
}

/**
 * Units whose gauge is full, in action order: fullest gauge first, then
 * higher SPD, then player before enemy, then board order.
 */
export function readyUnits(state: CombatState): CombatUnit[] {
  return state.units
    .filter((u) => u.alive && u.gauge >= ACTION_THRESHOLD)
    .sort(
      (a, b) =>
        b.gauge - a.gauge ||
        clampSpd(b.spd) - clampSpd(a.spd) ||
        (a.side === b.side ? 0 : a.side === 'player' ? -1 : 1) ||
        a.order - b.order,
    );
}

function takeTurn(state: CombatState, unit: CombatUnit): void {
  emit(state, { tick: state.tick, type: 'turn', source: unit.id });
  fireTriggers(state, unit, 'onTurnStart', {}, 0);
  if (!unit.alive || checkWinner(state) !== null) return;

  unit.cooldown -= 1;
  if (unit.cooldown <= 0) {
    const { ability } = unit.setup;
    unit.cooldown = ability.cooldown;
    emit(state, { tick: state.tick, type: 'ability', source: unit.id, abilityId: ability.id, name: ability.name });
    applyEffects(state, unit, ability.effects, {}, 0);
    return;
  }

  const [target] = selectTargets(state, unit, unit.setup.attackTarget);
  if (!target) return;
  emit(state, { tick: state.tick, type: 'attack', source: unit.id, target: target.id });
  dealDamage(state, unit, target, unit.atk, false, 0);
  fireTriggers(state, unit, 'onAttack', { triggerTarget: target }, 0);
}

function checkWinner(state: CombatState): Winner | null {
  const playerAlive = living(state, 'player').length > 0;
  const enemyAlive = living(state, 'enemy').length > 0;
  if (playerAlive && enemyAlive) return null;
  if (playerAlive) return 'player';
  if (enemyAlive) return 'enemy';
  return 'draw';
}

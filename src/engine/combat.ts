import { applyEffects, dealDamage, fireTriggers } from './effects.ts';
import type { ActionTally, CombatResult, UnitId, Winner } from './events.ts';
import type { Rng } from './rng.ts';
import {
  ATTACK_KEY,
  beginAction,
  createCombatUnits,
  emit,
  living,
  snapshot,
  type CombatState,
  type CombatUnit,
} from './state.ts';
import { expireStatuses, tickStatuses } from './statuses.ts';
import { chooseRule, isSilenced, stunOf } from './tactics.ts';
import { selectTargets } from './targeting.ts';
import type { AbilityDef, Party } from './types.ts';

/** A unit acts each time its gauge reaches this value. Gauge fills by SPD per tick. */
export const ACTION_THRESHOLD = 100;
/** Combat that runs this many ticks ends in a draw (a safety net; sudden death ends fights first). */
export const DEFAULT_TICK_CAP = 1000;
/** Sudden death: from this tick, a pulse every OVERTIME_INTERVAL ticks deals true damage to everyone. */
export const OVERTIME_START_TICK = 300;
export const OVERTIME_INTERVAL = 10;
/** Pulse N deals N x this fraction of each unit's max HP (5%, 10%, 15%, ...). */
export const OVERTIME_PERCENT_PER_STAGE = 0.05;
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
    summons: 0,
  };

  emit(state, { tick: 0, type: 'combatStart', units: state.units.map(snapshot) });

  for (const unit of state.units) fireTriggers(state, unit, 'startOfCombat', {}, 0);

  let winner = checkWinner(state);
  while (winner === null && state.tick < tickCap) {
    state.tick += 1;
    overtimePulse(state);
    winner = checkWinner(state);
    if (winner !== null) break;
    for (const unit of state.units) {
      if (unit.alive) unit.gauge += clampSpd(unit.spd);
    }
    for (const unit of readyUnits(state)) {
      if (!unit.alive) continue;
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
      actions: tallies(u),
      ...(u.summonedBy ? { summonedBy: u.summonedBy } : {}),
    })),
  };
}

/** The unit's breakdown, with each rule's "a rule above it fired first" count filled in. */
function tallies(unit: CombatUnit): ActionTally[] {
  return [...unit.tallies.values()].map((t) => {
    if (!t.passed) return { ...t };
    const { cooldown, unmet, silenced } = t.passed;
    return { ...t, passed: { cooldown, unmet, silenced, above: unit.ruleTurns - t.uses - cooldown - unmet - silenced } };
  });
}

/**
 * Sudden death guarantees a result: healing and DEF walls can stall a fight,
 * so after OVERTIME_START_TICK everyone takes escalating true damage.
 */
export function overtimePulse(state: CombatState): void {
  const elapsed = state.tick - OVERTIME_START_TICK;
  if (elapsed < 0 || elapsed % OVERTIME_INTERVAL !== 0) return;
  const stage = elapsed / OVERTIME_INTERVAL + 1;
  const percent = stage * OVERTIME_PERCENT_PER_STAGE;
  emit(state, { tick: state.tick, type: 'overtime', stage, percent });
  for (const unit of state.units.filter((u) => u.alive)) {
    dealDamage(state, null, unit, Math.max(1, Math.round(unit.maxHp * percent)), { true: true }, 0);
  }
}

function clampSpd(spd: number): number {
  return Math.min(MAX_SPD, Math.max(MIN_SPD, spd));
}

/**
 * Units whose gauge is full, in action order: fullest gauge first, then
 * higher SPD, then board order. When units on opposite sides are still tied,
 * a seeded coin flip (once per tick) decides which side goes first, so
 * neither side has a built-in edge and fights stay deterministic.
 */
export function readyUnits(state: CombatState): CombatUnit[] {
  const ready = state.units.filter((u) => u.alive && u.gauge >= ACTION_THRESHOLD);
  const tied = (a: CombatUnit, b: CombatUnit) => a.gauge === b.gauge && clampSpd(a.spd) === clampSpd(b.spd);
  const crossSideTie = ready.some((a) => a.side === 'player' && ready.some((b) => b.side === 'enemy' && tied(a, b)));
  // Only consume the Rng when a genuine cross-side tie exists.
  const firstSide = crossSideTie && state.rng.chance(0.5) ? 'enemy' : 'player';
  return ready.sort(
    (a, b) =>
      b.gauge - a.gauge ||
      clampSpd(b.spd) - clampSpd(a.spd) ||
      (a.side === b.side ? 0 : a.side === firstSide ? -1 : 1) ||
      a.order - b.order,
  );
}

/**
 * Index of the ability to cast this turn, or null. Of the ready ones, the one
 * that has waited longest (lowest cooldown) goes first; ties go to the rarer
 * ability (longer cooldown), then the class ability, then talent order. So an
 * every-turn class ability can't starve a granted one.
 */
function readyAbility(unit: CombatUnit): number | null {
  const abilities = [unit.setup.ability, ...(unit.setup.extraAbilities ?? [])];
  let best: number | null = null;
  unit.cooldowns.forEach((cd, i) => {
    if (cd > 0) return;
    const b = best === null ? null : unit.cooldowns[best]!;
    if (b === null || cd < b || (cd === b && abilities[i]!.cooldown > abilities[best!]!.cooldown)) best = i;
  });
  return best;
}

function takeTurn(state: CombatState, unit: CombatUnit): void {
  const gauges: Record<UnitId, number> = {};
  for (const u of state.units) if (u.alive) gauges[u.id] = u.gauge;
  emit(state, { tick: state.tick, type: 'turn', source: unit.id, gauges });
  unit.gauge -= ACTION_THRESHOLD;
  if (unit.taunt > 0) unit.taunt -= 1;
  tickStatuses(state, unit);
  if (!unit.alive || checkWinner(state) !== null) return;
  fireTriggers(state, unit, 'onTurnStart', {}, 0);
  if (!unit.alive || checkWinner(state) !== null) return;
  act(state, unit);
  if (unit.alive) expireStatuses(state, unit);
}

function act(state: CombatState, unit: CombatUnit): void {
  unit.cooldowns = unit.cooldowns.map((cd) => cd - 1);
  const stun = stunOf(unit);
  if (stun) {
    emit(state, { tick: state.tick, type: 'stunned', source: unit.id, name: stun });
    return;
  }

  // Rules mode: the unit's priority list decides.
  if (unit.setup.skills) {
    const choice = chooseRule(state, unit);
    unit.ruleTurns += 1;
    choice.passed.forEach((why, i) => {
      const row = unit.tallies.get(`rule:${i}`);
      if (row?.passed) row.passed[why] += 1;
    });
    const key = choice.rule === undefined ? ATTACK_KEY : `rule:${choice.rule}`;
    if (choice.kind === 'skill') cast(state, unit, choice.index, choice.skill, choice.focus, key);
    else basicAttack(state, unit, choice.target, key);
    return;
  }

  const ready = isSilenced(unit) ? null : readyAbility(unit);
  if (ready !== null) {
    const ability = ready === 0 ? unit.setup.ability : unit.setup.extraAbilities![ready - 1]!;
    cast(state, unit, ready, ability, undefined, `ability:${ability.id}`);
    return;
  }
  basicAttack(state, unit, selectTargets(state, unit, unit.setup.attackTarget)[0], ATTACK_KEY);
}

/** `key`: the ActionTally the cast counts toward (its rule, or the ability). */
function cast(state: CombatState, unit: CombatUnit, index: number, ability: AbilityDef, focus: CombatUnit | undefined, key: string): void {
  unit.cooldowns[index] = ability.cooldown;
  unit.stats.abilities += 1;
  beginAction(unit, key, 'ability', ability.name);
  emit(state, { tick: state.tick, type: 'ability', source: unit.id, abilityId: ability.id, name: ability.name, ...(focus ? { target: focus.id } : {}) });
  const power = (unit.setup.abilityPower ?? 1) + (unit.setup.skillPower?.[ability.id] ?? 0);
  applyEffects(state, unit, ability.effects, focus ? { focus } : {}, 0, power);
  fireTriggers(state, unit, 'onAbility', {}, 0);
}

function basicAttack(state: CombatState, unit: CombatUnit, target: CombatUnit | undefined, key: string): void {
  if (!target) return;
  unit.stats.attacks += 1;
  beginAction(unit, key, 'attack', 'Basic attack');
  emit(state, { tick: state.tick, type: 'attack', source: unit.id, target: target.id });
  dealDamage(state, unit, target, unit.atk, {}, 0);
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

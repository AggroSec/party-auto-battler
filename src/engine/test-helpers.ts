// Shared fixtures for engine tests. Uses synthetic units so rule tests
// don't change whenever class data is rebalanced.
import type { CombatEvent, CombatEventType } from './events.ts';
import { Rng } from './rng.ts';
import { createCombatUnits, type CombatState, type CombatUnit } from './state.ts';
import type { AbilityDef, Party, Stats, TriggeredEffect, UnitSetup } from './types.ts';

export const NEVER_CAST: AbilityDef = {
  id: 'none',
  name: 'None',
  description: 'Never casts.',
  cooldown: 1_000_000,
  effects: [],
};

export function unit(
  overrides: Partial<Omit<UnitSetup, 'stats'>> & { stats?: Partial<Stats> } = {},
): UnitSetup {
  return {
    name: overrides.name ?? 'Dummy',
    classId: overrides.classId ?? 'dummy',
    stats: { hp: 20, atk: 5, def: 0, spd: 10, ...overrides.stats },
    // Ranged by default so rule tests aren't affected by the back-row melee penalty.
    range: overrides.range ?? 'ranged',
    attackTarget: overrides.attackTarget ?? 'nearest',
    ability: overrides.ability ?? NEVER_CAST,
    triggers: overrides.triggers ?? [],
  };
}

export function withTriggers(triggers: TriggeredEffect[], base: Parameters<typeof unit>[0] = {}) {
  return unit({ ...base, triggers });
}

export function party(
  front: (UnitSetup | null)[],
  back: (UnitSetup | null)[] = [],
): Party {
  return { front, back };
}

export function makeState(player: Party, enemy: Party, seed = 1): CombatState {
  return {
    tick: 0,
    units: [...createCombatUnits(player, 'player'), ...createCombatUnits(enemy, 'enemy')],
    events: [],
    rng: new Rng(seed),
    summons: 0,
  };
}

export function byId(state: CombatState, id: string): CombatUnit {
  const u = state.units.find((x) => x.id === id);
  if (!u) throw new Error(`No unit ${id}`);
  return u;
}

export function ofType<T extends CombatEventType>(
  events: CombatEvent[],
  type: T,
): Extract<CombatEvent, { type: T }>[] {
  return events.filter((e): e is Extract<CombatEvent, { type: T }> => e.type === type);
}

// Post-M7 classes in real fights: Runes detonate, Dread saps ATK, Deathless Fury holds at 1 HP.
import { describe, expect, it } from 'vitest';
import { Rng, simulateCombat, type CombatEvent } from '../../engine/index.ts';
import { newUnit, resolveUnit, type OwnedUnit } from '../../engine/run/index.ts';
import { buildRunContext } from '../content.ts';

const { content } = buildRunContext();
const make = (classId: string, over: Partial<OwnedUnit> = {}) => resolveUnit({ ...newUnit(1, classId, classId), ...over }, content);
const dummy = (hp = 400) => ({ ...make('warrior'), stats: { hp, atk: 4, def: 0, spd: 8 } });
const fight = (player: ReturnType<typeof make>, enemy = dummy()) =>
  simulateCombat({ player: { front: [player], back: [] }, enemy: { front: [enemy], back: [] }, rng: new Rng(1), tickCap: 200 });
const statuses = (events: CombatEvent[]) => events.filter((e): e is Extract<CombatEvent, { type: 'status' }> => e.type === 'status');

describe('Runeblade', () => {
  it('carves Runes and detonates them at 5', () => {
    const r = fight(make('runeblade'));
    const runes = statuses(r.events).filter((e) => e.status === 'rune');
    expect(runes.some((e) => e.burst)).toBe(true);
    expect(Math.max(...runes.map((e) => e.stacks))).toBeLessThanOrEqual(5);
    expect(r.events.some((e) => e.type === 'trigger' && e.on === 'onBurst' && e.label === 'Runic Detonation')).toBe(true);
  });
});

describe('Dark Knight', () => {
  it('Dreadknights sap attackers with Dread, up to 3 stacks', () => {
    const knight = make('dark-knight', { level: 3, advancedClassId: 'dreadknight' });
    const r = fight(knight, { ...dummy(), stats: { hp: 400, atk: 8, def: 0, spd: 12 } });
    const dread = statuses(r.events).filter((e) => e.status === 'dread' && e.target === 'e0');
    expect(dread.at(-1)?.stacks).toBe(3);
  });
});

describe('Berserker: Deathless Fury', () => {
  it('holds at 1 HP with a temporary boost instead of falling', () => {
    const zerker = make('warrior', { level: 4, advancedClassId: 'berserker', talents: ['berserker/deathless-fury'] });
    const r = fight({ ...zerker, stats: { ...zerker.stats, hp: 10 } }, { ...dummy(), stats: { hp: 400, atk: 30, def: 0, spd: 20 } });
    const fury = statuses(r.events).filter((e) => e.status === 'deathless-fury');
    expect(fury[0]?.stacks).toBe(1);
    expect(fury.at(-1)?.stacks).toBe(0);
  });
});

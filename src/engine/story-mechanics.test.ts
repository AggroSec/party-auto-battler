// Milestone 14 engine rules: healing over time, Thorns, the speed burst and
// overflow shields.
import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { applyEffects, dealDamage } from './effects.ts';
import { Rng } from './rng.ts';
import { tickStatuses } from './statuses.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';
import type { Effect, StatusDef } from './types.ts';

const RENEW: StatusDef = { id: 'renew', name: 'Renew', hot: { atk: 1 }, duration: 3, maxStacks: 1 };
const THORNS: StatusDef = { id: 'thorns', name: 'Thorns', thorns: { flat: 4 }, duration: 3, maxStacks: 1 };
const give = (status: StatusDef, target: 'self' | 'nearest' | 'allAllies' = 'self'): Effect => ({ kind: 'status', target, status, stacks: 1 });

describe('Milestone 14 mechanics', () => {
  it('healing over time heals at the start of the unit’s turn, from the applier’s ATK, credited to the applier', () => {
    const s = makeState(party([unit({ stats: { hp: 50, atk: 6 } })]), party([unit()]));
    const p = byId(s, 'p0');
    p.hp = 30;
    applyEffects(s, p, [give(RENEW)], {}, 0);
    tickStatuses(s, p);
    expect(p.hp).toBe(36);
    expect(p.stats.healingDone).toBe(6);
    expect(ofType(s.events, 'heal').at(-1)).toMatchObject({ source: 'p0', target: 'p0', value: 6 });
  });

  it('healing over time never heals past full HP', () => {
    const s = makeState(party([unit({ stats: { hp: 50, atk: 6 } })]), party([unit()]));
    const p = byId(s, 'p0');
    p.hp = 48;
    applyEffects(s, p, [give(RENEW)], {}, 0);
    tickStatuses(s, p);
    expect(p.hp).toBe(50);
  });

  it('Thorns hurt a melee attacker (ignoring DEF), not a ranged one', () => {
    const s = makeState(party([unit({ stats: { hp: 100 } })]), party([unit({ range: 'melee', stats: { hp: 50, def: 5 } }), unit({ stats: { hp: 50 } })]));
    const [p, melee, ranged] = [byId(s, 'p0'), byId(s, 'e0'), byId(s, 'e1')];
    applyEffects(s, p, [give(THORNS)], {}, 0);
    dealDamage(s, melee, p, 5, {}, 0);
    expect(melee.hp).toBe(46);
    expect(p.stats.damageDealt).toBe(4);
    dealDamage(s, ranged, p, 5, {}, 0);
    expect(ranged.hp).toBe(50);
  });

  it('Thorns never answer damage over time', () => {
    const s = makeState(party([unit({ stats: { hp: 100 } })]), party([unit({ range: 'melee', stats: { hp: 50 } })]));
    const [p, e] = [byId(s, 'p0'), byId(s, 'e0')];
    applyEffects(s, p, [give(THORNS)], {}, 0);
    dealDamage(s, e, p, 5, { dot: true }, 0);
    expect(e.hp).toBe(50);
  });

  it('a speed burst adds SPD from the start of combat and wears off after its tick', () => {
    const fast = { ...unit({ name: 'Fast', stats: { hp: 1000, atk: 0 } }), speedBurst: { spd: 10, untilTick: 20 } };
    const r = simulateCombat({ player: party([fast]), enemy: party([unit({ stats: { hp: 1000, atk: 0 } })]), rng: new Rng(1), tickCap: 60 });
    const buffs = ofType(r.events, 'buff').filter((e) => e.target === 'p0' && e.stat === 'spd');
    expect(buffs.map((b) => [b.tick, b.value, b.statAfter])).toEqual([
      [0, 10, 20],
      [21, -10, 10],
    ]);
    // 20 SPD for 20 ticks, then 10 SPD: 4 turns by tick 20, about one every 10 ticks after.
    const turns = (id: string) => (r.summary.find((u) => u.id === id)?.actions ?? []).reduce((n, a) => n + a.uses, 0);
    expect(turns('p0')).toBeGreaterThan(turns('e0'));
  });

  it('overflow healing becomes a shield for a source with overhealShield', () => {
    const healer = { ...unit({ stats: { hp: 100, atk: 10 } }), overhealShield: 0.5 };
    const s = makeState(party([healer, unit({ stats: { hp: 40 } })]), party([unit()]));
    const [h, ally] = [byId(s, 'p0'), byId(s, 'p1')];
    ally.hp = 35;
    applyEffects(s, h, [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1.5 } }], {}, 0);
    expect(ally.hp).toBe(40);
    // 15 healing, 5 needed: 10 overflow, half of it a shield.
    expect(ally.shield).toBe(5);
  });
});

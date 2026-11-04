// Engine rules added with the Mercenary: conditional hits that use up a
// status, random stat drops scaled by the last hit, per-weapon amounts and
// critical hits.
import { describe, expect, it } from 'vitest';
import { applyEffects } from './effects.ts';
import { dealDamage } from './hits.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';
import type { StatusDef } from './types.ts';

const LIMB: StatusDef = { id: 'limb', name: 'Limb', stats: { spd: -1 }, maxStacks: 4 };

describe('Mercenary mechanics', () => {
  it('limbs stack to 4, each −1 SPD', () => {
    const state = makeState(party([unit({ stats: { atk: 10 } })]), party([unit({ stats: { spd: 10 } })]));
    const src = byId(state, 'p0');
    applyEffects(state, src, [{ kind: 'status', target: 'nearest', status: LIMB, stacks: 6 }], {}, 0);
    expect(byId(state, 'e0').statuses.get('limb')?.stacks).toBe(4);
    expect(byId(state, 'e0').spd).toBe(6);
  });

  it('a hit that requires a status skips targets without enough, and can use the stacks up', () => {
    const state = makeState(party([unit({ stats: { atk: 10 } })]), party([unit({ stats: { hp: 200, spd: 10 } })]));
    const src = byId(state, 'p0');
    const target = byId(state, 'e0');
    const execute = [{ kind: 'damage' as const, target: 'nearest' as const, amount: { atk: 4 }, requires: { status: 'limb', stacks: 4, consume: true } }];
    applyEffects(state, src, [{ kind: 'status', target: 'nearest', status: LIMB, stacks: 3 }], {}, 0);
    applyEffects(state, src, execute, {}, 0);
    expect(target.hp).toBe(200);
    applyEffects(state, src, [{ kind: 'status', target: 'nearest', status: LIMB, stacks: 1 }], {}, 0);
    applyEffects(state, src, execute, {}, 0);
    expect(target.hp).toBe(160);
    expect(target.statuses.has('limb')).toBe(false);
    // The SPD the limbs took comes back when they're used up.
    expect(target.spd).toBe(10);
  });

  it('a random debuff hits one of ATK, DEF or SPD, scaled by the last hit', () => {
    const state = makeState(party([unit({ stats: { atk: 40 } })]), party([unit({ stats: { hp: 500, atk: 50, def: 10, spd: 50 } })]));
    const src = byId(state, 'p0');
    applyEffects(state, src, [
      { kind: 'damage', target: 'nearest', amount: { atk: 1 } },
      { kind: 'debuff', target: 'nearest', stat: 'random', amount: { flat: 1, lastHit: 0.1 } },
    ], {}, 0);
    const [drop] = ofType(state.events, 'buff');
    expect(['atk', 'def', 'spd']).toContain(drop!.stat);
    expect(drop!.value).toBe(-3); // 1 + 10% of the 20 damage that got through DEF
  });

  it('amounts can scale per weapon carried', () => {
    const state = makeState(party([{ ...unit({ stats: { atk: 10 } }), weapons: 3 }]), party([unit({ stats: { hp: 100 } })]));
    applyEffects(state, byId(state, 'p0'), [{ kind: 'buff', target: 'self', stat: 'atk', amount: { weapons: 2 } }], {}, 0);
    expect(byId(state, 'p0').atk).toBe(16);
  });

  it('critical hits deal double damage and are marked; damage over time never crits', () => {
    const state = makeState(party([{ ...unit({ stats: { atk: 10 } }), critChance: 1 }]), party([unit({ stats: { hp: 100 } })]));
    const src = byId(state, 'p0');
    const target = byId(state, 'e0');
    dealDamage(state, src, target, 10, {}, 0);
    expect(target.hp).toBe(80);
    expect(ofType(state.events, 'damage')[0]).toMatchObject({ value: 20, crit: true });
    dealDamage(state, src, target, 10, { dot: true }, 0);
    expect(target.hp).toBe(70);
  });

  it('units without a crit chance never crit', () => {
    const state = makeState(party([unit({ stats: { atk: 10 } })]), party([unit({ stats: { hp: 1000 } })]));
    for (let i = 0; i < 50; i++) dealDamage(state, byId(state, 'p0'), byId(state, 'e0'), 10, {}, 0);
    expect(ofType(state.events, 'damage').every((e) => e.value === 10 && !e.crit)).toBe(true);
  });
});

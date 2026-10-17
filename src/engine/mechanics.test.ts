import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { applyEffects, dealDamage, isBacklineMelee } from './effects.ts';
import { Rng } from './rng.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';
import type { AbilityDef } from './types.ts';

const tough = () => unit({ stats: { hp: 200, atk: 0 } });
const zap = (cooldown: number, flat = 10): AbilityDef => ({
  id: 'zap',
  name: 'Zap',
  description: '',
  cooldown,
  effects: [{ kind: 'damage', target: 'nearest', amount: { flat } }],
});

describe('unit traits', () => {
  it('reach ignores the back-row melee penalty', () => {
    const s = makeState(party([tough()], [{ ...unit({ range: 'melee' }), reach: true }]), party([tough()]));
    expect(isBacklineMelee(s, byId(s, 'p3'))).toBe(false);
    dealDamage(s, byId(s, 'p3'), byId(s, 'e0'), 10, {}, 0);
    expect(byId(s, 'e0').hp).toBe(190);
  });

  it('lifesteal heals the source for a share of damage dealt, including shield damage', () => {
    const s = makeState(party([{ ...unit({ stats: { hp: 40 } }), lifesteal: 0.5 }]), party([tough()]));
    byId(s, 'p0').hp = 20;
    byId(s, 'e0').shield = 4;
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 10, {}, 0);
    expect(byId(s, 'p0').hp).toBe(25);
    expect(ofType(s.events, 'heal')[0]).toMatchObject({ source: 'p0', target: 'p0', value: 5 });
  });

  it('abilityPower scales ability damage but not basic attacks', () => {
    const caster = { ...unit({ stats: { atk: 10 }, ability: { ...zap(2), initialCooldown: 1 } }), abilityPower: 1.5 };
    const r = simulateCombat({ player: party([caster]), enemy: party([tough()]), rng: new Rng(1), tickCap: 20 });
    expect(ofType(r.events, 'damage').filter((d) => d.source === 'p0').map((d) => d.value)).toEqual([15, 10]);
  });
});

describe('new effects', () => {
  it('debuff lowers a stat, never below 0, and logs a negative change', () => {
    const s = makeState(party([unit()]), party([unit({ stats: { def: 3 } })]));
    applyEffects(s, byId(s, 'p0'), [{ kind: 'debuff', target: 'nearest', stat: 'def', amount: { flat: 5 } }], {}, 0);
    expect(byId(s, 'e0').def).toBe(0);
    expect(ofType(s.events, 'buff')[0]).toMatchObject({ stat: 'def', value: -3, statAfter: 0 });
  });

  it('cooldown effects delay or haste abilities, hasting no sooner than next turn', () => {
    const s = makeState(party([unit()]), party([unit({ ability: zap(3) })]));
    expect(byId(s, 'e0').cooldown).toBe(3);
    applyEffects(s, byId(s, 'p0'), [{ kind: 'cooldown', target: 'nearest', turns: 2 }], {}, 0);
    expect(byId(s, 'e0').cooldown).toBe(5);
    applyEffects(s, byId(s, 'p0'), [{ kind: 'cooldown', target: 'nearest', turns: -10 }], {}, 0);
    expect(byId(s, 'e0').cooldown).toBe(1);
    expect(ofType(s.events, 'cooldown').map((e) => e.cooldownAfter)).toEqual([5, 1]);
  });

  it('a hasted unit casts on its next turn in real combat', () => {
    const hastener = unit({
      stats: { atk: 0, spd: 20 },
      triggers: [{ label: 'Haste', on: 'startOfCombat', effects: [{ kind: 'cooldown', target: 'allAllies', turns: -9 }] }],
    });
    const caster = unit({ stats: { atk: 0 }, ability: zap(10) });
    const r = simulateCombat({ player: party([hastener, caster]), enemy: party([tough()]), rng: new Rng(1), tickCap: 10 });
    expect(ofType(r.events, 'ability').map((a) => a.source)).toContain('p1');
  });
});

describe('new triggers', () => {
  it('onAbility fires right after the unit casts', () => {
    const caster = unit({
      stats: { atk: 0 },
      ability: { ...zap(1), effects: [] },
      triggers: [{ label: 'Echo', on: 'onAbility', effects: [] }],
    });
    const r = simulateCombat({ player: party([caster]), enemy: party([tough()]), rng: new Rng(1), tickCap: 10 });
    const ability = r.events.findIndex((e) => e.type === 'ability');
    expect(r.events[ability + 1]).toMatchObject({ type: 'trigger', label: 'Echo', on: 'onAbility' });
  });

  it('onBloodied fires once when HP first drops below 50%', () => {
    const berserk = unit({
      stats: { hp: 20 },
      triggers: [{ label: 'Rage', on: 'onBloodied', effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 5 } }] }],
    });
    const s = makeState(party([unit()]), party([berserk]));
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 9, {}, 0);
    expect(ofType(s.events, 'trigger')).toHaveLength(0);
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 3, {}, 0);
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 3, {}, 0);
    expect(ofType(s.events, 'trigger').map((t) => t.label)).toEqual(['Rage']);
    expect(byId(s, 'e0').atk).toBe(10);
  });

  it('onBloodied does not fire on a killing blow', () => {
    const berserk = unit({ stats: { hp: 20 }, triggers: [{ label: 'Rage', on: 'onBloodied', effects: [] }] });
    const s = makeState(party([unit()]), party([berserk]));
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 50, {}, 0);
    expect(ofType(s.events, 'trigger')).toHaveLength(0);
  });
});

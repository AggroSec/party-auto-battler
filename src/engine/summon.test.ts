import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { applyEffects } from './effects.ts';
import { Rng } from './rng.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';
import type { Effect, SummonDef } from './types.ts';

const turret: SummonDef = {
  name: 'Turret',
  classId: 'turret',
  hp: { maxHp: 0.5 },
  atk: { atk: 0.5 },
  def: 1,
  spd: 10,
  range: 'ranged',
  attackTarget: 'nearest',
  row: 'back',
};
const summon = (fallback?: Effect[]): Effect => ({ kind: 'summon', summon: turret, ...(fallback ? { fallback } : {}) });
const caster = () => unit({ stats: { hp: 40, atk: 10 } });

describe('summons', () => {
  it('fill the first empty slot in the preferred row, scaled from the summoner', () => {
    const s = makeState(party([caster()]), party([unit()]));
    applyEffects(s, byId(s, 'p0'), [summon()], {}, 0);
    const t = byId(s, 'ps0');
    expect(t).toMatchObject({ side: 'player', pos: { row: 'back', col: 0 }, maxHp: 20, atk: 5, def: 1, spd: 10, summonedBy: 'p0' });
    expect(ofType(s.events, 'summon')[0]).toMatchObject({ source: 'p0', unit: { id: 'ps0', name: 'Turret', classId: 'turret' } });
  });

  it('scale HP and ATK with ability power', () => {
    const s = makeState(party([caster()]), party([unit()]));
    applyEffects(s, byId(s, 'p0'), [summon()], {}, 0, 1.5);
    expect(byId(s, 'ps0')).toMatchObject({ maxHp: 30, atk: 8 });
  });

  it('use the other row, then the fallback, when the preferred row is full', () => {
    const s = makeState(party([caster(), null, null], [unit(), unit()]), party([unit({ stats: { hp: 100 } })]));
    applyEffects(s, byId(s, 'p0'), [summon()], {}, 0);
    expect(byId(s, 'ps0').pos).toEqual({ row: 'front', col: 1 });
    applyEffects(s, byId(s, 'p0'), [summon()], {}, 0);
    applyEffects(s, byId(s, 'p0'), [summon([{ kind: 'damage', target: 'nearest', amount: { flat: 7 } }])], {}, 0);
    expect(ofType(s.events, 'summon')).toHaveLength(2);
    expect(byId(s, 'e0').hp).toBe(93);
  });

  it('can take the slot of a fallen unit', () => {
    const s = makeState(party([caster()], [unit(), unit()]), party([unit()]));
    byId(s, 'p3').alive = false;
    applyEffects(s, byId(s, 'p0'), [summon()], {}, 0);
    expect(byId(s, 'ps0').pos).toEqual({ row: 'back', col: 0 });
  });

  it('fight, act on the gauge and keep their side alive', () => {
    const summoner = unit({
      stats: { hp: 1, atk: 10, spd: 20 },
      ability: { id: 'deploy', name: 'Deploy', description: '', cooldown: 99, initialCooldown: 1, effects: [summon()] },
    });
    const r = simulateCombat({ player: party([summoner]), enemy: party([unit({ stats: { hp: 30, atk: 5, spd: 5 } })]), rng: new Rng(1) });
    const turretId = ofType(r.events, 'summon')[0]!.unit.id;
    expect(ofType(r.events, 'attack').some((a) => a.source === turretId)).toBe(true);
    expect(r.summary.find((x) => x.id === turretId)).toMatchObject({ summonedBy: 'p0' });
  });
});

describe('action counts', () => {
  it('count attacks and ability casts per unit', () => {
    const u = unit({
      stats: { hp: 500, atk: 1, spd: 10 },
      ability: { id: 'x', name: 'X', description: '', cooldown: 3, effects: [] },
    });
    const r = simulateCombat({ player: party([u]), enemy: party([unit({ stats: { hp: 500, atk: 0, spd: 1 } })]), rng: new Rng(1), tickCap: 90 });
    expect(r.summary.find((x) => x.id === 'p0')).toMatchObject({ attacks: 6, abilities: 3 });
  });
});

describe('payHp', () => {
  it('costs the source HP without crediting an attacker or feeding lifesteal', () => {
    const thorns = { label: 'Thorns', on: 'onHurt' as const, effects: [{ kind: 'damage' as const, target: 'triggerSource' as const, amount: { flat: 5 } }] };
    const s = makeState(party([{ ...unit({ stats: { hp: 50 } }), lifesteal: 1, triggers: [thorns] }]), party([unit()]));
    const p0 = byId(s, 'p0');
    applyEffects(s, p0, [{ kind: 'payHp', amount: { maxHp: 0.1 } }], {}, 0, 2);
    expect(p0.hp).toBe(45);
    expect(p0.stats.damageDealt).toBe(0);
    expect(ofType(s.events, 'heal')).toHaveLength(0);
    expect(ofType(s.events, 'damage')).toEqual([expect.objectContaining({ source: 'p0', target: 'p0', value: 5 })]);
  });

  it('comes out of HP, never shields, so missing-HP payoffs work while shielded', () => {
    const s = makeState(party([unit({ stats: { hp: 50, def: 10 } })]), party([unit()]));
    const p0 = byId(s, 'p0');
    p0.shield = 30;
    applyEffects(s, p0, [{ kind: 'payHp', amount: { maxHp: 0.1 } }], {}, 0, 2);
    expect(p0.hp).toBe(45);
    expect(p0.shield).toBe(30);
  });
});

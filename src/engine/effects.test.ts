import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { MAX_TRIGGER_DEPTH, applyEffects, dealDamage } from './effects.ts';
import { Rng } from './rng.ts';
import { byId, makeState, ofType, party, unit, withTriggers } from './test-helpers.ts';
import type { Party } from './types.ts';

const fight = (player: Party, enemy: Party, tickCap?: number) =>
  simulateCombat({ player, enemy, rng: new Rng(1), ...(tickCap ? { tickCap } : {}) });

describe('effects', () => {
  it('splash damages row neighbours only', () => {
    const s = makeState(party([unit()]), party([unit(), unit(), unit()], [unit()]));
    applyEffects(s, byId(s, 'p0'), [{ kind: 'damage', target: 'melee', amount: { flat: 10 }, splash: 0.5 }], {}, 0);
    expect(byId(s, 'e0').hp).toBe(10);
    expect(byId(s, 'e1').hp).toBe(15);
    expect(byId(s, 'e2').hp).toBe(20);
    expect(byId(s, 'e3').hp).toBe(20);
  });

  it('multi-hit effects re-select their target each hit', () => {
    const s = makeState(party([unit()]), party([unit({ stats: { hp: 4 } }), unit()]));
    applyEffects(s, byId(s, 'p0'), [{ kind: 'damage', target: 'melee', amount: { flat: 5 }, hits: 2 }], {}, 0);
    expect(byId(s, 'e0').alive).toBe(false);
    expect(byId(s, 'e1').hp).toBe(15);
  });

  it('heals are capped at max HP and report the amount actually healed', () => {
    const s = makeState(party([unit()]), party([unit()]));
    byId(s, 'p0').hp = 17;
    applyEffects(s, byId(s, 'p0'), [{ kind: 'heal', target: 'self', amount: { flat: 10 } }], {}, 0);
    expect(byId(s, 'p0').hp).toBe(20);
    expect(ofType(s.events, 'heal')[0]).toMatchObject({ value: 3, hpAfter: 20 });
  });

  it('shields absorb damage before HP', () => {
    const s = makeState(party([unit()]), party([unit()]));
    applyEffects(s, byId(s, 'p0'), [{ kind: 'shield', target: 'self', amount: { flat: 4 } }], {}, 0);
    dealDamage(s, byId(s, 'e0'), byId(s, 'p0'), 6, false, 0);
    expect(byId(s, 'p0')).toMatchObject({ shield: 0, hp: 18 });
    expect(ofType(s.events, 'damage')[0]).toMatchObject({ value: 2, absorbed: 4 });
  });

  it('buffs change stats for the rest of combat', () => {
    const s = makeState(party([unit()]), party([unit()]));
    applyEffects(s, byId(s, 'p0'), [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } }], {}, 0);
    expect(byId(s, 'p0').atk).toBe(8);
  });
});

describe('triggers', () => {
  it('startOfCombat fires before anyone acts', () => {
    const cleric = withTriggers([
      { label: 'Bless', on: 'startOfCombat', effects: [{ kind: 'shield', target: 'allAllies', amount: { flat: 5 } }] },
    ]);
    const r = fight(party([cleric, unit()]), party([unit()]));
    const firstTurn = r.events.findIndex((e) => e.type === 'turn');
    const shields = ofType(r.events, 'shield');
    expect(shields).toHaveLength(2);
    expect(r.events.indexOf(shields[1]!)).toBeLessThan(firstTurn);
  });

  it('onHurt fires on the damaged unit and respects limit', () => {
    const tank = withTriggers(
      [{ label: 'Harden', on: 'onHurt', limit: 2, effects: [{ kind: 'buff', target: 'self', stat: 'def', amount: { flat: 1 } }] }],
      { stats: { hp: 100, atk: 0 } },
    );
    const r = fight(party([tank]), party([unit()]), 200);
    expect(ofType(r.events, 'trigger').filter((t) => t.label === 'Harden')).toHaveLength(2);
  });

  it('onHurt receives the attacker as triggerSource (thorns)', () => {
    const thorny = withTriggers(
      [{ label: 'Thorns', on: 'onHurt', effects: [{ kind: 'damage', target: 'triggerSource', amount: { flat: 2 }, pierce: true }] }],
      { stats: { hp: 100, atk: 0, spd: 1 } },
    );
    const s = makeState(party([unit()]), party([thorny]));
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 5, false, 0);
    expect(byId(s, 'p0').hp).toBe(18);
  });

  it('onAttack fires after basic attacks with the target in context', () => {
    const ranger = withTriggers([
      { label: 'Extra', on: 'onAttack', effects: [{ kind: 'damage', target: 'triggerTarget', amount: { flat: 1 }, pierce: true }] },
    ]);
    const r = fight(party([ranger]), party([unit({ stats: { hp: 100, atk: 0 } })]), 10);
    const playerHits = ofType(r.events, 'damage').filter((d) => d.source === 'p0');
    expect(playerHits.map((d) => [d.target, d.value])).toEqual([
      ['e0', 5],
      ['e0', 1],
    ]);
  });

  it('onKill fires for the killer', () => {
    const rogue = withTriggers(
      [{ label: 'Bloodlust', on: 'onKill', effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }] }],
      { stats: { atk: 50 } },
    );
    const r = fight(party([rogue]), party([unit(), unit()]));
    expect(ofType(r.events, 'buff').map((b) => b.statAfter)).toEqual([52, 54]);
  });

  it('onAllyDeath fires for surviving allies but not the fallen unit or enemies', () => {
    const grim = withTriggers([
      { label: 'Harvest', on: 'onAllyDeath', effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 1 } }] },
    ]);
    const s = makeState(party([grim, grim]), party([grim]));
    dealDamage(s, byId(s, 'e0'), byId(s, 'p0'), 999, true, 0);
    const fired = ofType(s.events, 'trigger').map((t) => t.source);
    expect(fired).toEqual(['p1']);
  });

  it('onTurnStart fires at the start of each turn', () => {
    const r = fight(
      party([withTriggers([{ label: 'Tick', on: 'onTurnStart', effects: [] }], { stats: { atk: 0 } })]),
      party([unit({ stats: { atk: 0 } })]),
      30,
    );
    expect(ofType(r.events, 'trigger')).toHaveLength(3);
  });

  it('cuts off reactive chains at MAX_TRIGGER_DEPTH', () => {
    // Two thorns units reflecting onto each other would loop forever without a cap.
    const thorny = withTriggers(
      [{ label: 'Thorns', on: 'onHurt', effects: [{ kind: 'damage', target: 'triggerSource', amount: { flat: 1 }, pierce: true }] }],
      { stats: { hp: 1000, atk: 0 } },
    );
    const s = makeState(party([thorny]), party([thorny]));
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 1, true, 0);
    expect(ofType(s.events, 'trigger')).toHaveLength(MAX_TRIGGER_DEPTH + 1);
  });

  it('chance-based triggers are seeded', () => {
    const lucky = withTriggers(
      [{ label: 'Lucky', on: 'onAttack', chance: 0.5, effects: [] }],
      { stats: { atk: 0 } },
    );
    const count = (seed: number) =>
      ofType(
        simulateCombat({ player: party([lucky]), enemy: party([unit({ stats: { atk: 0 } })]), rng: new Rng(seed), tickCap: 1000 })
          .events,
        'trigger',
      ).length;
    expect(count(5)).toBe(count(5));
    expect(count(5)).toBeGreaterThan(20);
    expect(count(5)).toBeLessThan(80);
  });
});

import { describe, expect, it } from 'vitest';
import { OVERTIME_INTERVAL, OVERTIME_START_TICK, simulateCombat } from './combat.ts';
import { applyEffects, dealDamage, isBacklineMelee } from './effects.ts';
import { OVERTIME_SOURCE } from './events.ts';
import { Rng } from './rng.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';

describe('sudden death (issue #1)', () => {
  // Units that can't hurt each other would otherwise stall until the tick cap.
  const wall = (hp = 100, extra: Parameters<typeof unit>[0] = {}) =>
    unit({ ...extra, stats: { atk: 0, hp, def: 50, ...extra.stats } });

  it('starts pulsing at OVERTIME_START_TICK with escalating percentages', () => {
    const r = simulateCombat({ player: party([wall()]), enemy: party([wall(200)]), rng: new Rng(1) });
    const pulses = ofType(r.events, 'overtime');
    expect(pulses[0]).toMatchObject({ tick: OVERTIME_START_TICK, stage: 1, percent: 0.05 });
    expect(pulses[1]).toMatchObject({ tick: OVERTIME_START_TICK + OVERTIME_INTERVAL, stage: 2 });
    expect(pulses[2]?.percent).toBeCloseTo(0.15);
  });

  it('ends otherwise-endless fights well before the tick cap; the side keeping HP% higher wins', () => {
    // Damage is a share of max HP, so a raw HP lead doesn't help; healing through it does.
    const regen = wall(100, {
      triggers: [{ label: 'Regen', on: 'onTurnStart', effects: [{ kind: 'heal', target: 'self', amount: { flat: 4 } }] }],
    });
    const r = simulateCombat({ player: party([wall(300)]), enemy: party([regen]), rng: new Rng(1) });
    expect(r.winner).toBe('enemy');
    expect(r.ticks).toBeLessThan(OVERTIME_START_TICK + 10 * OVERTIME_INTERVAL);
    expect(r.events.at(-1)).toMatchObject({ type: 'combatEnd', reason: 'elimination' });
  });

  it('is a draw when the last units of both sides fall to the same pulse', () => {
    const r = simulateCombat({ player: party([wall(100)]), enemy: party([wall(250)]), rng: new Rng(1) });
    expect(r.winner).toBe('draw');
  });

  it('deals true damage: ignores DEF and shields, credits no one', () => {
    const shielded = wall(100, {
      triggers: [{ label: 'Ward', on: 'startOfCombat', effects: [{ kind: 'shield', target: 'self', amount: { flat: 50 } }] }],
    });
    const r = simulateCombat({ player: party([shielded]), enemy: party([wall(400)]), rng: new Rng(1) });
    const first = ofType(r.events, 'damage').find((d) => d.target === 'p0' && d.source === OVERTIME_SOURCE);
    expect(first).toMatchObject({ tick: OVERTIME_START_TICK, value: 5, absorbed: 0 });
    expect(r.summary.every((s) => s.damageDealt === 0 && s.kills === 0)).toBe(true);
    expect(ofType(r.events, 'death')[0]?.source).toBe(OVERTIME_SOURCE);
  });
});

describe('back-row melee penalty (issue #2)', () => {
  const melee = (atk = 10) => unit({ range: 'melee', stats: { atk } });
  const dummy = () => unit({ stats: { hp: 100 } });

  it('halves damage from a melee unit in the back row while its front row stands', () => {
    const s = makeState(party([dummy()], [melee()]), party([dummy()]));
    expect(isBacklineMelee(s, byId(s, 'p3'))).toBe(true);
    dealDamage(s, byId(s, 'p3'), byId(s, 'e0'), 10, {}, 0);
    expect(byId(s, 'e0').hp).toBe(95);
  });

  it('lifts the penalty once the front row has fallen', () => {
    const s = makeState(party([dummy()], [melee()]), party([dummy()]));
    byId(s, 'p0').alive = false;
    expect(isBacklineMelee(s, byId(s, 'p3'))).toBe(false);
    dealDamage(s, byId(s, 'p3'), byId(s, 'e0'), 10, {}, 0);
    expect(byId(s, 'e0').hp).toBe(90);
  });

  it('does not affect ranged units or melee units in the front row', () => {
    const s = makeState(party([melee()], [unit({ stats: { atk: 10 } })]), party([dummy()]));
    expect(isBacklineMelee(s, byId(s, 'p0'))).toBe(false);
    expect(isBacklineMelee(s, byId(s, 'p3'))).toBe(false);
  });

  it('applies to abilities as well as basic attacks', () => {
    const s = makeState(party([dummy()], [melee()]), party([dummy()]));
    applyEffects(s, byId(s, 'p3'), [{ kind: 'damage', target: 'nearest', amount: { flat: 20 } }], {}, 0);
    expect(byId(s, 'e0').hp).toBe(90);
  });

  it('shows up in full combat: the back-row melee unit deals half per hit', () => {
    const r = simulateCombat({
      player: party([unit({ stats: { atk: 0, hp: 500 } })], [melee(10)]),
      enemy: party([unit({ stats: { atk: 0, hp: 500 } })]),
      rng: new Rng(1),
      tickCap: 10,
    });
    expect(ofType(r.events, 'damage').filter((d) => d.source === 'p3').map((d) => d.value)).toEqual([5]);
  });
});

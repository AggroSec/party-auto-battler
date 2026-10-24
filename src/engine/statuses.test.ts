// Stacking statuses (post-M7): bursts, stat changes per stack, damage over time, Undying.
import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { applyEffects, dealDamage } from './effects.ts';
import { Rng } from './rng.ts';
import { expireStatuses } from './statuses.ts';
import { byId, makeState, ofType, party, unit, withTriggers } from './test-helpers.ts';
import type { Effect, StatusDef, TargetSelector } from './types.ts';

const RUNE: StatusDef = { id: 'rune', name: 'Rune', burstAt: 3 };
const DREAD: StatusDef = { id: 'dread', name: 'Dread', stats: { atk: -1 }, maxStacks: 3 };
const ROT: StatusDef = { id: 'rot', name: 'Rot', dot: { atk: 0.5 }, duration: 2 };
const status = (s: StatusDef, stacks = 1, target: TargetSelector = 'nearest'): Effect => ({ kind: 'status', target, status: s, stacks });
const tough = (stats = {}) => unit({ stats: { hp: 200, atk: 6, ...stats } });

describe('statuses', () => {
  it('bursts at its threshold: stacks clear and the applier’s onBurst triggers fire', () => {
    const burst = withTriggers([{ label: 'Detonate', on: 'onBurst', status: 'rune', effects: [{ kind: 'damage', target: 'triggerTarget', amount: { flat: 30 } }] }]);
    const s = makeState(party([burst]), party([tough()]));
    const [p, e] = [byId(s, 'p0'), byId(s, 'e0')];
    applyEffects(s, p, [status(RUNE, 2)], {}, 0);
    expect(e.statuses.get('rune')?.stacks).toBe(2);
    expect(e.hp).toBe(200);
    applyEffects(s, p, [status(RUNE, 1)], {}, 0);
    expect(e.statuses.has('rune')).toBe(false);
    expect(e.hp).toBe(170);
    expect(ofType(s.events, 'status').map((x) => [x.stacks, x.burst ?? false])).toEqual([[2, false], [3, false], [0, true]]);
  });

  it('onBurst triggers only fire for their own status', () => {
    const other = withTriggers([{ label: 'Wrong', on: 'onBurst', status: 'other', effects: [{ kind: 'damage', target: 'triggerTarget', amount: { flat: 30 } }] }]);
    const s = makeState(party([other]), party([tough()]));
    applyEffects(s, byId(s, 'p0'), [status(RUNE, 3)], {}, 0);
    expect(byId(s, 'e0').hp).toBe(200);
  });

  it('changes stats per stack up to maxStacks, and undoes exactly what it took', () => {
    const s = makeState(party([unit()]), party([tough({ atk: 2 })]));
    const [p, e] = [byId(s, 'p0'), byId(s, 'e0')];
    applyEffects(s, p, [status(DREAD, 2)], {}, 0);
    expect(e.atk).toBe(0);
    applyEffects(s, p, [status(DREAD, 5)], {}, 0);
    expect(e.statuses.get('dread')?.stacks).toBe(3);
    expect(e.atk).toBe(0);
    // Expiring gives back only the 2 ATK it actually took.
    e.statuses.get('dread')!.turns = 1;
    expireStatuses(s, e);
    expect(e.atk).toBe(2);
  });

  it('deals damage over time each turn, ignoring DEF, then expires', () => {
    const victim = tough({ def: 10, atk: 0, spd: 10 });
    const r = simulateCombat({
      player: party([unit({ stats: { atk: 10, spd: 1 }, triggers: [{ label: 'Rot', on: 'startOfCombat', effects: [status(ROT, 2)] }] })]),
      enemy: party([victim]),
      rng: new Rng(1),
      tickCap: 40,
    });
    // 2 stacks × 5 (50% of 10 ATK) = 10 per enemy turn, for 2 turns; DEF ignored.
    const dots = ofType(r.events, 'damage').filter((d) => d.target === 'e0' && d.value === 10);
    expect(dots).toHaveLength(2);
    expect(ofType(r.events, 'status').at(-1)).toMatchObject({ target: 'e0', stacks: 0 });
  });

  it('preventDeath holds the unit at 1 HP while it lasts', () => {
    const UNDYING: StatusDef = { id: 'undying', name: 'Undying Rage', preventDeath: true, duration: 2 };
    const s = makeState(party([unit()]), party([tough()]));
    const p = byId(s, 'p0');
    applyEffects(s, p, [status(UNDYING, 1, 'self')], {}, 0);
    dealDamage(s, byId(s, 'e0'), p, 999, { true: true }, 0);
    expect(p).toMatchObject({ alive: true, hp: 1 });
    p.statuses.clear();
    dealDamage(s, byId(s, 'e0'), p, 999, { true: true }, 0);
    expect(p.alive).toBe(false);
  });

  it('missingHp amounts scale with the source’s lost HP', () => {
    const s = makeState(party([unit({ stats: { hp: 100 } })]), party([tough()]));
    const p = byId(s, 'p0');
    p.hp = 40;
    applyEffects(s, p, [{ kind: 'damage', target: 'nearest', amount: { missingHp: 0.5 } }], {}, 0);
    expect(byId(s, 'e0').hp).toBe(170);
  });
});

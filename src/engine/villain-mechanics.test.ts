// Milestone 15 engine rules: statuses that need other statuses (the
// Apostate's lock), effects gated on the source's own stacks and damage per
// own stack (the Marauder's Grudge), healing that hurts, spreading
// afflictions, and Reign of Dread's aura.
import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { applyEffects } from './effects.ts';
import { applyHeal, dealDamage } from './hits.ts';
import { Rng } from './rng.ts';
import { conditionHolds } from './tactics.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';
import type { Effect, StatusDef } from './types.ts';

const CURSE: StatusDef = { id: 'curse', name: 'Curse', affliction: true, duration: 3, maxStacks: 1 };
const HUSHED: StatusDef = { id: 'hushed', name: 'Hushed', silence: true, affliction: true, duration: 2, maxStacks: 1 };
const DOOMED: StatusDef = { id: 'doomed', name: 'Doomed', damageTaken: 1.25, affliction: true, duration: 2, maxStacks: 1 };
const PROFANE: StatusDef = { ...CURSE, name: 'Profane Curse', healsHurt: 0.5 };
const ROT: StatusDef = { id: 'rot', name: 'Rot', dot: { atk: 0.5 }, affliction: true, maxStacks: 3 };
const GRUDGE: StatusDef = { id: 'grudge', name: 'Grudge', maxStacks: 5 };
const DAZED: StatusDef = { id: 'dazed', name: 'Dazed', stun: true, affliction: true, duration: 1, maxStacks: 1 };
const status = (s: StatusDef, target: 'self' | 'nearest' | 'allEnemies' = 'nearest', stacks = 1): Extract<Effect, { kind: 'status' }> => ({ kind: 'status', target, status: s, stacks });

describe('Milestone 15 mechanics', () => {
  it('a status with `requires` lands only on a target that has every listed status', () => {
    const s = makeState(party([unit()]), party([unit({ stats: { hp: 50 } })]));
    const [p, e] = [byId(s, 'p0'), byId(s, 'e0')];
    const lock: Effect[] = [{ ...status(DOOMED), requires: [CURSE.id, HUSHED.id] }];
    applyEffects(s, p, [status(CURSE), ...lock], {}, 0);
    expect(e.statuses.has('doomed')).toBe(false);
    applyEffects(s, p, [status(HUSHED), ...lock], {}, 0);
    expect(e.statuses.has('doomed')).toBe(true);
  });

  it('`selfStacks` gates an effect on the source’s own stacks, and `perStack.self` spends them for damage', () => {
    const s = makeState(party([unit({ stats: { atk: 10 } })]), party([unit({ stats: { hp: 100 } })]));
    const [p, e] = [byId(s, 'p0'), byId(s, 'e0')];
    const haymaker: Effect[] = [
      { ...status(DAZED), selfStacks: { status: GRUDGE.id, atLeast: 3 } },
      { kind: 'damage', target: 'nearest', amount: { atk: 1 }, perStack: { status: GRUDGE.id, atk: 0.5, consume: true, self: true } },
    ];
    applyEffects(s, p, [status(GRUDGE, 'self', 2), ...haymaker], {}, 0);
    expect(e.statuses.has('dazed')).toBe(false);
    expect(e.hp).toBe(80); // 10 + 2 × 5
    expect(p.statuses.has('grudge')).toBe(false);
    applyEffects(s, p, [status(GRUDGE, 'self', 3), ...haymaker], {}, 0);
    expect(e.statuses.has('dazed')).toBe(true);
    expect(e.hp).toBe(55); // 10 + 3 × 5
  });

  it('healing on a unit with healsHurt is cancelled and half of it hurts instead, credited to the curse’s applier', () => {
    const s = makeState(party([unit()]), party([unit({ stats: { hp: 50 } }), unit({ name: 'Healer' })]));
    const [p, e, healer] = [byId(s, 'p0'), byId(s, 'e0'), byId(s, 'e1')];
    e.hp = 30;
    applyEffects(s, p, [status(PROFANE)], {}, 0);
    expect(applyHeal(s, healer, e, 20)).toBe(0);
    expect(e.hp).toBe(20);
    expect(p.stats.damageDealt).toBe(10);
    expect(healer.stats.healingDone).toBe(0);
    expect(ofType(s.events, 'damage').at(-1)).toMatchObject({ source: 'p0', target: 'e0', value: 10 });
  });

  it('the extra damage allies deal to a unit that takes more damage is credited to whoever applied it', () => {
    const s = makeState(party([unit(), unit({ name: 'Ally' })]), party([unit({ stats: { hp: 500, def: 0 } })]));
    const [p, ally, e] = [byId(s, 'p0'), byId(s, 'p1'), byId(s, 'e0')];
    applyEffects(s, p, [status(DOOMED)], {}, 0);
    const row = () => p.tallies.get(p.via)!;
    dealDamage(s, ally, e, 40, { pierce: true }, 0);
    expect(e.hp).toBe(450); // 40 × 1.25
    expect(row().amplified).toBe(10);
    expect(row().damage).toBe(0);
    // The applier's own hits already count the bonus in their damage.
    dealDamage(s, p, e, 40, { pierce: true }, 0);
    expect(row().amplified).toBe(10);
  });

  it('spread copies the victim’s afflictions (not its buffs) to the other targets, if it has what `requires` asks for', () => {
    const s = makeState(party([unit()]), party([unit(), unit(), unit()]));
    const [p, a, b, c] = [byId(s, 'p0'), byId(s, 'e0'), byId(s, 'e1'), byId(s, 'e2')];
    applyEffects(s, p, [status(ROT, 'nearest', 2), status(CURSE), status(GRUDGE)], {}, 0);
    const spread: Effect = { kind: 'spread', target: 'allEnemies', from: 'triggerTarget', requires: [DOOMED.id] };
    applyEffects(s, p, [spread], { triggerTarget: a }, 0);
    expect(b.statuses.size).toBe(0);
    applyEffects(s, p, [status(DOOMED)], {}, 0);
    applyEffects(s, p, [spread], { triggerTarget: a }, 0);
    for (const u of [b, c]) {
      expect(u.statuses.get('rot')?.stacks).toBe(2);
      expect(u.statuses.has('curse')).toBe(true);
      expect(u.statuses.has('grudge')).toBe(false);
    }
  });

  it('Reign of Dread: the other side loses a share of ATK and DEF until its tick, then gets it back', () => {
    const villain = { ...unit({ stats: { hp: 1000, atk: 0 } }), dreadAura: { atk: 0.2, def: 0.5, untilTick: 10 } };
    const r = simulateCombat({ player: party([villain]), enemy: party([unit({ stats: { hp: 1000, atk: 10, def: 4 } })]), rng: new Rng(1), tickCap: 30 });
    const changes = ofType(r.events, 'buff').filter((e) => e.target === 'e0').map((e) => [e.tick, e.stat, e.value, e.statAfter]);
    expect(changes).toEqual([
      [0, 'atk', -2, 8],
      [0, 'def', -2, 2],
      [11, 'atk', 2, 10],
      [11, 'def', 2, 4],
    ]);
    expect(ofType(r.events, 'buff').filter((e) => e.target === 'p0')).toEqual([]);
  });

  it('the selfStacks rule condition counts the unit’s own stacks', () => {
    const s = makeState(party([unit()]), party([unit()]));
    const p = byId(s, 'p0');
    const when = { kind: 'selfStacks', status: GRUDGE.id, atLeast: 3 } as const;
    applyEffects(s, p, [status(GRUDGE, 'self', 2)], {}, 0);
    expect(conditionHolds(s, p, when, undefined)).toBe(false);
    applyEffects(s, p, [status(GRUDGE, 'self', 1)], {}, 0);
    expect(conditionHolds(s, p, when, undefined)).toBe(true);
  });
});

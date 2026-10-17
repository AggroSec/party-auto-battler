import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { Rng } from './rng.ts';
import { ofType, party, unit } from './test-helpers.ts';
import type { AbilityDef, Party } from './types.ts';

const fight = (player: Party, enemy: Party, seed = 1, tickCap?: number) =>
  simulateCombat({ player, enemy, rng: new Rng(seed), ...(tickCap ? { tickCap } : {}) });

/** Units that never deal damage, for observing the timeline. */
const pacifist = (spd: number) => unit({ stats: { atk: 0, spd, hp: 50 } });

describe('timeline', () => {
  it('gives units turns in proportion to SPD', () => {
    const r = fight(party([pacifist(20)]), party([pacifist(10)]), 1, 100);
    const turns = ofType(r.events, 'turn');
    expect(turns.filter((t) => t.source === 'p0')).toHaveLength(20);
    expect(turns.filter((t) => t.source === 'e0')).toHaveLength(10);
  });

  it('lets the fuller gauge act first when units are ready on the same tick', () => {
    const r = fight(party([pacifist(10)]), party([pacifist(11)]), 1, 10);
    const turns = ofType(r.events, 'turn');
    expect(turns.map((t) => [t.tick, t.source])).toEqual([
      [10, 'e0'],
      [10, 'p0'],
    ]);
  });

  it('breaks exact ties player-first, then by board order', () => {
    const r = fight(party([pacifist(10), pacifist(10)]), party([pacifist(10)]), 1, 10);
    expect(ofType(r.events, 'turn').map((t) => t.source)).toEqual(['p0', 'p1', 'e0']);
  });

  it('never lets a dead unit act', () => {
    const glass = unit({ stats: { hp: 1, spd: 5 } });
    const r = fight(party([unit({ stats: { spd: 20 } })]), party([glass, glass]));
    const deaths = ofType(r.events, 'death');
    for (const d of deaths) {
      const after = r.events.slice(r.events.indexOf(d));
      expect(ofType(after, 'turn').some((t) => t.source === d.target)).toBe(false);
    }
  });
});

describe('abilities', () => {
  const zap: AbilityDef = {
    id: 'zap',
    name: 'Zap',
    description: '',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'melee', amount: { flat: 1 } }],
  };

  const actions = (p: Party, tickCap: number) =>
    fight(p, party([pacifist(1)]), 1, tickCap)
      .events.filter((e) => e.type === 'attack' || e.type === 'ability')
      .filter((e) => e.source === 'p0')
      .map((e) => e.type);

  it('casts every Nth turn instead of attacking', () => {
    const caster = unit({ stats: { atk: 0, spd: 10 }, ability: zap });
    expect(actions(party([caster]), 60)).toEqual(['attack', 'attack', 'ability', 'attack', 'attack', 'ability']);
  });

  it('respects initialCooldown for the first cast', () => {
    const caster = unit({ stats: { atk: 0, spd: 10 }, ability: { ...zap, initialCooldown: 1 } });
    expect(actions(party([caster]), 40)).toEqual(['ability', 'attack', 'attack', 'ability']);
  });
});

describe('outcomes', () => {
  it('ends when one side is eliminated and reports the winner', () => {
    const r = fight(party([unit({ stats: { atk: 50 } })]), party([unit(), unit()]));
    expect(r.winner).toBe('player');
    expect(r.events.at(-1)).toMatchObject({ type: 'combatEnd', winner: 'player', reason: 'elimination' });
    expect(r.summary.filter((u) => u.side === 'enemy').every((u) => !u.survived)).toBe(true);
  });

  it('treats a tick-cap timeout as a draw', () => {
    const r = fight(party([pacifist(10)]), party([pacifist(10)]), 1, 50);
    expect(r).toMatchObject({ winner: 'draw', ticks: 50 });
    expect(r.events.at(-1)).toMatchObject({ type: 'combatEnd', winner: 'draw', reason: 'tickCap' });
  });

  it('resolves empty parties immediately', () => {
    expect(fight(party([]), party([unit()])).winner).toBe('enemy');
    expect(fight(party([unit()]), party([])).winner).toBe('player');
    expect(fight(party([]), party([])).winner).toBe('draw');
  });

  it('is a draw when both sides die at once', () => {
    // Kills the last enemy, then its onKill effect kills itself.
    const kamikaze = unit({
      stats: { atk: 100 },
      triggers: [{ label: 'Boom', on: 'onKill', effects: [{ kind: 'damage', target: 'self', amount: { flat: 999 } }] }],
    });
    expect(fight(party([kamikaze]), party([unit({ stats: { spd: 1 } })])).winner).toBe('draw');
  });

  it('starts with a snapshot of every unit', () => {
    const r = fight(party([unit()], [unit()]), party([unit()]));
    const start = r.events[0];
    expect(start?.type).toBe('combatStart');
    if (start?.type === 'combatStart') {
      expect(start.units.map((u) => u.id)).toEqual(['p0', 'p3', 'e0']);
    }
  });

  it('builds a summary consistent with the event log', () => {
    const r = fight(party([unit(), unit()]), party([unit(), unit({ stats: { def: 3 } })]), 7);
    for (const s of r.summary) {
      const dealt = ofType(r.events, 'damage')
        .filter((d) => d.source === s.id)
        .reduce((sum, d) => sum + d.value + d.absorbed, 0);
      const taken = ofType(r.events, 'damage')
        .filter((d) => d.target === s.id)
        .reduce((sum, d) => sum + d.value + d.absorbed, 0);
      expect(s.damageDealt).toBe(dealt);
      expect(s.damageTaken).toBe(taken);
    }
  });

  it('rejects oversized parties', () => {
    expect(() => fight({ front: [unit(), unit(), unit(), unit()], back: [] }, party([unit()]))).toThrow();
  });
});

describe('determinism', () => {
  // Random targeting and chance-based triggers both consume the Rng.
  const chaotic = unit({
    attackTarget: 'randomEnemy',
    triggers: [
      { label: 'Maybe', on: 'onAttack', chance: 0.5, effects: [{ kind: 'damage', target: 'randomEnemy', amount: { flat: 3 } }] },
    ],
  });
  const teams = () => [party([chaotic, chaotic], [chaotic]), party([chaotic, chaotic, chaotic], [chaotic])] as const;

  it('produces an identical event log for the same seed', () => {
    const [a1, b1] = teams();
    const [a2, b2] = teams();
    expect(fight(a1, b1, 1234)).toEqual(fight(a2, b2, 1234));
  });

  it('produces different logs for different seeds', () => {
    const [a, b] = teams();
    const logs = new Set([1, 2, 3, 4, 5].map((seed) => JSON.stringify(fight(a, b, seed).events)));
    expect(logs.size).toBeGreaterThan(1);
  });

  it('does not mutate its input parties', () => {
    const [a, b] = teams();
    const before = JSON.stringify([a, b]);
    fight(a, b, 9);
    expect(JSON.stringify([a, b])).toBe(before);
  });
});

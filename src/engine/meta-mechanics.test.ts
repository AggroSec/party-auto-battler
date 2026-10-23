// Combat mechanics added for M7: revives, execute damage, row selectors and onAllyKill.
import { describe, expect, it } from 'vitest';
import { applyEffects, dealDamage } from './effects.ts';
import { byId, makeState, ofType, party, unit, withTriggers } from './test-helpers.ts';

const tough = () => unit({ stats: { hp: 200, atk: 0 } });

describe('revive', () => {
  it('survives a lethal hit at a share of max HP, once per charge, then fires onRevive', () => {
    const phoenix = {
      ...withTriggers([{ label: 'Ashes', on: 'onRevive', effects: [{ kind: 'shield', target: 'self', amount: { flat: 5 } }] }], { stats: { hp: 40 } }),
      revive: { hp: 0.25, times: 1 },
    };
    const s = makeState(party([phoenix]), party([tough()]));
    const p = byId(s, 'p0');
    dealDamage(s, byId(s, 'e0'), p, 100, {}, 0);
    expect(p.alive).toBe(true);
    expect(p.hp).toBe(10);
    expect(p.shield).toBe(5);
    expect(ofType(s.events, 'death')).toHaveLength(0);
    expect(ofType(s.events, 'trigger').map((t) => t.label)).toEqual(['Revived', 'Ashes']);
    dealDamage(s, byId(s, 'e0'), p, 100, {}, 0);
    expect(p.alive).toBe(false);
  });
});

describe('execute bonus', () => {
  it('adds damage only against targets below half HP', () => {
    const s = makeState(party([{ ...unit(), executeBonus: 0.5 }]), party([unit({ stats: { hp: 100 } })]));
    const e = byId(s, 'e0');
    dealDamage(s, byId(s, 'p0'), e, 10, {}, 0);
    expect(e.hp).toBe(90);
    e.hp = 40;
    dealDamage(s, byId(s, 'p0'), e, 10, {}, 0);
    expect(e.hp).toBe(25);
  });
});

describe('row selectors', () => {
  it('rowAllies hits the source row; allyFrontRow the frontmost ally row', () => {
    const s = makeState(party([unit(), unit()], [unit(), unit()]), party([tough()]));
    applyEffects(s, byId(s, 'p3'), [{ kind: 'buff', target: 'rowAllies', stat: 'atk', amount: { flat: 2 } }], {}, 0);
    expect(['p0', 'p1', 'p3', 'p4'].map((id) => byId(s, id).atk)).toEqual([5, 5, 7, 7]);
    applyEffects(s, byId(s, 'p3'), [{ kind: 'buff', target: 'allyFrontRow', stat: 'def', amount: { flat: 1 } }], {}, 0);
    expect(['p0', 'p1', 'p3'].map((id) => byId(s, id).def)).toEqual([1, 1, 0]);
  });
});

describe('onAllyKill', () => {
  it('fires for the killer’s allies, not the killer or the victim’s side', () => {
    const watcher = withTriggers([{ label: 'Cheer', on: 'onAllyKill', effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 1 } }] }]);
    const enemyWatcher = withTriggers([{ label: 'Cheer', on: 'onAllyKill', effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 1 } }] }]);
    const s = makeState(party([unit(), watcher]), party([unit({ stats: { hp: 1 } }), enemyWatcher]));
    dealDamage(s, byId(s, 'p0'), byId(s, 'e0'), 10, {}, 0);
    expect(byId(s, 'p1').atk).toBe(6);
    expect(byId(s, 'p0').atk).toBe(5);
    expect(byId(s, 'e1').atk).toBe(5);
  });
});

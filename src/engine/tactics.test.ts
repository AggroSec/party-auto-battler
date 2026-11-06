import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import { applyEffects } from './effects.ts';
import { Rng } from './rng.ts';
import { chooseRule } from './tactics.ts';
import { afflictionCount } from './targeting.ts';
import { byId, makeState, ofType, party, unit } from './test-helpers.ts';
import type { AbilityDef, Rule, StatusDef, UnitSetup } from './types.ts';

const CHILL: StatusDef = { id: 'chill', name: 'Chill', affliction: true, stats: { spd: -2 }, duration: 4 };
const WEAK: StatusDef = { id: 'weak', name: 'Weak', affliction: true, stats: { atk: -2 }, duration: 4 };
const HUSH: StatusDef = { id: 'hush', name: 'Hush', affliction: true, silence: true, duration: 2 };
const BIND: StatusDef = { id: 'bind', name: 'Bind', affliction: true, stun: true, duration: 1 };

const skill = (id: string, effects: AbilityDef['effects'], extra: Partial<AbilityDef> = {}): AbilityDef => ({
  id,
  name: id,
  description: id,
  cooldown: 1,
  effects,
  aim: 'enemy',
  ...extra,
});
const chill = skill('chill', [{ kind: 'status', target: 'focus', status: CHILL, stacks: 1 }]);
const weaken = skill('weaken', [{ kind: 'status', target: 'focus', status: WEAK, stacks: 1 }]);
const lash = skill('lash', [{ kind: 'damage', target: 'focus', amount: { atk: 0.5 }, perAffliction: 1 }]);

const ruled = (skills: AbilityDef[], rules: Rule[], extra: Partial<UnitSetup> = {}): UnitSetup => ({ ...unit({ stats: { atk: 10, hp: 500 } }), skills, rules, ...extra });

describe('rules mode', () => {
  it('uses the first rule whose condition holds: the lock goes on, then the kill', () => {
    const shaman = ruled([lash, chill, weaken], [
      { skill: 'lash', when: { kind: 'targetAfflictions', atLeast: 2 } },
      { skill: 'chill', when: { kind: 'targetLacks', status: 'chill' } },
      { skill: 'weaken', when: { kind: 'targetLacks', status: 'weak' } },
    ]);
    const r = simulateCombat({ player: party([shaman]), enemy: party([unit({ stats: { hp: 400, atk: 0 } })]), rng: new Rng(1) });
    const used = ofType(r.events, 'ability').map((e) => e.abilityId);
    expect(used.slice(0, 3)).toEqual(['chill', 'weaken', 'lash']);
  });

  it('damage per affliction scales with the target’s afflictions', () => {
    const s = makeState(party([ruled([lash], [])]), party([unit({ stats: { hp: 999 } })]));
    const [me, foe] = [byId(s, 'p0'), byId(s, 'e0')];
    applyEffects(s, me, lash.effects, { focus: foe }, 0);
    const plain = 999 - foe.hp;
    applyEffects(s, me, [{ kind: 'status', target: 'nearest', status: CHILL, stacks: 1 }, { kind: 'status', target: 'nearest', status: WEAK, stacks: 1 }], {}, 0);
    expect(afflictionCount(foe)).toBe(2);
    const before = foe.hp;
    applyEffects(s, me, lash.effects, { focus: foe }, 0);
    expect(before - foe.hp).toBe(plain + 20);
  });

  it('falls back to a basic attack when no rule fires, and passes over skills on cooldown', () => {
    const slow = skill('slow', [{ kind: 'damage', target: 'focus', amount: { atk: 1 } }], { cooldown: 3 });
    const r = simulateCombat({ player: party([ruled([slow], [{ skill: 'slow' }])]), enemy: party([unit({ stats: { hp: 300, atk: 0 } })]), rng: new Rng(1), tickCap: 60 });
    const turns = r.events.filter((e) => (e.type === 'ability' || e.type === 'attack') && e.source === 'p0').map((e) => e.type);
    expect(turns.slice(0, 4)).toEqual(['ability', 'attack', 'attack', 'ability']);
  });

  it('a silenced unit only basic-attacks; a stunned unit loses its turn', () => {
    const s = makeState(party([ruled([chill], [{ skill: 'chill' }])]), party([unit()]));
    const me = byId(s, 'p0');
    applyEffects(s, byId(s, 'e0'), [{ kind: 'status', target: 'nearest', status: HUSH, stacks: 1 }], {}, 0);
    expect(chooseRule(s, me).kind).toBe('attack');

    const stunned = simulateCombat({
      player: party([unit({ stats: { spd: 10 } })]),
      enemy: party([ruled([skill('bind', [{ kind: 'status', target: 'focus', status: BIND, stacks: 1 }], { cooldown: 2 })], [{ skill: 'bind' }], { stats: { hp: 500, atk: 0, def: 0, spd: 20 } })]),
      rng: new Rng(1),
      tickCap: 40,
    });
    expect(ofType(stunned.events, 'stunned').length).toBeGreaterThan(0);
  });

  it('cures remove afflictions; executions kill outright when the lock is complete, but only wound bosses', () => {
    const s = makeState(party([ruled([], [])]), party([unit({ stats: { hp: 500 } }), { ...unit({ stats: { hp: 1000 } }), boss: true }]));
    const [me, foe, boss] = [byId(s, 'p0'), byId(s, 'e0'), byId(s, 'e1')];
    const lock = [CHILL, WEAK].map((status) => ({ kind: 'status' as const, target: 'allEnemies' as const, status, stacks: 1 }));
    applyEffects(s, me, lock, {}, 0);
    applyEffects(s, me, [{ kind: 'cure', target: 'nearest', count: 1 }], {}, 0);
    expect(afflictionCount(foe)).toBe(1);
    applyEffects(s, me, [{ kind: 'execute', target: 'nearest', requires: ['chill', 'weak'], bossMaxHp: 0.25 }], {}, 0);
    expect(foe.alive).toBe(true);
    applyEffects(s, me, lock, {}, 0);
    applyEffects(s, me, [{ kind: 'execute', target: 'allEnemies', requires: ['chill', 'weak'], bossMaxHp: 0.25 }], {}, 0);
    expect(foe.alive).toBe(false);
    expect(boss.hp).toBe(750);
  });

  it('targets: the most afflicted enemy, and the rule’s focus', () => {
    const s = makeState(party([ruled([chill], [{ skill: 'chill', target: 'mostAfflicted' }])]), party([unit(), unit()]));
    applyEffects(s, byId(s, 'p0'), [{ kind: 'status', target: 'allEnemies', status: WEAK, stacks: 1 }], {}, 0);
    applyEffects(s, byId(s, 'p0'), [{ kind: 'status', target: 'focus', status: CHILL, stacks: 1 }], { focus: byId(s, 'e1') }, 0);
    const choice = chooseRule(s, byId(s, 'p0'));
    expect(choice.kind === 'skill' && choice.focus?.id).toBe('e1');
  });

  it('statuses can raise damage taken and cut healing received', () => {
    const MARK: StatusDef = { id: 'mark', name: 'Mark', affliction: true, damageTaken: 1.5, healingTaken: 0.5 };
    const s = makeState(party([unit({ stats: { atk: 10 } })]), party([unit({ stats: { hp: 100 } })]));
    const [me, foe] = [byId(s, 'p0'), byId(s, 'e0')];
    applyEffects(s, me, [{ kind: 'status', target: 'nearest', status: MARK, stacks: 1 }, { kind: 'damage', target: 'nearest', amount: { flat: 20 } }], {}, 0);
    expect(foe.hp).toBe(70);
    applyEffects(s, me, [{ kind: 'heal', target: 'nearest', amount: { flat: 20 } }], {}, 0);
    expect(foe.hp).toBe(80);
  });
});

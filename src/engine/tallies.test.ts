import { describe, expect, it } from 'vitest';
import { simulateCombat } from './combat.ts';
import type { ActionTally } from './events.ts';
import { Rng } from './rng.ts';
import { party, unit } from './test-helpers.ts';
import type { AbilityDef, StatusDef, UnitSetup } from './types.ts';

const POISON: StatusDef = { id: 'poison', name: 'Poison', affliction: true, dot: { flat: 5 }, duration: 3 };

const skill = (id: string, effects: AbilityDef['effects'], extra: Partial<AbilityDef> = {}): AbilityDef => ({ id, name: id, description: id, cooldown: 1, effects, ...extra });
const ward = skill('ward', [{ kind: 'shield', target: 'self', amount: { flat: 10 } }]);
const heal = skill('heal', [{ kind: 'heal', target: 'self', amount: { flat: 10 } }]);
const poison = skill('poison', [{ kind: 'status', target: 'focus', status: POISON, stacks: 1 }], { cooldown: 4, aim: 'enemy' });

const actionsOf = (setup: UnitSetup, foe: Partial<Parameters<typeof unit>[0]> = {}, tickCap = 80): ActionTally[] => {
  const r = simulateCombat({ player: party([setup]), enemy: party([unit({ stats: { hp: 400, atk: 1 }, ...foe })]), rng: new Rng(1), tickCap });
  return r.summary.find((s) => s.id === 'p0')!.actions!;
};
const row = (rows: ActionTally[], key: string) => rows.find((r) => r.key === key)!;

describe('per-action fight breakdown', () => {
  it('an always-ready rule on top starves every rule below it, and says so', () => {
    const setup: UnitSetup = { ...unit({ stats: { hp: 100 } }), skills: [ward, heal], rules: [{ skill: 'ward' }, { skill: 'heal' }] };
    const rows = actionsOf(setup);
    const [top, below] = [row(rows, 'rule:0'), row(rows, 'rule:1')];
    expect(top.uses).toBeGreaterThan(0);
    expect(top.shielding).toBe(top.uses * 10);
    expect(below.uses).toBe(0);
    expect(below.passed).toEqual({ cooldown: 0, unmet: 0, silenced: 0, above: top.uses });
  });

  it('counts why a reached rule was passed over, and the fallback attack', () => {
    const setup: UnitSetup = {
      ...unit({ stats: { hp: 100, atk: 10 } }),
      skills: [poison],
      rules: [{ skill: 'poison', when: { kind: 'targetLacks', status: 'poison' } }],
    };
    const rows = actionsOf(setup);
    const r = row(rows, 'rule:0');
    const attacks = row(rows, 'attack');
    expect(r.uses + r.passed!.cooldown + r.passed!.unmet).toBe(r.uses + attacks.uses);
    expect(r.passed!.cooldown).toBeGreaterThan(0);
    expect(attacks.damage).toBe(attacks.uses * 10);
  });

  it('damage over time counts toward the rule that applied it', () => {
    const setup: UnitSetup = { ...unit({ stats: { hp: 100, atk: 0 } }), skills: [poison], rules: [{ skill: 'poison' }] };
    const rows = actionsOf(setup);
    const r = row(rows, 'rule:0');
    expect(r.afflictions).toBe(r.uses);
    expect(r.damage).toBeGreaterThan(0);
    expect(r.damage % 5).toBe(0);
    expect(row(rows, 'attack').damage).toBe(0);
  });

  it('classic units: the ability, basic attacks, triggers and consumables, with kills', () => {
    const blast = { id: 'blast', name: 'Blast', description: '', cooldown: 3, effects: [{ kind: 'damage' as const, target: 'nearest' as const, amount: { flat: 30 } }] };
    const setup = unit({
      stats: { atk: 10 },
      ability: blast,
      triggers: [
        { on: 'startOfCombat', label: 'Fire Bomb', consumable: true, limit: 1, effects: [{ kind: 'damage', target: 'allEnemies', amount: { flat: 7 } }] },
        { on: 'onAttack', label: 'Spikes', effects: [{ kind: 'damage', target: 'nearest', amount: { flat: 2 } }] },
      ],
    });
    const rows = actionsOf(setup, { stats: { hp: 120, atk: 1 } }, 300);
    expect(rows.map((r) => r.key)).toEqual(['ability:blast', 'attack', 'consumable:Fire Bomb', 'trigger:Spikes']);
    expect(row(rows, 'consumable:Fire Bomb')).toMatchObject({ kind: 'consumable', uses: 1, damage: 7 });
    expect(row(rows, 'trigger:Spikes').uses).toBe(row(rows, 'attack').uses);
    expect(rows.reduce((n, r) => n + r.damage, 0)).toBe(120);
    expect(rows.reduce((n, r) => n + r.kills, 0)).toBe(1);
  });
});

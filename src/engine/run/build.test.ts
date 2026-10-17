import { describe, expect, it } from 'vitest';
import { emptyBoard } from './board.ts';
import { activeSynergies, boardUnits, newUnit, resolveBoard, resolveUnit, unitTags } from './build.ts';
import { makeCtx } from './test-fixtures.ts';

const { content } = makeCtx();

describe('resolveUnit', () => {
  it('stacks base stats, growth, talents and items', () => {
    const u = newUnit(1, 'tank', 'Bo');
    u.growth = { hp: 4, atk: 1, def: 0, spd: 0 };
    u.talents = ['tough', 'strong'];
    u.items = ['sword'];
    expect(resolveUnit(u, content).stats).toEqual({ hp: 44, atk: 11, def: 2, spd: 10 });
  });

  it('applies an item class bonus only to the tied class', () => {
    const tank = newUnit(1, 'tank', 'T');
    const archer = newUnit(2, 'archer', 'A');
    tank.items = ['boots'];
    archer.items = ['boots'];
    expect(resolveUnit(tank, content)).toMatchObject({ reach: true, stats: { spd: 12 } });
    expect(resolveUnit(archer, content).reach).toBeUndefined();
    expect(resolveUnit(archer, content).stats.spd).toBe(12);
  });

  it('an advanced class replaces the ability and adds its modifier', () => {
    const u = newUnit(1, 'tank', 'P');
    u.advancedClassId = 'paladin';
    const setup = resolveUnit(u, content);
    expect(setup).toMatchObject({ classId: 'paladin', ability: { id: 'smite' }, stats: { def: 4 } });
  });

  it('aggregates traits: lifesteal, cooldown changes (min 1)', () => {
    const u = newUnit(1, 'tank', 'B');
    u.advancedClassId = 'paladin';
    u.talents = ['quick'];
    expect(resolveUnit(u, content).ability.cooldown).toBe(3);
    u.advancedClassId = 'brute';
    expect(resolveUnit(u, content).lifesteal).toBeCloseTo(0.2);
    expect(resolveUnit(u, content).abilityPower).toBeUndefined();
  });
});

describe('synergies', () => {
  const board = (...classes: string[]) => {
    const b = emptyBoard();
    classes.forEach((c, i) => {
      if (i < 3) b.front[i] = newUnit(i + 1, c, c);
      else b.back[i - 3] = newUnit(i + 1, c, c);
    });
    return b;
  };

  it('activates the highest met tier', () => {
    expect(activeSynergies(boardUnits(board('tank')), content)).toEqual([]);
    const two = activeSynergies(boardUnits(board('tank', 'tank')), content);
    expect(two.map((a) => [a.synergy.id, a.tier])).toEqual([['guards', 0]]);
    const three = activeSynergies(boardUnits(board('tank', 'tank', 'tank', 'archer')), content);
    expect(three.map((a) => [a.synergy.id, a.tier])).toEqual([
      ['guards', 1],
      ['mixed', 0],
    ]);
  });

  it('applies tag-scoped bonuses to tagged units and party-wide bonuses to all', () => {
    const party = resolveBoard(board('tank', 'tank', 'archer'), content);
    expect(party.front[0]?.stats).toMatchObject({ def: 3, hp: 34 });
    expect(party.front[2]?.stats).toMatchObject({ def: 0, hp: 24 });
  });

  it('advanced classes change tags', () => {
    const u = newUnit(1, 'tank', 'P');
    expect(unitTags(u, content)).toEqual(['guard']);
    u.advancedClassId = 'paladin';
    expect(unitTags(u, content)).toEqual(['guard', 'holy']);
  });
});

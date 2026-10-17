import { describe, expect, it } from 'vitest';
import { autoPlaceSlot, boardToParty, emptyBoard, instantiate, isValidSlot, unitCount } from './board.ts';
import { TEMPLATES, makeCtx } from './test-fixtures.ts';

describe('board', () => {
  it('validates slots', () => {
    expect(isValidSlot({ row: 'front', col: 2 })).toBe(true);
    expect(isValidSlot({ row: 'front', col: 3 })).toBe(false);
    expect(isValidSlot({ row: 'back', col: 2 })).toBe(false);
    expect(isValidSlot({ row: 'back', col: -1 })).toBe(false);
    expect(isValidSlot({ row: 'back', col: 0.5 })).toBe(false);
  });

  it('auto-places frontliners forward and backliners back', () => {
    const b = emptyBoard();
    expect(autoPlaceSlot(b, TEMPLATES.tank)).toEqual({ row: 'front', col: 0 });
    expect(autoPlaceSlot(b, TEMPLATES.archer)).toEqual({ row: 'back', col: 0 });
  });

  it('overflows to the other row, and returns null when full', () => {
    const b = emptyBoard();
    const u = { uid: 1, classId: 'archer', name: 'x' };
    b.back = [u, u];
    expect(autoPlaceSlot(b, TEMPLATES.archer)).toEqual({ row: 'front', col: 0 });
    b.front = [u, u, u];
    expect(unitCount(b)).toBe(5);
    expect(autoPlaceSlot(b, TEMPLATES.archer)).toBeNull();
  });

  it('instantiates templates with multipliers, then flat bonuses', () => {
    const u = instantiate(TEMPLATES.tank, { name: 'Bo', statMultiplier: { hp: 1.5 }, statBonus: { hp: 1, atk: 2 } });
    expect(u).toMatchObject({ name: 'Bo', classId: 'tank', range: 'melee', stats: { hp: 46, atk: 7, def: 2, spd: 10 } });
  });

  it('converts a board to a combat party, keeping positions and names', () => {
    const b = emptyBoard();
    b.back[1] = { uid: 7, classId: 'archer', name: 'Cy' };
    const party = boardToParty(b, makeCtx().content);
    expect(party.front).toEqual([null, null, null]);
    expect(party.back[1]).toMatchObject({ name: 'Cy', classId: 'archer' });
  });

  it('throws on unknown class ids', () => {
    const b = emptyBoard();
    b.front[0] = { uid: 1, classId: 'nope', name: 'x' };
    expect(() => boardToParty(b, makeCtx().content)).toThrow(/Unknown class/);
  });
});

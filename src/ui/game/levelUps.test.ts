import { describe, expect, it } from 'vitest';
import { emptyBoard, newUnit } from '../../engine/run/index.ts';
import { levelUps, mergeLevelUps } from './levelUps.ts';

function boards() {
  const before = emptyBoard();
  before.front[0] = newUnit(1, 'warrior', 'Wren');
  before.back[0] = newUnit(2, 'mage', 'Mira');
  const after = structuredClone(before);
  after.front[0] = { ...after.front[0]!, level: 3, growth: { hp: 8, atk: 1, def: 1, spd: 0 } };
  return { before, after };
}

describe('level-ups', () => {
  it('reports units that gained levels with the stats they rolled', () => {
    const { before, after } = boards();
    expect(levelUps(before, after)).toEqual([{ uid: 1, name: 'Wren', from: 1, to: 3, gained: { hp: 8, atk: 1, def: 1, spd: 0 } }]);
  });

  it('ignores moved, new and unchanged units', () => {
    const { before, after } = boards();
    after.back[1] = after.front[0]!;
    after.front[0] = newUnit(3, 'rogue', 'Ash');
    expect(levelUps(before, after).map((l) => l.uid)).toEqual([1]);
    expect(levelUps(after, after)).toEqual([]);
  });

  it('keeps only the latest level-up per unit when merging', () => {
    const a = { uid: 1, name: 'Wren', from: 1, to: 2, gained: { hp: 4, atk: 0, def: 0, spd: 0 } };
    const b = { uid: 2, name: 'Mira', from: 1, to: 2, gained: { hp: 2, atk: 1, def: 0, spd: 0 } };
    const a2 = { ...a, from: 2, to: 3 };
    expect(mergeLevelUps([a, b], [a2])).toEqual([b, a2]);
  });
});

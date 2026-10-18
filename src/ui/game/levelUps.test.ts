import { describe, expect, it } from 'vitest';
import { RUN_CONFIG } from '../../data/economy.ts';
import { emptyBoard, newUnit } from '../../engine/run/index.ts';
import { levelUps, mergeLevelUps } from './levelUps.ts';

const cfg = RUN_CONFIG.progression;

function boards() {
  const before = emptyBoard();
  before.front[0] = newUnit(1, 'warrior', 'Wren');
  before.back[0] = newUnit(2, 'mage', 'Mira');
  const after = structuredClone(before);
  after.front[0] = { ...after.front[0]!, level: 3 };
  return { before, after };
}

describe('level-ups', () => {
  it('reports units that gained levels with the stat points those levels grant', () => {
    const { before, after } = boards();
    expect(levelUps(before, after, cfg)).toEqual([{ uid: 1, name: 'Wren', from: 1, to: 3, points: cfg.statPointsByLevel[1]! + cfg.statPointsByLevel[2]! }]);
  });

  it('ignores moved, new and unchanged units', () => {
    const { before, after } = boards();
    after.back[1] = after.front[0]!;
    after.front[0] = newUnit(3, 'rogue', 'Ash');
    expect(levelUps(before, after, cfg).map((l) => l.uid)).toEqual([1]);
    expect(levelUps(after, after, cfg)).toEqual([]);
  });

  it('keeps only the latest level-up per unit when merging', () => {
    const a = { uid: 1, name: 'Wren', from: 1, to: 2, points: 3 };
    const b = { uid: 2, name: 'Mira', from: 1, to: 2, points: 3 };
    const a2 = { ...a, from: 2, to: 3, points: 5 };
    expect(mergeLevelUps([a, b], [a2])).toEqual([b, a2]);
  });
});

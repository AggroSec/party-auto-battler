import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import { createRun, newUnit, type RunState } from '../../engine/run/index.ts';
import { decodeTarget, dropAction, encodeTarget, type DropTarget } from './dropRules.ts';

const ctx = buildRunContext();
const front0 = { row: 'front', col: 0 } as const;
const back1 = { row: 'back', col: 1 } as const;

function state(): RunState {
  const s = createRun('drops', ctx);
  s.board.front[0] = { ...newUnit(1, 'warrior', 'W'), items: ['iron-sword'] };
  s.shop = [
    { kind: 'unit', classId: 'mage', name: 'M', cost: 3 },
    { kind: 'item', itemId: 'iron-sword', cost: 3 },
    { kind: 'training', classId: 'warrior', xp: 2, cost: 3 },
    null,
  ];
  return s;
}

const slot = (s: typeof front0 | typeof back1): DropTarget => ({ kind: 'slot', slot: s });

describe('drop rules', () => {
  it('recruits a unit into an empty slot only', () => {
    expect(dropAction({ kind: 'offer', index: 0 }, slot(back1), state())).toEqual({ type: 'buy', offer: 0, to: back1 });
    expect(dropAction({ kind: 'offer', index: 0 }, slot(front0), state())).toBeNull();
    expect(dropAction({ kind: 'offer', index: 0 }, { kind: 'sell' }, state())).toBeNull();
  });

  it('gives items and training to the unit they are dropped on', () => {
    expect(dropAction({ kind: 'offer', index: 1 }, slot(front0), state())).toEqual({ type: 'buy', offer: 1, to: front0 });
    expect(dropAction({ kind: 'offer', index: 2 }, slot(front0), state())).toEqual({ type: 'buy', offer: 2, to: front0 });
    expect(dropAction({ kind: 'offer', index: 1 }, slot(back1), state())).toBeNull();
    expect(dropAction({ kind: 'offer', index: 3 }, slot(front0), state())).toBeNull();
  });

  it('moves or swaps units, and sells them on the sell zone', () => {
    expect(dropAction({ kind: 'unit', slot: front0 }, slot(back1), state())).toEqual({ type: 'move', from: front0, to: back1 });
    expect(dropAction({ kind: 'unit', slot: front0 }, slot(front0), state())).toBeNull();
    expect(dropAction({ kind: 'unit', slot: front0 }, { kind: 'sell' }, state())).toEqual({ type: 'sell', from: front0 });
  });

  it('moves items between units and sells them', () => {
    const s = state();
    s.board.back[1] = newUnit(2, 'mage', 'M');
    const item = { kind: 'item', slot: front0, index: 0 } as const;
    expect(dropAction(item, slot(back1), s)).toEqual({ type: 'moveItem', from: front0, item: 0, to: back1 });
    expect(dropAction(item, slot(front0), s)).toBeNull();
    expect(dropAction(item, { kind: 'sell' }, s)).toEqual({ type: 'sellItem', from: front0, item: 0 });
  });

  it('round-trips drop targets through their DOM encoding', () => {
    for (const t of [slot(front0), slot(back1), { kind: 'sell' } as const]) expect(decodeTarget(encodeTarget(t))).toEqual(t);
    expect(decodeTarget('nope')).toBeNull();
  });
});

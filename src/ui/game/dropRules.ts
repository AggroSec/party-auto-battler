import { getSlot, type RunState, type ShopAction, type SlotRef } from '../../engine/run/index.ts';

/** Things that can be dragged. */
export type DragSource =
  | { kind: 'offer'; index: number }
  | { kind: 'unit'; slot: SlotRef }
  | { kind: 'item'; slot: SlotRef; index: number };

/** Places they can be dropped. */
export type DropTarget = { kind: 'slot'; slot: SlotRef } | { kind: 'sell' };

const same = (a: SlotRef, b: SlotRef) => a.row === b.row && a.col === b.col;

/**
 * The shop action a drop means, or null if the drop isn't meaningful.
 * The engine still validates it (gold, item slots, training class...).
 */
export function dropAction(source: DragSource, target: DropTarget, run: RunState): ShopAction | null {
  const occupant = target.kind === 'slot' ? getSlot(run.board, target.slot) : undefined;
  switch (source.kind) {
    case 'offer': {
      const offer = run.shop[source.index];
      if (!offer || target.kind !== 'slot') return null;
      if (offer.kind === 'unit') return occupant ? null : { type: 'buy', offer: source.index, to: target.slot };
      return occupant ? { type: 'buy', offer: source.index, to: target.slot } : null;
    }
    case 'unit':
      if (target.kind === 'sell') return { type: 'sell', from: source.slot };
      return same(source.slot, target.slot) ? null : { type: 'move', from: source.slot, to: target.slot };
    case 'item':
      if (target.kind === 'sell') return { type: 'sellItem', from: source.slot, item: source.index };
      if (!occupant || same(source.slot, target.slot)) return null;
      return { type: 'moveItem', from: source.slot, item: source.index, to: target.slot };
  }
}

export const encodeTarget = (t: DropTarget) => (t.kind === 'sell' ? 'sell' : `${t.slot.row}:${t.slot.col}`);

export function decodeTarget(s: string | undefined | null): DropTarget | null {
  if (s === 'sell') return { kind: 'sell' };
  const m = /^(front|back):(\d)$/.exec(s ?? '');
  return m ? { kind: 'slot', slot: { row: m[1] as 'front' | 'back', col: Number(m[2]) } } : null;
}

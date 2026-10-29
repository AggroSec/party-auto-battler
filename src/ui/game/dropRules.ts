import { getSlot, type RunState, type ShopAction, type SlotRef } from '../../engine/run/index.ts';

/** Things that can be dragged. */
export type DragSource =
  | { kind: 'offer'; index: number }
  | { kind: 'unit'; slot: SlotRef }
  | { kind: 'item'; slot: SlotRef; index: number };

/**
 * Places they can be dropped. There is no sell zone: on phones a scroll that
 * started on a unit could drop it there, so selling is a button in the inspector.
 */
export type DropTarget = { kind: 'slot'; slot: SlotRef };

const same = (a: SlotRef, b: SlotRef) => a.row === b.row && a.col === b.col;

/**
 * The shop action a drop means, or null if the drop isn't meaningful.
 * The engine still validates it (gold, item slots, training class...).
 */
export function dropAction(source: DragSource, target: DropTarget, run: RunState): ShopAction | null {
  const occupant = getSlot(run.board, target.slot);
  switch (source.kind) {
    case 'offer': {
      const offer = run.shop[source.index];
      if (!offer) return null;
      if (offer.kind === 'unit') return occupant ? null : { type: 'buy', offer: source.index, to: target.slot };
      return occupant ? { type: 'buy', offer: source.index, to: target.slot } : null;
    }
    case 'unit':
      return same(source.slot, target.slot) ? null : { type: 'move', from: source.slot, to: target.slot };
    case 'item':
      if (!occupant || same(source.slot, target.slot)) return null;
      return { type: 'moveItem', from: source.slot, item: source.index, to: target.slot };
  }
}

export const encodeTarget = (t: DropTarget) => `${t.slot.row}:${t.slot.col}`;

export function decodeTarget(s: string | undefined | null): DropTarget | null {
  const m = /^(front|back):(\d)$/.exec(s ?? '');
  return m ? { kind: 'slot', slot: { row: m[1] as 'front' | 'back', col: Number(m[2]) } } : null;
}

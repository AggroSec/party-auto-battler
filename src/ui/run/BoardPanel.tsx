import type { Board, OwnedUnit, RunContent, SlotRef } from '../../engine/run/index.ts';
import { className } from './names.ts';

export const sameSlot = (a: SlotRef | null, b: SlotRef) => a?.row === b.row && a.col === b.col;

/** The party board: back slots sit between the front lanes, matching targeting. */
export function BoardPanel({
  board,
  content,
  selected,
  hint,
  onSlotClick,
}: {
  board: Board;
  content: RunContent;
  selected: SlotRef | null;
  hint: string;
  onSlotClick: (slot: SlotRef, unit: OwnedUnit | null) => void;
}) {
  return (
    <>
      <p className="muted">{hint}</p>
      <div className="board">
        {(['front', 'back'] as const).map((row) => [
          <span key={`${row}-label`} className="board-label muted">
            {row === 'front' ? 'Front' : 'Back'}
          </span>,
          ...board[row].map((unit, col) => (
            <button
              key={`${row}${col}`}
              className={`slot ${row}-${col} ${unit ? '' : 'empty'} ${sameSlot(selected, { row, col }) ? 'selected' : ''}`}
              onClick={() => onSlotClick({ row, col }, unit)}
            >
              {unit ? (
                <>
                  <strong>{unit.name}</strong>
                  <span className="muted">
                    Lv {unit.level} {className(content, unit.advancedClassId ?? unit.classId)}
                  </span>
                  {unit.items.length > 0 && <span className="muted">{'🎒'.repeat(unit.items.length)}</span>}
                </>
              ) : (
                <span className="muted">empty</span>
              )}
            </button>
          )),
        ])}
      </div>
    </>
  );
}

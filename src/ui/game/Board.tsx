import type { Party } from '../../engine/index.ts';
import type { OwnedUnit, RunContext, RunState, SlotRef } from '../../engine/run/index.ts';
import { useDraggable, useDropTarget } from './drag.tsx';
import { UnitCard } from './UnitCard.tsx';

const same = (a: SlotRef | null, b: SlotRef) => a?.row === b.row && a.col === b.col;

function Slot({
  slot,
  unit,
  run,
  party,
  ctx,
  selected,
  onSelect,
}: {
  slot: SlotRef;
  unit: OwnedUnit | null;
  run: RunState;
  party: Party;
  ctx: RunContext;
  selected: SlotRef | null;
  onSelect: (slot: SlotRef | null) => void;
}) {
  const drop = useDropTarget({ kind: 'slot', slot });
  const setup = party[slot.row][slot.col] ?? null;
  const backlineMelee = slot.row === 'back' && !!setup && setup.range === 'melee' && !setup.reach && party.front.some(Boolean);
  const card = unit ? (
    <UnitCard
      unit={unit}
      setup={setup}
      ctx={ctx}
      pendingChoice={run.pending.some((p) => p.uid === unit.uid)}
      backlineMelee={backlineMelee}
    />
  ) : null;
  const drag = useDraggable({ kind: 'unit', slot }, card, () => onSelect(unit && !same(selected, slot) ? slot : null));
  const cls = [
    'slot',
    `${slot.row}-${slot.col}`,
    unit ? 'filled' : 'empty',
    same(selected, slot) ? 'selected' : '',
    drop.accepts ? 'can-drop' : '',
    drop.over ? 'drop-over' : '',
    drag.dragging ? 'is-dragging' : '',
  ].join(' ');
  if (!unit) {
    return (
      <div className={cls} {...drop.props} onClick={() => onSelect(null)}>
        <span className="slot-empty">{slot.row === 'front' ? 'Front' : 'Back'}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      className={`${cls} draggable`}
      {...drop.props}
      {...drag.props}
      aria-pressed={same(selected, slot)}
      aria-label={`${unit.name}, ${slot.row} row slot ${slot.col + 1}`}
    >
      {card}
    </button>
  );
}

/**
 * The party board. Front row (3) faces the enemy; the back row's two slots
 * sit between the front lanes, matching how targeting measures distance.
 */
export function Board({
  run,
  party,
  ctx,
  selected,
  onSelect,
}: {
  run: RunState;
  party: Party;
  ctx: RunContext;
  selected: SlotRef | null;
  onSelect: (slot: SlotRef | null) => void;
}) {
  return (
    <div className="board-grid">
      {(['front', 'back'] as const).map((row) =>
        run.board[row].map((unit, col) => (
          <Slot
            key={`${row}${col}`}
            slot={{ row, col }}
            unit={unit}
            run={run}
            party={party}
            ctx={ctx}
            selected={selected}
            onSelect={onSelect}
          />
        )),
      )}
    </div>
  );
}

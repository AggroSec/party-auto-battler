import type { UnitSetup } from '../../engine/index.ts';
import { classTiers, effectiveClassId, maxLevel, tertiaryItemFor, unitTags, type Board, type OwnedUnit, type RunContext, type SlotRef, type StatPoints } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { useDraggable } from './drag.tsx';
import { Icon } from './Icon.tsx';
import { className, spentSummary } from './names.ts';
import { Rules } from './Rules.tsx';
import { StatPanel } from './StatPanel.tsx';
import { UnitKit } from './UnitKit.tsx';

function ItemRow({
  unit,
  slot,
  index,
  ctx,
  moving,
  onMove,
  onSell,
}: {
  unit: OwnedUnit;
  slot: SlotRef;
  index: number;
  ctx: RunContext;
  moving: boolean;
  onMove: () => void;
  onSell: () => void;
}) {
  const id = unit.items[index]!;
  const item = ctx.content.items[id];
  const bonus = item?.classBonus?.classIds.some((c) => c === unit.classId || c === unit.advancedClassId);
  const chip = <span className={`item-chip${item?.tertiaryClassId ? ' signature' : ''}`}><Icon id={item?.tertiaryClassId ? 'signature' : 'item'} /> {item?.name ?? id}</span>;
  const drag = useDraggable({ kind: 'item', slot, index }, chip);
  return (
    <li className={`item-row ${drag.dragging ? 'is-dragging' : ''}`}>
      <span className="draggable" {...drag.props} title="Drag to another unit">
        {chip}
      </span>
      <span className="item-desc">
        <Rules text={item?.description ?? ''} />
        {bonus && (
          <span className="bonus">
            {' '}
            <Rules text={item?.classBonus?.description ?? ''} />
          </span>
        )}
      </span>
      <span className="item-actions">
        <button type="button" className={moving ? 'active' : ''} onClick={onMove}>
          {moving ? 'Cancel' : 'Move'}
        </button>
        <button type="button" onClick={onSell}>
          Sell +{ctx.config.progression.itemSellRefund}g
        </button>
      </span>
    </li>
  );
}

/** Full build of the selected unit: final stats, ability, talents and items. */
export function Inspector({
  unit,
  slot,
  setup,
  board,
  ctx,
  movingItem,
  movingUnit,
  onMoveItem,
  onSellItem,
  onMoveUnit,
  onSell,
  onAllocate,
  onClose,
}: {
  unit: OwnedUnit;
  slot: SlotRef;
  setup: UnitSetup | null;
  board: Board;
  ctx: RunContext;
  movingItem: number | null;
  movingUnit: boolean;
  onMoveItem: (index: number | null) => void;
  onSellItem: (index: number) => void;
  onMoveUnit: () => void;
  onSell: () => void;
  onAllocate: (points: StatPoints) => void;
  onClose: () => void;
}) {
  const { content, config } = ctx;
  const prog = config.progression;
  const next = unit.level < maxLevel(prog) ? prog.xpForLevel[unit.level] : undefined;
  const base = content.classes[unit.classId];
  const { adv, tert } = classTiers(unit, content);
  const style = classStyle(content, unit.classId);
  const lineage = [base?.name, tert && adv?.name].filter(Boolean).join(' → ');
  const signatureId = tert ? tertiaryItemFor(tert.id, ctx) : undefined;
  const signature = signatureId ? content.items[signatureId] : undefined;
  return (
    <section className="inspector" style={{ '--class-color': style.color } as React.CSSProperties} aria-label={`${unit.name} details`}>
      <header className="inspector-head">
        <span className="avatar" aria-hidden>
          <Icon id={style.icon} />
        </span>
        <div>
          <h3>{unit.name}</h3>
          <span className="muted">
            Lv {unit.level} {className(content, effectiveClassId(unit))}
            {adv && ` (${lineage})`} · {base?.range} · {unitTags(unit, content).join(', ')}
          </span>
        </div>
        <button type="button" className="close" onClick={onClose} aria-label="Close details">
          ✕
        </button>
      </header>
      <p className="muted">
        XP {unit.xp}
        {next !== undefined ? ` / ${next} for level ${unit.level + 1}` : ' (max level: no more XP)'}
        {spentSummary(unit, ctx) && ` · Points: ${spentSummary(unit, ctx)}`}
      </p>
      {unit.statPoints > 0 && <StatPanel key={`${unit.uid}:${unit.statPoints}`} unit={unit} ctx={ctx} onConfirm={onAllocate} />}
      {(tert ?? adv) && <p className="muted">{(tert ?? adv)!.description}</p>}
      {setup && <UnitKit unit={unit} setup={setup} board={board} ctx={ctx} />}
      {unit.talents.length > 0 && (
        <ul className="talent-list">
          {unit.talents.map((id) => (
            <li key={id}>
              <strong>{content.talents[id]?.name ?? id}</strong>: <Rules text={content.talents[id]?.description ?? ''} />
            </li>
          ))}
        </ul>
      )}
      <ul className="item-list">
        {unit.items.map((_, i) => (
          <ItemRow
            key={`${unit.items[i]}${i}`}
            unit={unit}
            slot={slot}
            index={i}
            ctx={ctx}
            moving={movingItem === i}
            onMove={() => onMoveItem(movingItem === i ? null : i)}
            onSell={() => onSellItem(i)}
          />
        ))}
        {unit.items.length < prog.maxItemsPerUnit && (
          <li className="muted">{prog.maxItemsPerUnit - unit.items.length} free item slot(s)</li>
        )}
      </ul>
      {signature && !unit.items.includes(signature.id) && (
        <p className="signature-hint muted small">
          <Icon id="signature" /> Signature item: <strong>{signature.name}</strong> ({signature.cost}g) can show up in the shop while {tert?.name} is in your party.{' '}
          <Rules text={signature.description} />
        </p>
      )}
      <div className="inspector-actions">
        <button type="button" className={movingUnit ? 'active' : ''} onClick={onMoveUnit}>
          {movingUnit ? 'Cancel move' : 'Move'}
        </button>
        <button type="button" className="danger" onClick={onSell}>
          Sell (+{config.sellRefund + unit.items.length * prog.itemSellRefund}g)
        </button>
      </div>
    </section>
  );
}

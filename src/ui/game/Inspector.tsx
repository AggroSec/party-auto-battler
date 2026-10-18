import type { UnitSetup } from '../../engine/index.ts';
import { maxLevel, type OwnedUnit, type RunContext, type SlotRef } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { useDraggable } from './drag.tsx';
import { className } from './names.ts';

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
  const chip = <span className="item-chip">🎒 {item?.name ?? id}</span>;
  const drag = useDraggable({ kind: 'item', slot, index }, chip);
  return (
    <li className={`item-row ${drag.dragging ? 'is-dragging' : ''}`}>
      <span className="draggable" {...drag.props} title="Drag to another unit, or to the sell zone">
        {chip}
      </span>
      <span className="item-desc">
        {item?.description}
        {bonus && <span className="bonus"> {item?.classBonus?.description}</span>}
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
  ctx,
  movingItem,
  movingUnit,
  onMoveItem,
  onSellItem,
  onMoveUnit,
  onSell,
  onClose,
}: {
  unit: OwnedUnit;
  slot: SlotRef;
  setup: UnitSetup | null;
  ctx: RunContext;
  movingItem: number | null;
  movingUnit: boolean;
  onMoveItem: (index: number | null) => void;
  onSellItem: (index: number) => void;
  onMoveUnit: () => void;
  onSell: () => void;
  onClose: () => void;
}) {
  const { content, config } = ctx;
  const prog = config.progression;
  const next = unit.level < maxLevel(prog) ? prog.xpForLevel[unit.level] : undefined;
  const base = content.classes[unit.classId];
  const adv = unit.advancedClassId ? content.advancedClasses[unit.advancedClassId] : undefined;
  const style = classStyle(content, unit.classId);
  return (
    <section className="inspector" style={{ '--class-color': style.color } as React.CSSProperties} aria-label={`${unit.name} details`}>
      <header className="inspector-head">
        <span className="avatar" aria-hidden>
          {style.glyph}
        </span>
        <div>
          <h3>{unit.name}</h3>
          <span className="muted">
            Lv {unit.level} {className(content, unit.advancedClassId ?? unit.classId)}
            {adv && ` (${base?.name})`} · {base?.range} · {(adv?.tags ?? base?.tags)?.join(', ')}
          </span>
        </div>
        <button type="button" className="close" onClick={onClose} aria-label="Close details">
          ✕
        </button>
      </header>
      <p className="muted">XP {unit.xp}{next !== undefined ? ` / ${next} for level ${unit.level + 1}` : ' (max level)'}</p>
      {setup && (
        <p className="stats-line">
          ❤️ {setup.stats.hp} ⚔️ {setup.stats.atk} 🛡️ {setup.stats.def} 💨 {setup.stats.spd}
          {setup.abilityPower && setup.abilityPower !== 1 ? ` · ✨${Math.round(setup.abilityPower * 100)}% AP` : ''}
          {setup.lifesteal ? ` · 🩸${Math.round(setup.lifesteal * 100)}% lifesteal` : ''}
          {setup.reach ? ' · 🏹 reach' : ''}
        </p>
      )}
      {setup && (
        <p>
          <strong>{setup.ability.name}</strong> <span className="muted">(every {setup.ability.cooldown} turns)</span>: {setup.ability.description}
        </p>
      )}
      {adv && <p className="muted">{adv.description}</p>}
      {unit.talents.length > 0 && (
        <ul className="talent-list">
          {unit.talents.map((id) => (
            <li key={id}>
              <strong>{content.talents[id]?.name ?? id}</strong>: {content.talents[id]?.description}
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

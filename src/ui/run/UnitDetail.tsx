import type { UnitSetup } from '../../engine/index.ts';
import { maxLevel, type OwnedUnit, type RunContext } from '../../engine/run/index.ts';
import { className } from './names.ts';

/** Full build of the selected unit: level, final stats, ability, talents, items. */
export function UnitDetail({
  unit,
  setup,
  ctx,
  movingItem,
  onMoveItem,
  onSellItem,
  onSell,
}: {
  unit: OwnedUnit;
  /** The unit resolved with its build and current synergies. */
  setup: UnitSetup | null;
  ctx: RunContext;
  movingItem: number | null;
  onMoveItem: (index: number | null) => void;
  onSellItem: (index: number) => void;
  onSell: () => void;
}) {
  const { content, config } = ctx;
  const prog = config.progression;
  const next = unit.level < maxLevel(prog) ? prog.xpForLevel[unit.level] : undefined;
  const base = content.classes[unit.classId];
  return (
    <section className="detail">
      <h3>
        {unit.name} · Lv {unit.level} {className(content, unit.advancedClassId ?? unit.classId)}
        {unit.advancedClassId && <span className="muted"> ({base?.name})</span>}
      </h3>
      <p className="muted">
        XP {unit.xp}
        {next !== undefined ? ` / ${next} to level ${unit.level + 1}` : ' (max level)'} · {base?.range} · tags:{' '}
        {(unit.advancedClassId ? content.advancedClasses[unit.advancedClassId]?.tags : base?.tags)?.join(', ')}
      </p>
      {setup && (
        <p className="stats">
          ❤️ {setup.stats.hp} ⚔️ {setup.stats.atk} 🛡️ {setup.stats.def} 💨 {setup.stats.spd}
          {setup.abilityPower && setup.abilityPower !== 1 ? ` · ✨ ${Math.round(setup.abilityPower * 100)}% AP` : ''}
          {setup.lifesteal ? ` · 🩸 ${Math.round(setup.lifesteal * 100)}% lifesteal` : ''}
          {setup.reach ? ' · 🏹 reach' : ''}
        </p>
      )}
      {setup && (
        <p>
          <strong>{setup.ability.name}</strong> <span className="muted">(every {setup.ability.cooldown} turns)</span>:{' '}
          {setup.ability.description}
        </p>
      )}
      {unit.talents.length > 0 && (
        <ul className="talents">
          {unit.talents.map((id) => (
            <li key={id}>
              <strong>{content.talents[id]?.name ?? id}</strong>: {content.talents[id]?.description}
            </li>
          ))}
        </ul>
      )}
      <ul className="items">
        {unit.items.map((id, i) => {
          const item = content.items[id];
          const bonus = item?.classBonus?.classIds.some((c) => c === unit.classId || c === unit.advancedClassId);
          return (
            <li key={`${id}${i}`}>
              🎒 <strong>{item?.name ?? id}</strong>: {item?.description}
              {bonus && <span className="bonus"> {item?.classBonus?.description}</span>}{' '}
              <button onClick={() => onMoveItem(movingItem === i ? null : i)}>{movingItem === i ? 'Cancel move' : 'Move'}</button>{' '}
              <button onClick={() => onSellItem(i)}>Sell (+{prog.itemSellRefund}g)</button>
            </li>
          );
        })}
        {unit.items.length < prog.maxItemsPerUnit && (
          <li className="muted">{prog.maxItemsPerUnit - unit.items.length} free item slot(s)</li>
        )}
      </ul>
      <button onClick={onSell}>
        Sell (+{config.sellRefund + unit.items.length * prog.itemSellRefund}g)
      </button>
    </section>
  );
}

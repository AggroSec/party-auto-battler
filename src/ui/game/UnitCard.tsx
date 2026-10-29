import type { UnitSetup } from '../../engine/index.ts';
import { effectiveClassId, maxLevel, type OwnedUnit, type RunContext } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { Icon, StatLine } from './Icon.tsx';
import { className } from './names.ts';

/** Compact card for a unit on the shop board. */
export function UnitCard({
  unit,
  setup,
  ctx,
  pendingChoice,
  backlineMelee,
}: {
  unit: OwnedUnit;
  /** Resolved stats (with items and synergies). */
  setup: UnitSetup | null;
  ctx: RunContext;
  pendingChoice: boolean;
  /** Melee in the back row without reach (deals reduced damage). */
  backlineMelee: boolean;
}) {
  const { content, config } = ctx;
  const style = classStyle(content, unit.classId);
  const prog = config.progression;
  const atMax = unit.level >= maxLevel(prog);
  const lo = prog.xpForLevel[unit.level - 1] ?? 0;
  const hi = prog.xpForLevel[unit.level] ?? lo;
  const xpPct = atMax ? 100 : Math.round(((unit.xp - lo) / Math.max(1, hi - lo)) * 100);
  return (
    <div className="unit-card" style={{ '--class-color': style.color } as React.CSSProperties}>
      <div className="avatar" aria-hidden>
        <Icon id={style.icon} />
      </div>
      <div className="unit-text">
        <strong className="unit-name">{unit.name}</strong>
        <span className="unit-class">
          Lv {unit.level} {className(content, effectiveClassId(unit))}
        </span>
        {setup && (
          <StatLine stats={setup.stats} className="unit-stats" />
        )}
      </div>
      <div className="xp-bar" title={atMax ? 'Max level' : `XP ${unit.xp} / ${hi}`}>
        <span style={{ width: `${xpPct}%` }} />
      </div>
      <div className="badges">
        {unit.items.map((id, i) => (
          <span key={i} className="badge item-pip" title={content.items[id]?.name}>
            <Icon id={content.items[id]?.tertiaryClassId ? 'signature' : 'item'} />
          </span>
        ))}
        {unit.statPoints > 0 && (
          <span className="badge points" title={`${unit.statPoints} stat points to spend (click the unit)`}>
            +{unit.statPoints}
          </span>
        )}
        {pendingChoice && (
          <span className="badge star" title="Level-up choice waiting">
            ⭐
          </span>
        )}
        {backlineMelee && (
          <span className="badge warn" title="Melee in the back row: 50% damage while your front row stands">
            ⚠️
          </span>
        )}
      </div>
    </div>
  );
}

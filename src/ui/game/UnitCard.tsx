import type { UnitSetup } from '../../engine/index.ts';
import { maxLevel, type OwnedUnit, type RunContext } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
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
        {style.glyph}
      </div>
      <div className="unit-text">
        <strong className="unit-name">{unit.name}</strong>
        <span className="unit-class">
          Lv {unit.level} {className(content, unit.advancedClassId ?? unit.classId)}
        </span>
        {setup && (
          <span className="unit-stats" aria-label="HP, attack, defence, speed">
            ❤️{setup.stats.hp} ⚔️{setup.stats.atk} 🛡️{setup.stats.def} 💨{setup.stats.spd}
          </span>
        )}
      </div>
      <div className="xp-bar" title={atMax ? 'Max level' : `XP ${unit.xp} / ${hi}`}>
        <span style={{ width: `${xpPct}%` }} />
      </div>
      <div className="badges">
        {unit.items.map((id, i) => (
          <span key={i} className="badge item-pip" title={content.items[id]?.name}>
            🎒
          </span>
        ))}
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

import { ICONS, type IconId } from '../../assets/icons.ts';
import type { StatKey } from '../../engine/types.ts';

const STAT_LABEL: Record<StatKey, string> = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD' };

/**
 * A game-icons.net icon, drawn in the current text colour at 1em. Decorative
 * unless given a label.
 */
export function Icon({ id, label, className }: { id: IconId | null; label?: string; className?: string }) {
  const cls = `icon${className ? ` ${className}` : ''}`;
  if (!id) return <span className={`${cls} icon-unknown`} aria-hidden>?</span>;
  return (
    <svg className={cls} viewBox="0 0 512 512" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={ICONS[id].d} fill="currentColor" />
    </svg>
  );
}

/** A stat's icon, labelled with its short name for screen readers. */
export function StatIcon({ stat }: { stat: StatKey }) {
  return <Icon id={stat} label={STAT_LABEL[stat]} className={`stat-icon stat-${stat}`} />;
}

/** All four stats as icon + value, e.g. on a unit card. */
export function StatLine({ stats, className }: { stats: Record<StatKey, number>; className?: string }) {
  return (
    <span className={`stat-row${className ? ` ${className}` : ''}`}>
      {(['hp', 'atk', 'def', 'spd'] as const).map((k) => (
        <span key={k} className="stat-line">
          <StatIcon stat={k} />
          {stats[k]}
        </span>
      ))}
    </span>
  );
}

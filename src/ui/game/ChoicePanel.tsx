import type { OwnedUnit, PendingChoice, RunContent } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { className } from './names.ts';

const STAT_ICON = { hp: '❤️', atk: '⚔️', def: '🛡️', spd: '💨' } as const;

function statBonus(stats: Partial<Record<keyof typeof STAT_ICON, number>> | undefined): string {
  if (!stats) return '';
  return (Object.keys(STAT_ICON) as (keyof typeof STAT_ICON)[])
    .filter((k) => stats[k])
    .map((k) => `${STAT_ICON[k]}${stats[k]! > 0 ? '+' : ''}${stats[k]}`)
    .join(' ');
}

/** Level-up decision for the first pending choice. */
export function ChoicePanel({
  choice,
  unit,
  remaining,
  content,
  onChoose,
}: {
  choice: PendingChoice;
  unit: OwnedUnit | undefined;
  remaining: number;
  content: RunContent;
  onChoose: (option: number) => void;
}) {
  const who = unit ? `${unit.name} the ${className(content, unit.advancedClassId ?? unit.classId)}` : 'A unit';
  const style = classStyle(content, unit?.classId ?? '');
  return (
    <section className="choice" style={{ '--class-color': style.color } as React.CSSProperties} aria-live="polite">
      <h2>
        <span aria-hidden>⭐ </span>
        {who} reached level {choice.level}: {choice.kind === 'advance' ? 'choose an advanced class' : 'choose a talent'}
        {remaining > 1 && <span className="muted"> ({remaining - 1} more after this)</span>}
      </h2>
      <div className="choice-options">
        {choice.options.map((id, i) => {
          if (choice.kind === 'advance') {
            const adv = content.advancedClasses[id];
            return (
              <button key={id} type="button" className="choice-card" onClick={() => onChoose(i)}>
                <strong className="choice-title">
                  {style.glyph} {adv?.name ?? id}
                </strong>
                <span>{adv?.description}</span>
                <span>
                  <em>{adv?.ability.name}</em>: {adv?.ability.description}
                </span>
                <span className="muted">
                  {statBonus(adv?.modifier.stats)} · {adv?.tags.join(', ')}
                </span>
              </button>
            );
          }
          const t = content.talents[id];
          return (
            <button key={id} type="button" className="choice-card" onClick={() => onChoose(i)}>
              <strong className="choice-title">{t?.name ?? id}</strong>
              <span>{t?.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

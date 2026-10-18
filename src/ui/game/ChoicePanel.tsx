import type { OwnedUnit, PendingChoice, RunContent } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import type { LevelUp } from './levelUps.ts';
import { className } from './names.ts';

const STAT_ICON = { hp: '❤️', atk: '⚔️', def: '🛡️', spd: '💨' } as const;

export function statBonus(stats: Partial<Record<keyof typeof STAT_ICON, number>> | undefined): string {
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
  levelUp,
  content,
  onChoose,
}: {
  choice: PendingChoice;
  unit: OwnedUnit | undefined;
  remaining: number;
  /** The level-up that queued this choice, when known, to show the stats it rolled. */
  levelUp: LevelUp | undefined;
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
      {levelUp && <LevelUpGains levelUp={levelUp} />}
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

/** "Level 2 → 3: ❤️+4 ⚔️+1" with each stat popping in. */
export function LevelUpGains({ levelUp, showName = false }: { levelUp: LevelUp; showName?: boolean }) {
  const stats = (Object.keys(STAT_ICON) as (keyof typeof STAT_ICON)[]).filter((k) => levelUp.gained[k] !== 0);
  return (
    <p className="level-gains">
      {showName && <strong>{levelUp.name} </strong>}
      <span className="muted">
        Lv {levelUp.from} → {levelUp.to}:{' '}
      </span>
      {stats.length === 0 && <span className="muted">no stat gains this time</span>}
      {stats.map((k, i) => (
        <span key={k} className={`gain ${k}`} style={{ animationDelay: `${i * 120}ms` }}>
          {STAT_ICON[k]} +{levelUp.gained[k]} {k.toUpperCase()}
        </span>
      ))}
    </p>
  );
}

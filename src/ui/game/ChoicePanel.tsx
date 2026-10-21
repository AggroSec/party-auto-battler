import { effectiveClassId, type OwnedUnit, type PendingChoice, type RunContent } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import type { LevelUp } from './levelUps.ts';
import { className } from './names.ts';
import { Rules } from './Rules.tsx';

const STAT_ICON = { hp: '❤️', atk: '⚔️', def: '🛡️', spd: '💨' } as const;

export function statBonus(stats: Partial<Record<keyof typeof STAT_ICON, number>> | undefined): string {
  if (!stats) return '';
  return (Object.keys(STAT_ICON) as (keyof typeof STAT_ICON)[])
    .filter((k) => stats[k])
    .map((k) => `${STAT_ICON[k]}${stats[k]! > 0 ? '+' : ''}${stats[k]}`)
    .join(' ');
}

/** Level-up decision for the first pending choice. */
const CHOOSE = { talent: 'choose a talent', advance: 'choose an advanced class', ascend: 'choose a tertiary class' } as const;

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
  const who = unit ? `${unit.name} the ${className(content, effectiveClassId(unit))}` : 'A unit';
  const style = classStyle(content, unit?.classId ?? '');
  return (
    <section className="choice" style={{ '--class-color': style.color } as React.CSSProperties} aria-live="polite">
      <h2>
        <span aria-hidden>⭐ </span>
        {who} reached level {choice.level}: {CHOOSE[choice.kind]}
        {remaining > 1 && <span className="muted"> ({remaining - 1} more after this)</span>}
      </h2>
      {levelUp && <LevelUpGains levelUp={levelUp} />}
      <div className="choice-options">
        {choice.options.map((id, i) => {
          if (choice.kind !== 'talent') {
            const adv = choice.kind === 'advance' ? content.advancedClasses[id] : content.tertiaryClasses[id];
            return (
              <button key={id} type="button" className="choice-card" onClick={() => onChoose(i)}>
                <strong className="choice-title">
                  {style.glyph} {adv?.name ?? id}
                </strong>
                <span>{adv?.description}</span>
                <span>
                  <em>{adv?.ability.name}</em>: <Rules text={adv?.ability.description ?? ''} />
                </span>
                {adv?.passive && (
                  <span>
                    <span className="kit-tag">Passive</span> <em>{adv.passive.name}</em>: <Rules text={adv.passive.description} />
                  </span>
                )}
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
              <span>
                <Rules text={t?.description ?? ''} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** "Lv 2 → 3: ⭐ +5 stat points". */
export function LevelUpGains({ levelUp, showName = false }: { levelUp: LevelUp; showName?: boolean }) {
  return (
    <p className="level-gains">
      {showName && <strong>{levelUp.name} </strong>}
      <span className="muted">
        Lv {levelUp.from} → {levelUp.to}:{' '}
      </span>
      <span className="gain">⭐ +{levelUp.points} stat points</span>
    </p>
  );
}

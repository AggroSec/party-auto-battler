import type { OwnedUnit, PendingChoice, RunContent } from '../../engine/run/index.ts';
import { className } from './names.ts';

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
  return (
    <section className="choice">
      <h2>
        ⭐ {who} reached level {choice.level}: {choice.kind === 'advance' ? 'choose an advanced class' : 'choose a talent'}
        {remaining > 1 && <span className="muted"> ({remaining - 1} more after this)</span>}
      </h2>
      <div className="choice-options">
        {choice.options.map((id, i) => {
          if (choice.kind === 'advance') {
            const adv = content.advancedClasses[id];
            return (
              <button key={id} className="choice-card" onClick={() => onChoose(i)}>
                <strong>{adv?.name ?? id}</strong>
                <span>{adv?.description}</span>
                <span className="muted">
                  {adv?.ability.name}: {adv?.ability.description}
                </span>
                <span className="muted">Tags: {adv?.tags.join(', ')}</span>
              </button>
            );
          }
          const t = content.talents[id];
          return (
            <button key={id} className="choice-card" onClick={() => onChoose(i)}>
              <strong>{t?.name ?? id}</strong>
              <span>{t?.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

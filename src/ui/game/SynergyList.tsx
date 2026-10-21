import type { OwnedUnit, RunContent } from '../../engine/run/index.ts';
import { Rules } from './Rules.tsx';
import { synergyProgress } from './synergyProgress.ts';

/** Active synergies and progress toward the next tier. */
export function SynergyList({ units, content }: { units: OwnedUnit[]; content: RunContent }) {
  const list = synergyProgress(units, content);
  return (
    <section className="synergies" aria-label="Synergies">
      <h3>Synergies</h3>
      {list.length === 0 ? (
        <p className="muted">Pair classes that share a tag (martial, arcane, divine, shadow, guardian, wild).</p>
      ) : (
        <ul>
          {list.map(({ synergy, activeTier, next, current }) => (
            <li key={synergy.id} className={activeTier >= 0 ? 'active' : ''}>
              <strong>{synergy.name}</strong>
              {activeTier >= 0 && synergy.tiers.length > 1 && <span className="tier"> {'◆'.repeat(activeTier + 1)}</span>}
              {current && (
                <span className="syn-desc">
                  <Rules text={current} />
                </span>
              )}
              {next && (
                <span className="syn-next muted">
                  {next.have}/{next.need} {next.label} → <Rules text={next.description} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

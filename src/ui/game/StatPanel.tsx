import { useState } from 'react';
import {
  recommendedAllocation,
  statWeights,
  STATS,
  type OwnedUnit,
  type RunContext,
  type StatPoints,
} from '../../engine/run/index.ts';
import { Icon } from './Icon.tsx';

const LABEL = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD' } as const;
const ZERO: StatPoints = { hp: 0, atk: 0, def: 0, spd: 0 };

/**
 * Spend a unit's stat points. The draft lives here until Confirm; the parent
 * re-keys this panel by unit and point count, so it resets after each spend.
 */
export function StatPanel({ unit, ctx, onConfirm }: { unit: OwnedUnit; ctx: RunContext; onConfirm: (points: StatPoints) => void }) {
  const prog = ctx.config.progression;
  const [draft, setDraft] = useState<StatPoints>(ZERO);
  const used = STATS.reduce((s, k) => s + draft[k], 0);
  const left = unit.statPoints - used;
  const weights = statWeights(unit, ctx.content);
  const maxWeight = Math.max(...STATS.map((k) => weights[k]));
  const bump = (k: keyof StatPoints, d: number) => setDraft((p) => ({ ...p, [k]: Math.max(0, p[k] + d) }));
  return (
    <section className="stat-panel" aria-label="Stat points">
      <header>
        <strong>
          ⭐ {left} stat point{left === 1 ? '' : 's'} to spend
        </strong>
        <button type="button" onClick={() => setDraft(recommendedAllocation(unit, ctx.content, prog))}>
          Recommended
        </button>
      </header>
      <ul>
        {STATS.map((k) => (
          <li key={k}>
            <span className="stat-name">
              <Icon id={k} className={`stat-icon stat-${k}`} /> {LABEL[k]}
            </span>
            <span className="stat-rec" title="Recommended weight for this class" aria-label={`Recommended weight ${weights[k]} of ${maxWeight}`}>
              {Array.from({ length: maxWeight }, (_, i) => (
                <i key={i} className={i < weights[k] ? 'on' : ''} />
              ))}
            </span>
            <span className="stat-step">
              <button type="button" onClick={() => bump(k, -1)} disabled={draft[k] === 0} aria-label={`Remove a point from ${k}`}>
                −
              </button>
              <span className="stat-count">{draft[k]}</span>
              <button type="button" onClick={() => bump(k, 1)} disabled={left === 0} aria-label={`Add a point to ${k}`}>
                +
              </button>
            </span>
            <span className="stat-gain">{draft[k] > 0 ? `+${draft[k] * prog.statPointValue[k]}` : ''}</span>
          </li>
        ))}
      </ul>
      <div className="stat-actions">
        <button type="button" onClick={() => setDraft(ZERO)} disabled={used === 0}>
          Reset
        </button>
        <button type="button" className="primary" onClick={() => onConfirm(draft)} disabled={used === 0}>
          Confirm
        </button>
      </div>
      <p className="muted small">1 point = +{prog.statPointValue.hp} HP, or +1 ATK, DEF or SPD. Points left unspent go on the recommended spread when you fight.</p>
    </section>
  );
}

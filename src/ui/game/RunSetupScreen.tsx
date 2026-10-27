import { useMemo, useState } from 'react';
import { META_CATALOG } from '../../data/meta/catalog.ts';
import { perkOffer, runSetupFor } from '../../engine/meta/index.ts';
import { FAVORED_ROUNDS } from '../../engine/run/index.ts';
import { randomSeed, type Game } from './useGame.ts';

/** Before a run: pick a ladder tier and starting perks (or take today's daily as it comes). */
export function RunSetupScreen({ game }: { game: Game }) {
  const { unlocked, baseCtx, daily, setupDaily: isDaily } = game;
  const ladder = baseCtx.content.ladder;
  const perks = baseCtx.content.perks;
  const [tier, setTier] = useState(Math.min(unlocked.maxTier, game.profile.maxTier));
  const [seed] = useState(randomSeed);
  const [custom, setCustom] = useState('');
  const runSeed = isDaily ? daily.seed : custom.trim() || seed;
  const keep = isDaily ? 1 : unlocked.perkSlots;
  const offer = useMemo(
    () => (isDaily ? daily.perkOffer : perkOffer(runSeed, unlocked.perks, keep, META_CATALOG)),
    [isDaily, daily, runSeed, unlocked.perks, keep],
  );
  const [picked, setPicked] = useState<string[]>([]);
  const chosen = picked.filter((p) => offer.includes(p));
  const shownTier = isDaily ? daily.setup.tier : tier;
  const classes = isDaily ? daily.setup.classes : unlocked.classes;
  const [favored, setFavored] = useState('');

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : keep === 1 ? [id] : p.length < keep ? [...p, id] : p));

  const start = () => {
    if (isDaily) game.startRun(daily.seed, { ...daily.setup, perks: chosen.slice(0, 1), ...(classes.includes(favored) ? { favored } : {}) });
    else game.startRun(runSeed, runSetupFor(unlocked, tier, chosen, favored || undefined));
  };

  return (
    <div className="screen setup-screen">
      <header className="setup-head">
        <button type="button" onClick={game.toTitle}>
          ← Back
        </button>
        <h1>{isDaily ? `Daily run · ${game.today}` : 'New run'}</h1>
      </header>

      <section className="setup-section">
        <h2>Difficulty</h2>
        {isDaily ? (
          <p className="muted">Today&apos;s daily is tier {shownTier}, with every class and item unlocked. Same seed for everyone; one attempt. Achievements don&apos;t count on dailies.</p>
        ) : (
          <div className="tier-picker" role="radiogroup" aria-label="Ladder tier">
            {Array.from({ length: unlocked.maxTier + 1 }, (_, t) => (
              <button key={t} type="button" role="radio" aria-checked={tier === t} className={tier === t ? 'active' : ''} onClick={() => setTier(t)}>
                {t === 0 ? 'Base' : `Tier ${t}`}
              </button>
            ))}
            {unlocked.maxTier < ladder.length && <span className="muted small">Win a run on tier {unlocked.maxTier} to unlock tier {unlocked.maxTier + 1}.</span>}
          </div>
        )}
        {shownTier > 0 ? (
          <ol className="tier-mods">
            {ladder
              .filter((l) => l.tier <= shownTier)
              .map((l) => (
                <li key={l.tier} value={l.tier}>
                  {l.description}
                </li>
              ))}
          </ol>
        ) : (
          <p className="muted small">The base game: no modifiers.</p>
        )}
      </section>

      <section className="setup-section">
        <h2>
          Starting perk{keep > 1 ? 's' : ''} <span className="muted small">(choose {keep === 1 ? 'one' : `up to ${keep}`})</span>
        </h2>
        {offer.length === 0 && <p className="muted">No perks unlocked yet.</p>}
        <div className="perk-offer">
          {offer.map((id) => {
            const perk = perks[id];
            if (!perk) return null;
            const on = chosen.includes(id);
            return (
              <button key={id} type="button" className={`perk-card ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => toggle(id)}>
                <strong>{perk.name}</strong>
                <span>{perk.description}</span>
              </button>
            );
          })}
        </div>
        {!isDaily && unlocked.perkSlots < META_CATALOG.maxPerkSlots && (
          <p className="muted small">The Perkception achievements let you keep more perks.</p>
        )}
      </section>

      <section className="setup-section">
        <h2>
          Favored class <span className="muted small">(optional)</span>
        </h2>
        <select value={favored} onChange={(e) => setFavored(e.target.value)} aria-label="Favored class">
          <option value="">None</option>
          {classes.map((id) => (
            <option key={id} value={id}>
              {baseCtx.content.classes[id]?.name ?? id}
            </option>
          ))}
        </select>
        <p className="muted small">Every shop in rounds 1–{FAVORED_ROUNDS}, rerolls included, offers at least one recruit of this class.</p>
      </section>

      {!isDaily && (
        <details className="setup-seed">
          <summary>Custom seed</summary>
          <input value={custom} placeholder={seed} onChange={(e) => setCustom(e.target.value)} aria-label="Seed" />
          <span className="muted small"> Same seed and choices, same run.</span>
        </details>
      )}

      <div className="setup-actions">
        <button type="button" className="primary big" onClick={start}>
          {chosen.length === 0 && offer.length > 0 ? 'Start without a perk' : 'Start run'}
          {game.canContinue && <span className="sub">Abandons the current run</span>}
        </button>
      </div>
    </div>
  );
}

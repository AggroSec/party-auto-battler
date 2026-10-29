import { useState } from 'react';
import type { RunContext, RunState } from '../../engine/run/index.ts';
import { SoundToggle } from '../audio/SoundToggle.tsx';
import { Glossary } from './Rules.tsx';

/** Round, gold, lives and wins. */
export function Hud({ run, ctx, onMenu }: { run: RunState; ctx: RunContext; onMenu?: () => void }) {
  const { startingLives, winsToComplete } = ctx.config;
  const [help, setHelp] = useState(false);
  return (
    <header className="hud">
      <span className="hud-round">Round {run.round}</span>
      {(run.setup.tier > 0 || run.setup.daily) && (
        <span className="hud-tier" title={ctx.content.ladder.filter((l) => l.tier <= run.setup.tier).map((l) => `${l.tier}. ${l.description}`).join('\n')}>
          {run.setup.daily ? '📅 Daily · ' : ''}Tier {run.setup.tier}
        </span>
      )}
      {run.setup.perks.length > 0 && (
        <span className="hud-perks" title={run.setup.perks.map((id) => `${ctx.content.perks[id]?.name}: ${ctx.content.perks[id]?.description}`).join('\n')}>
          ✨ {run.setup.perks.map((id) => ctx.content.perks[id]?.name ?? id).join(', ')}
        </span>
      )}
      <span className="hud-gold" title="Gold">
        💰 {run.gold}
      </span>
      <span className="hud-lives" title={`${run.lives} of ${startingLives} lives`} aria-label={`${run.lives} lives`}>
        {Array.from({ length: startingLives }, (_, i) => (
          <span key={i} className={i < run.lives ? 'heart' : 'heart lost'} aria-hidden>
            ❤️
          </span>
        ))}
      </span>
      <span className="hud-wins" title="Wins" aria-label={`${run.wins} of ${winsToComplete} wins`}>
        🏆 {run.wins}/{winsToComplete}
        <span className="wins-bar" aria-hidden>
          <span style={{ width: `${(run.wins / winsToComplete) * 100}%` }} />
        </span>
      </span>
      {(run.winStreak > 1 || run.lossStreak > 1) && (
        <span className="hud-streak">{run.winStreak > 1 ? `🔥 ${run.winStreak} win streak` : `${run.lossStreak} loss streak`}</span>
      )}
      <SoundToggle className="hud-sound" />
      <button type="button" className="hud-help" onClick={() => setHelp(true)} aria-label="Glossary" title="Glossary">
        ?
      </button>
      {onMenu && (
        <button type="button" className="hud-menu" onClick={onMenu}>
          Menu
        </button>
      )}
      {help && <Glossary onClose={() => setHelp(false)} />}
    </header>
  );
}

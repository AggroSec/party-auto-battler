import type { RunContext, RunState } from '../../engine/run/index.ts';

/** Round, gold, lives and wins. */
export function Hud({ run, ctx, onMenu }: { run: RunState; ctx: RunContext; onMenu?: () => void }) {
  const { startingLives, winsToComplete } = ctx.config;
  return (
    <header className="hud">
      <span className="hud-round">Round {run.round}</span>
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
      {onMenu && (
        <button type="button" className="hud-menu" onClick={onMenu}>
          Menu
        </button>
      )}
    </header>
  );
}

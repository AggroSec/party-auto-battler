import { boardUnits } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { className } from './names.ts';
import type { Game } from './useGame.ts';

const RESULT_ICON = { player: '✅', enemy: '❌', draw: '➖' } as const;

export function RunSummary({ game }: { game: Game }) {
  const { run, stats, ctx, best } = game;
  const complete = run.phase === 'complete';
  const units = Object.entries(stats)
    .map(([uid, s]) => ({ uid: Number(uid), ...s }))
    .sort((a, b) => b.dealt + b.healed - (a.dealt + a.healed));
  const mvp = units[0];
  const finalParty = boardUnits(run.board);
  return (
    <div className="screen summary-screen">
      <h1 className={complete ? 'win' : 'loss'}>{complete ? '🏆 Run complete!' : 'Run over'}</h1>
      <p className="summary-line">
        {run.wins} wins · {run.losses} losses{run.draws ? ` · ${run.draws} draws` : ''} · {run.history.length} rounds
        {complete && ` · ${run.lives} lives left`}
      </p>
      {best && <p className="muted">Best run: {best.completed ? 'completed' : `${best.wins} wins`} in {best.rounds} rounds</p>}

      <section>
        <h2>Rounds</h2>
        <ol className="history">
          {run.history.map((h) => (
            <li key={h.round} className={h.result} title={`Round ${h.round}: ${h.enemy.map((id) => className(ctx.content, id)).join(', ')}`}>
              <span className="history-round">{h.round}</span>
              <span aria-label={h.result}>{RESULT_ICON[h.result]}</span>
              <span className="history-enemy" aria-hidden>
                {h.enemy.map((id) => classStyle(ctx.content, id).glyph).join('')}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Final party</h2>
        <div className="final-party">
          {finalParty.map((u) => {
            const s = stats[u.uid];
            const style = classStyle(ctx.content, u.classId);
            return (
              <div key={u.uid} className={`final-unit ${mvp?.uid === u.uid ? 'mvp' : ''}`} style={{ '--class-color': style.color } as React.CSSProperties}>
                <span className="avatar" aria-hidden>
                  {style.glyph}
                </span>
                <strong>
                  {u.name} {mvp?.uid === u.uid && <span title="Most damage + healing this run">⭐ MVP</span>}
                </strong>
                <span className="muted">
                  Lv {u.level} {className(ctx.content, u.advancedClassId ?? u.classId)}
                </span>
                <span className="muted small">{u.talents.map((t) => ctx.content.talents[t]?.name ?? t).join(', ')}</span>
                <span className="muted small">{u.items.map((i) => `🎒 ${ctx.content.items[i]?.name ?? i}`).join(' ')}</span>
                {s && (
                  <span className="small">
                    {s.dealt} dmg · {s.healed} heal/shield · {s.kills} kills · {s.fights} fights
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="summary-actions">
        <button type="button" className="primary big" onClick={() => game.startRun()}>
          New run
        </button>
        <button type="button" onClick={game.toTitle}>
          Title screen
        </button>
      </div>
    </div>
  );
}

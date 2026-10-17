import { useMemo, useState } from 'react';
import type { CombatResult, UnitSnapshot } from '../../engine/index.ts';
import type { RunContent } from '../../engine/run/index.ts';
import { describeEvent } from '../format.ts';
import { Arena } from './Arena.tsx';
import { classStyle } from './classStyle.ts';
import { buildTimeline, type Frame } from './playback.ts';
import { usePlayback } from './usePlayback.ts';
import type { FightView, Game } from './useGame.ts';

const OUTCOME = {
  player: { title: 'Victory!', cls: 'win' },
  enemy: { title: 'Defeat', cls: 'loss' },
  draw: { title: 'Draw', cls: 'draw' },
} as const;

/** One line describing what happened this frame. */
function caption(frame: Frame | undefined): string {
  if (!frame) return '';
  const name = (id: string | null) => (id ? (frame.units[id]?.name ?? id) : '');
  switch (frame.kind) {
    case 'start':
      return frame.fx.length > 0 ? 'Start of combat effects…' : 'The battle begins!';
    case 'overtime':
      return `Sudden death, stage ${frame.overtime?.stage ?? ''}.`;
    case 'end':
      return '';
    case 'turn':
      if (frame.ability) return `${name(frame.actor)} casts ${frame.ability}!`;
      if (frame.attacked.length > 0) return `${name(frame.actor)} attacks ${name(frame.attacked[0] ?? null)}.`;
      return `${name(frame.actor)}'s turn.`;
  }
}

function FightSummary({ combat, content }: { combat: CombatResult; content: RunContent }) {
  const start = combat.events[0];
  const classOf = new Map(start?.type === 'combatStart' ? start.units.map((u) => [u.id, u.classId]) : []);
  const max = Math.max(1, ...combat.summary.map((s) => Math.max(s.damageDealt, s.damageTaken, s.healingDone + s.shieldingDone)));
  return (
    <div className="fight-summary">
      {(['player', 'enemy'] as const).map((side) => (
        <table key={side} className={`summary-table ${side}`}>
          <caption>{side === 'player' ? 'Your party' : 'Enemy'}</caption>
          <thead>
            <tr>
              <th>Unit</th>
              <th>Dealt</th>
              <th>Taken</th>
              <th>Healed + shielded</th>
            </tr>
          </thead>
          <tbody>
            {combat.summary
              .filter((s) => s.side === side)
              .map((s) => (
                <tr key={s.id} className={s.survived ? '' : 'dead'}>
                  <td>
                    {classStyle(content, classOf.get(s.id) ?? '').glyph} {s.name}
                    {s.kills > 0 && <span className="muted"> · {s.kills}💀</span>}
                  </td>
                  {[s.damageDealt, s.damageTaken, s.healingDone + s.shieldingDone].map((v, i) => (
                    <td key={i}>
                      <span className={`bar b${i}`} style={{ width: `${(v / max) * 100}%` }} />
                      <span className="bar-value">{v}</span>
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

function CombatLog({ combat }: { combat: CombatResult }) {
  const start = combat.events[0];
  const units = new Map<string, UnitSnapshot>(start?.type === 'combatStart' ? start.units.map((u) => [u.id, u]) : []);
  return (
    <ol className="log">
      {combat.events.map((e, i) => {
        const text = describeEvent(e, units);
        return text === null ? null : (
          <li key={i}>
            <span className="tick">{e.tick}</span>
            {text}
          </li>
        );
      })}
    </ol>
  );
}

function ResultPanel({ fight, game }: { fight: FightView; game: Game }) {
  const [showLog, setShowLog] = useState(false);
  const outcome = OUTCOME[fight.combat.winner];
  const over = game.run.phase !== 'shop';
  return (
    <section className={`result ${outcome.cls}`} aria-live="polite">
      <h2>{outcome.title}</h2>
      <p className="result-line">
        {fight.combat.winner === 'enemy' && <span>💔 −1 life ({game.run.lives} left) · </span>}
        <span>⭐ +{fight.xp} XP to every unit</span>
        {fight.income && (
          <span>
            {' '}
            · 💰 +{fight.income.total}g (base {fight.income.base}
            {fight.income.interest ? `, interest ${fight.income.interest}` : ''}
            {fight.income.streak ? `, streak ${fight.income.streak}` : ''})
          </span>
        )}
      </p>
      <FightSummary combat={fight.combat} content={game.ctx.content} />
      <div className="result-actions">
        <button type="button" onClick={() => setShowLog((s) => !s)}>
          {showLog ? 'Hide combat log' : 'Show combat log'}
        </button>
        <button type="button" className="primary" onClick={game.finishCombat} autoFocus>
          {over ? 'See run summary →' : `Continue to round ${game.run.round} →`}
        </button>
      </div>
      {showLog && <CombatLog combat={fight.combat} />}
    </section>
  );
}

export function CombatScreen({ game }: { game: Game }) {
  const fight = game.lastFight!;
  const frames = useMemo(() => buildTimeline(fight.combat), [fight]);
  const pb = usePlayback(frames);
  const frame = pb.frame;
  return (
    <div className="screen combat-screen">
      <header className="combat-head">
        <h2>Round {fight.round}</h2>
        <span className="muted">Tick {frame?.tick ?? 0}</span>
        <div className="playback-controls" role="group" aria-label="Playback">
          <button type="button" onClick={pb.togglePlay} disabled={pb.done} aria-label={pb.playing ? 'Pause' : 'Play'}>
            {pb.playing ? '⏸' : '▶'}
          </button>
          {([1, 2] as const).map((s) => (
            <button key={s} type="button" className={pb.speed === s ? 'active' : ''} onClick={() => pb.setSpeed(s)} aria-pressed={pb.speed === s}>
              {s}x
            </button>
          ))}
          {pb.done ? (
            <button type="button" onClick={pb.restart}>
              ↺ Replay
            </button>
          ) : (
            <button type="button" onClick={pb.skip}>
              Skip ⏭
            </button>
          )}
        </div>
      </header>
      {frame && <Arena frame={frame} frameIndex={pb.index} content={game.ctx.content} duration={pb.duration} />}
      <p className="caption" aria-live="off">
        {caption(frame)}
      </p>
      {pb.done && <ResultPanel fight={fight} game={game} />}
    </div>
  );
}

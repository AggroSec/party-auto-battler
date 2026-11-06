import { useEffect, useMemo, useState } from 'react';
import { play, playAll } from '../audio/sfx.ts';
import { frameSounds } from '../audio/sounds.ts';
import { SoundToggle } from '../audio/SoundToggle.tsx';
import type { CombatResult, UnitSetup, UnitSummary } from '../../engine/index.ts';
import { boardUnits, breakdownRows, isMaxLevel, resolveBoard, type Board, type RunContent } from '../../engine/run/index.ts';
import { combatUnits, describeEvent } from '../format.ts';
import { Arena } from './Arena.tsx';
import { LevelUpGains } from './ChoicePanel.tsx';
import { classStyle } from './classStyle.ts';
import { Icon } from './Icon.tsx';
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

/** Each unit as it fought, by combat id ("p0".."p4", "e0".."e4"), for its rules. */
function setupsById(board: Board, enemy: Board, content: RunContent): Map<string, UnitSetup> {
  const out = new Map<string, UnitSetup>();
  ([['p', board], ['e', enemy]] as const).forEach(([prefix, b]) => {
    const party = resolveBoard(b, content);
    party.front.forEach((u, col) => u && out.set(`${prefix}${col}`, u));
    party.back.forEach((u, col) => u && out.set(`${prefix}${3 + col}`, u));
  });
  return out;
}

/** What one unit's rules (or ability, attacks, triggers and consumables) did this fight. */
function Breakdown({ summary, setup, content }: { summary: UnitSummary; setup: UnitSetup | undefined; content: RunContent }) {
  const rows = breakdownRows(summary.actions ?? [], setup?.rules, content);
  if (rows.length === 0) return <p className="muted small">No breakdown for this fight.</p>;
  return (
    <ul className="breakdown">
      {rows.map((r) => {
        const stats = [
          r.damage ? `${r.damage} dealt` : '',
          r.support ? `${r.support} healed + shielded` : '',
          r.afflictions ? `${r.afflictions} affliction${r.afflictions === 1 ? '' : 's'}` : '',
          r.kills ? `${r.kills}💀` : '',
        ].filter(Boolean);
        return (
          <li key={r.key} className={r.uses === 0 ? 'never' : ''}>
            <div className="bd-head">
              <span>{r.label}</span>
              <span className="bd-uses" title="Times it fired">
                ×{r.uses}
              </span>
            </div>
            {stats.length > 0 && <div className="bd-stats">{stats.join(' · ')}</div>}
            {r.note && <div className="muted small">{r.note}</div>}
          </li>
        );
      })}
    </ul>
  );
}

function FightSummary({ fight, content }: { fight: FightView; content: RunContent }) {
  const { combat } = fight;
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((o) => {
      const next = new Set(o);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const classOf = new Map([...combatUnits(combat.events).values()].map((u) => [u.id, u.classId]));
  const setups = useMemo(() => setupsById(fight.board, fight.enemy, content), [fight, content]);
  const max = Math.max(1, ...combat.summary.map((s) => Math.max(s.damageDealt, s.damageTaken, s.healingDone + s.shieldingDone)));
  return (
    <div className="fight-summary">
      <p className="muted small summary-hint">Tap a unit to see what each {setups.values().next().value?.rules ? 'rule' : 'ability, attack and item'} did.</p>
      {(['player', 'enemy'] as const).map((side) => (
        <table key={side} className={`summary-table ${side}`}>
          <caption>{side === 'player' ? 'Your party' : 'Enemy'}</caption>
          <thead>
            <tr>
              <th>Unit</th>
              <th title="Turns taken: basic attacks plus ability casts (✨)">Actions</th>
              <th>Dealt</th>
              <th>Taken</th>
              <th>Healed + shielded</th>
            </tr>
          </thead>
          <tbody>
            {combat.summary
              .filter((s) => s.side === side)
              .flatMap((s) => {
                const isOpen = open.has(s.id);
                const row = (
                  <tr key={s.id} className={`${s.survived ? '' : 'dead'}${s.summonedBy ? ' summon-row' : ''}`}>
                    <td>
                      <button type="button" className="unit-toggle" aria-expanded={isOpen} onClick={() => toggle(s.id)}>
                        <span className="toggle-caret">{isOpen ? '▾' : '▸'}</span>
                        <Icon id={classStyle(content, classOf.get(s.id) ?? '').icon} className="row-icon" /> {s.name}
                      </button>
                      {s.summonedBy && <span className="muted"> (summon)</span>}
                      {s.kills > 0 && <span className="muted"> · {s.kills}💀</span>}
                    </td>
                    <td className="actions-cell">
                      {s.attacks + s.abilities}
                      {s.abilities > 0 && <span className="muted"> ({s.abilities}✨)</span>}
                    </td>
                    {[s.damageDealt, s.damageTaken, s.healingDone + s.shieldingDone].map((v, i) => (
                      <td key={i}>
                        <span className={`bar b${i}`} style={{ width: `${(v / max) * 100}%` }} />
                        <span className="bar-value">{v}</span>
                      </td>
                    ))}
                  </tr>
                );
                return isOpen
                  ? [
                      row,
                      <tr key={`${s.id}-breakdown`} className="breakdown-row">
                        <td colSpan={5}>
                          <Breakdown summary={s} setup={setups.get(s.id)} content={content} />
                        </td>
                      </tr>,
                    ]
                  : [row];
              })}
          </tbody>
        </table>
      ))}
    </div>
  );
}

function CombatLog({ combat }: { combat: CombatResult }) {
  const units = combatUnits(combat.events);
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
  const winner = fight.combat.winner;
  useEffect(() => play(winner === 'player' ? 'victory' : winner === 'enemy' ? 'defeat' : 'block'), [winner]);
  return (
    <section className={`result ${outcome.cls}`} aria-live="polite">
      <h2>{outcome.title}</h2>
      <p className="result-line">
        {fight.combat.winner === 'enemy' && <span>💔 −1 life ({game.run.lives} left) · </span>}
        <span>
          ⭐ +{fight.xp} XP{' '}
          {boardUnits(fight.board).some((u) => isMaxLevel(u, game.ctx.config.progression)) ? 'to every unit below max level' : 'to every unit'}
        </span>
        {fight.income && (
          <span>
            {' '}
            · 💰 +{fight.income.total}g (base {fight.income.base}
            {fight.income.interest ? `, interest ${fight.income.interest}` : ''}
            {fight.income.streak ? `, streak ${fight.income.streak}` : ''}
            {fight.income.items ? `, per-win bonus ${fight.income.items}` : ''})
          </span>
        )}
      </p>
      {fight.levelUps.length > 0 && (
        <div className="result-levelups">
          <h3>⭐ Level up!</h3>
          {fight.levelUps.map((l) => (
            <LevelUpGains key={l.uid} levelUp={l} showName />
          ))}
        </div>
      )}
      <FightSummary fight={fight} content={game.ctx.content} />
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
  // Each frame's sounds, as it comes up. Skipping jumps to the end silently.
  const { index, done } = pb;
  useEffect(() => {
    if (!done) playAll(frameSounds(frames[index]!));
  }, [frames, index, done]);
  return (
    <div className="screen combat-screen">
      <header className="combat-head">
        <h2>Round {fight.round}</h2>
        <span className="muted">Tick {frame?.tick ?? 0}</span>
        <div className="playback-controls" role="group" aria-label="Playback">
          <button type="button" onClick={pb.togglePlay} disabled={pb.done} aria-label={pb.playing ? 'Pause' : 'Play'}>
            {pb.playing ? '⏸' : '▶'}
          </button>
          <SoundToggle />
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

import { useMemo } from 'react';
import type { CombatResult } from '../engine/index.ts';
import { combatUnits, describeEvent } from './format.ts';

/** Outcome banner, per-unit summary and readable event log for one fight. */
export function CombatReport({ result }: { result: CombatResult }) {
  const units = useMemo(() => combatUnits(result.events), [result]);

  const lines = result.events
    .map((e) => ({ tick: e.tick, text: describeEvent(e, units) }))
    .filter((l): l is { tick: number; text: string } => l.text !== null);

  return (
    <>
      <section className={`banner ${result.winner}`}>
        {result.winner === 'draw' ? 'Draw' : result.winner === 'player' ? 'Player wins' : 'Enemy wins'} after{' '}
        {result.ticks} ticks
      </section>

      <div className="columns">
        <section>
          <h2>Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Dealt</th>
                <th>Taken</th>
                <th>Healed</th>
                <th>Kills</th>
              </tr>
            </thead>
            <tbody>
              {result.summary.map((s) => (
                <tr key={s.id} className={s.survived ? '' : 'dead'}>
                  <td>
                    {s.side === 'player' ? '🟦' : '🟥'} {s.name} <span className="muted">{s.id}</span>
                  </td>
                  <td>{s.damageDealt}</td>
                  <td>{s.damageTaken}</td>
                  <td>{s.healingDone}</td>
                  <td>{s.kills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>Event log</h2>
          <ol className="log">
            {lines.map((l, i) => (
              <li key={i}>
                <span className="tick">{l.tick}</span>
                {l.text}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}

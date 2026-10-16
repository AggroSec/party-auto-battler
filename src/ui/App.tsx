import { useMemo, useState } from 'react';
import { CLASSES, CLASS_IDS, type ClassId } from '../data/classes.ts';
import { partyOf } from '../data/units.ts';
import { Rng, simulateCombat, type Party, type UnitSnapshot } from '../engine/index.ts';
import { describeEvent } from './format.ts';

type Lineup = { front: (ClassId | null)[]; back: (ClassId | null)[] };

const DEFAULT_PLAYER: Lineup = { front: ['warrior', 'rogue', 'warrior'], back: ['mage', 'cleric'] };
const DEFAULT_ENEMY: Lineup = { front: ['warrior', 'necromancer', 'rogue'], back: ['ranger', 'cleric'] };

const toParty = (l: Lineup): Party => partyOf(l.front, l.back);

/**
 * Milestone 1 debug view: pick two lineups and a seed, then read the event log.
 * The real shop/board/playback UI arrives in Milestone 4.
 */
export function App() {
  const [player, setPlayer] = useState(DEFAULT_PLAYER);
  const [enemy, setEnemy] = useState(DEFAULT_ENEMY);
  const [seed, setSeed] = useState('demo');

  const result = useMemo(
    () => simulateCombat({ player: toParty(player), enemy: toParty(enemy), rng: new Rng(seed) }),
    [player, enemy, seed],
  );

  const units = useMemo(() => {
    const start = result.events[0];
    const list: UnitSnapshot[] = start?.type === 'combatStart' ? start.units : [];
    return new Map(list.map((u) => [u.id, u]));
  }, [result]);

  const lines = result.events
    .map((e) => ({ tick: e.tick, text: describeEvent(e, units) }))
    .filter((l): l is { tick: number; text: string } => l.text !== null);

  return (
    <main className="app">
      <header>
        <h1>Party Auto-Battler</h1>
        <p className="muted">Milestone 1: engine debug view. The same seed and lineups always replay identically.</p>
      </header>

      <section className="controls">
        <LineupEditor title="🟦 Player" lineup={player} onChange={setPlayer} />
        <LineupEditor title="🟥 Enemy" lineup={enemy} onChange={setEnemy} />
        <label className="seed">
          Seed
          <input value={seed} onChange={(e) => setSeed(e.target.value)} />
        </label>
      </section>

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
    </main>
  );
}

function LineupEditor({
  title,
  lineup,
  onChange,
}: {
  title: string;
  lineup: Lineup;
  onChange: (l: Lineup) => void;
}) {
  const slot = (row: 'front' | 'back', i: number) => (
    <select
      key={`${row}${i}`}
      value={lineup[row][i] ?? ''}
      onChange={(e) => {
        const next = { front: [...lineup.front], back: [...lineup.back] };
        next[row][i] = (e.target.value || null) as ClassId | null;
        onChange(next);
      }}
    >
      <option value="">(empty)</option>
      {CLASS_IDS.map((id) => (
        <option key={id} value={id}>
          {CLASSES[id].name}
        </option>
      ))}
    </select>
  );
  return (
    <fieldset className="lineup">
      <legend>{title}</legend>
      <div className="row">
        <span className="muted">Front</span>
        {[0, 1, 2].map((i) => slot('front', i))}
      </div>
      <div className="row">
        <span className="muted">Back</span>
        {[0, 1].map((i) => slot('back', i))}
      </div>
    </fieldset>
  );
}

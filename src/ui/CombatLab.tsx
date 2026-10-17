import { useMemo, useState } from 'react';
import { CLASSES, CLASS_IDS, type ClassId } from '../data/classes.ts';
import { partyOf } from '../data/units.ts';
import { Rng, simulateCombat, type Party } from '../engine/index.ts';
import { CombatReport } from './CombatReport.tsx';

type Lineup = { front: (ClassId | null)[]; back: (ClassId | null)[] };

const DEFAULT_PLAYER: Lineup = { front: ['warrior', 'rogue', 'warrior'], back: ['mage', 'cleric'] };
const DEFAULT_ENEMY: Lineup = { front: ['warrior', 'necromancer', 'rogue'], back: ['ranger', 'cleric'] };

const toParty = (l: Lineup): Party => partyOf(l.front, l.back);

/** Debug view: pick two lineups and a seed, then read the event log. */
export function CombatLab() {
  const [player, setPlayer] = useState(DEFAULT_PLAYER);
  const [enemy, setEnemy] = useState(DEFAULT_ENEMY);
  const [seed, setSeed] = useState('demo');

  const result = useMemo(
    () => simulateCombat({ player: toParty(player), enemy: toParty(enemy), rng: new Rng(seed) }),
    [player, enemy, seed],
  );

  return (
    <>
      <p className="muted">The same seed and lineups always replay identically.</p>
      <section className="controls">
        <LineupEditor title="🟦 Player" lineup={player} onChange={setPlayer} />
        <LineupEditor title="🟥 Enemy" lineup={enemy} onChange={setEnemy} />
        <label className="seed">
          Seed
          <input value={seed} onChange={(e) => setSeed(e.target.value)} />
        </label>
      </section>
      <CombatReport result={result} />
    </>
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

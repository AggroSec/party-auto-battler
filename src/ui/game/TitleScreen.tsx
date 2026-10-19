import { useState } from 'react';
import { PlayLogExport } from './PlayLogExport.tsx';
import type { Game } from './useGame.ts';

export function TitleScreen({ game, onOpenLab }: { game: Game; onOpenLab: () => void }) {
  const [seed, setSeed] = useState('');
  const [custom, setCustom] = useState(false);
  const { run, best, canContinue } = game;
  return (
    <div className="screen title-screen">
      <h1 className="game-title">
        <span aria-hidden>⚔️</span> Party Auto-Battler
      </h1>
      <p className="tagline">Draft a party, build it out, and watch it fight.</p>
      <div className="title-actions">
        {canContinue && (
          <button type="button" className="primary big" onClick={game.continueRun}>
            Continue run
            <span className="sub">
              Round {run.round} · {run.wins} wins · {run.lives} lives
            </span>
          </button>
        )}
        <button type="button" className={`big ${canContinue ? '' : 'primary'}`} onClick={() => game.startRun(custom && seed.trim() ? seed.trim() : undefined)}>
          New run
          {canContinue && <span className="sub">Abandons the current run</span>}
        </button>
        <label className="custom-seed">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Custom seed
        </label>
        {custom && (
          <input className="seed-input" value={seed} placeholder="any text" onChange={(e) => setSeed(e.target.value)} aria-label="Seed" />
        )}
      </div>
      {best && (
        <p className="best">
          Best run: {best.completed ? '🏆 completed' : `${best.wins} wins`} in {best.rounds} rounds
        </p>
      )}
      <section className="how-to">
        <h2>How to play</h2>
        <ul>
          <li>Each round, spend gold in the shop: recruit units, buy items and training, then fight.</li>
          <li>Drag units to position them. The front row (3) takes the hits; the back row (2) is safer.</li>
          <li>Units level up from fights. Every level is a choice: talents, and an advanced class at level 3.</li>
          <li>Classes that share a tag unlock synergies. Win 10 fights before you lose 5 lives.</li>
        </ul>
      </section>
      <footer className="title-footer">
        <button type="button" className="link" onClick={onOpenLab}>
          Combat lab
        </button>
        <PlayLogExport />
      </footer>
    </div>
  );
}

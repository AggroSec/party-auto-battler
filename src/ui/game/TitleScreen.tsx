import { useState } from 'react';
import { META_CATALOG } from '../../data/meta/catalog.ts';
import { maxLevel } from '../../engine/run/index.ts';
import { SoundToggle } from '../audio/SoundToggle.tsx';
import { PlayLogExport } from './PlayLogExport.tsx';
import { Glossary } from './Rules.tsx';
import type { Game } from './useGame.ts';

export function TitleScreen({ game, onOpenLab }: { game: Game; onOpenLab: () => void }) {
  const [help, setHelp] = useState(false);
  const { run, best, canContinue, profile, unlocked, daily, dailyUsed } = game;
  const { config } = game.baseCtx;
  const continuingDaily = canContinue && run.setup.daily === game.today;
  const dailyRecord = profile.daily?.date === game.today ? profile.daily : null;
  return (
    <div className="screen title-screen">
      <h1 className="game-title">
        <span aria-hidden>⚔️</span> Party Auto-Battler
      </h1>
      <p className="tagline">Draft a party, build it out, and watch it fight.</p>
      <div className="title-actions">
        {canContinue && (
          <button type="button" className="primary big" onClick={game.continueRun}>
            Continue {run.setup.daily ? 'daily run' : 'run'}
            <span className="sub">
              Round {run.round} · {run.wins} wins · {run.lives} lives{run.setup.tier > 0 ? ` · tier ${run.setup.tier}` : ''}
            </span>
          </button>
        )}
        <button type="button" className={`big ${canContinue ? '' : 'primary'}`} onClick={() => game.openSetup(false)}>
          New run
          <span className="sub">{unlocked.maxTier > 0 ? `Ladder tiers 0–${unlocked.maxTier} unlocked` : 'Win a run to unlock the ladder'}</span>
        </button>
        <button type="button" className="big" disabled={dailyUsed && !continuingDaily} onClick={() => (continuingDaily ? game.continueRun() : game.openSetup(true))}>
          Daily run
          <span className="sub">
            {dailyRecord?.done
              ? `Today: ${dailyRecord.completed ? '🏆 completed' : `${dailyRecord.wins} wins`} · back tomorrow`
              : dailyUsed
                ? continuingDaily
                  ? 'In progress: continue'
                  : 'Already attempted today'
                : `Tier ${daily.setup.tier} · same seed for everyone · one attempt`}
          </span>
        </button>
        <button type="button" className="big" onClick={game.openCollection}>
          Collection
          <span className="sub">
            {profile.achievements.length}/{META_CATALOG.achievements.length} achievements · {unlocked.classes.length}/{META_CATALOG.all.classes.length} classes
          </span>
        </button>
      </div>
      {best && (
        <p className="best">
          Best run: {best.completed ? '🏆 completed' : `${best.wins} wins`} in {best.rounds} rounds
        </p>
      )}
      <label className="unlock-all">
        <input type="checkbox" checked={profile.unlockAll} onChange={(e) => game.setUnlockAll(e.target.checked)} /> Unlock everything{' '}
        <span className="muted small">(testing, until 1.0: every class, item, perk and tier; achievements still track)</span>
      </label>
      <section className="how-to">
        <h2>How to play</h2>
        <ul>
          <li>Each round, spend gold in the shop: recruit units, buy items and training, then fight.</li>
          <li>Drag units to position them. The front row (3) takes the hits; the back row (2) is safer.</li>
          <li>
            Units level up from fights, up to level {maxLevel(config.progression)}. Every level is a choice: talents, an advanced class at level {config.progression.advanceLevel} and a
            tertiary class at level {config.progression.ascendLevel}. Some late talents grant a second ability.
          </li>
          <li>
            Classes that share a tag unlock synergies. Win {config.winsToComplete} fights before you lose {config.startingLives} lives.
          </li>
          <li>Achievements unlock more classes, items, synergies and starting perks. Winning a run opens the next ladder tier.</li>
        </ul>
      </section>
      <footer className="title-footer">
        <span className="playlog-export">
          <button type="button" className="link" onClick={() => setHelp(true)}>
            Glossary
          </button>
          <button type="button" className="link" onClick={onOpenLab}>
            Combat lab
          </button>
          <button type="button" className="link" onClick={game.openCredits}>
            Credits
          </button>
          <SoundToggle className="link" withLabel />
        </span>
        <PlayLogExport />
      </footer>
      {help && <Glossary onClose={() => setHelp(false)} />}
    </div>
  );
}

import { useState } from 'react';
import { CombatLab } from './CombatLab.tsx';
import { AchievementToasts } from './game/AchievementToasts.tsx';
import { CollectionScreen } from './game/CollectionScreen.tsx';
import { CombatScreen } from './game/CombatScreen.tsx';
import { RunSetupScreen } from './game/RunSetupScreen.tsx';
import { RunSummary } from './game/RunSummary.tsx';
import { ShopScreen } from './game/ShopScreen.tsx';
import { TitleScreen } from './game/TitleScreen.tsx';
import { useGame } from './game/useGame.ts';

/** Screen router. Game state lives in useGame; the engine does all the rules. */
export function App() {
  const game = useGame();
  const [lab, setLab] = useState(false);

  if (lab) {
    return (
      <main className="app lab">
        <header className="lab-head">
          <button type="button" onClick={() => setLab(false)}>
            ← Back
          </button>
          <h1>Combat lab</h1>
          <span className="muted">Pick two line-ups and a seed, then read the event log.</span>
        </header>
        <CombatLab />
      </main>
    );
  }

  return (
    <main className="app">
      {game.screen === 'title' && <TitleScreen game={game} onOpenLab={() => setLab(true)} />}
      {game.screen === 'setup' && <RunSetupScreen game={game} />}
      {game.screen === 'collection' && <CollectionScreen game={game} />}
      {game.screen === 'shop' && <ShopScreen game={game} />}
      {game.screen === 'combat' && game.lastFight && <CombatScreen key={game.lastFight.round} game={game} />}
      {game.screen === 'summary' && <RunSummary game={game} />}
      <AchievementToasts game={game} />
    </main>
  );
}

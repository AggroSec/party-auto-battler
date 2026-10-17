import { useState } from 'react';
import { CombatLab } from './CombatLab.tsx';
import { RunView } from './RunView.tsx';

type Tab = 'run' | 'lab';

/**
 * Debug shell for engine milestones. The real game UI (shop screen, drag-to-
 * position board, animated combat playback) arrives in Milestone 4.
 */
export function App() {
  const [tab, setTab] = useState<Tab>('run');
  return (
    <main className="app">
      <header>
        <h1>Party Auto-Battler</h1>
        <p className="muted">Engine debug build. Not the final UI.</p>
        <nav className="tabs">
          <button className={tab === 'run' ? 'active' : ''} onClick={() => setTab('run')}>
            Run
          </button>
          <button className={tab === 'lab' ? 'active' : ''} onClick={() => setTab('lab')}>
            Combat lab
          </button>
        </nav>
      </header>
      {tab === 'run' ? <RunView /> : <CombatLab />}
    </main>
  );
}

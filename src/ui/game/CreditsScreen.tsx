import { ICONS } from '../../assets/icons.ts';
import { Icon } from './Icon.tsx';
import type { Game } from './useGame.ts';

const REPO = 'https://github.com/AggroSec/party-auto-battler';

/** Who made the game, and every third-party asset it uses (from the same data as ATTRIBUTION.md). */
export function CreditsScreen({ game }: { game: Game }) {
  const icons = Object.entries(ICONS);
  const authors = [...new Set(icons.map(([, i]) => i.author))];
  return (
    <div className="screen credits-screen">
      <header className="setup-head">
        <button type="button" onClick={game.toTitle}>
          ← Back
        </button>
        <h1>Credits</h1>
      </header>

      <section className="setup-section">
        <h2>Made by</h2>
        <p>
          <strong>Brandon</strong> designed and directed the game. <strong>Claude Code</strong> (Anthropic) wrote the code. The specs, decisions and
          milestone reports are in the <a href={REPO}>GitHub repository</a>.
        </p>
      </section>

      <section className="setup-section">
        <h2>Icons</h2>
        <p>
          From <a href="https://game-icons.net">game-icons.net</a> by {authors.join(', ')}, under{' '}
          <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Recoloured in the game.
        </p>
        <ul className="credits-icons">
          {icons.map(([id, icon]) => (
            <li key={id}>
              <Icon id={id as keyof typeof ICONS} />
              <a href={icon.url}>{icon.name}</a> <span className="muted">by {icon.author}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="setup-section">
        <h2>Sound</h2>
        <p>Every sound effect is synthesised in your browser with the Web Audio API. There are no audio files.</p>
      </section>

      <section className="setup-section">
        <h2>Built with</h2>
        <p>TypeScript, React and Vite. Everything else is drawn in code.</p>
      </section>
    </div>
  );
}

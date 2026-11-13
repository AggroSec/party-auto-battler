import { useState } from 'react';
import { STORIES } from '../../data/stories/index.ts';
import { storyMaxTier } from '../../engine/meta/index.ts';
import { classStyle } from './classStyle.ts';
import { Icon } from './Icon.tsx';
import { className } from './names.ts';
import type { Game } from './useGame.ts';

/** Story mode (Milestone 14): pick a story and one of its tiers. */
export function StorySetupScreen({ game }: { game: Game }) {
  const stories = Object.values(STORIES);
  const [storyId, setStoryId] = useState(stories[0]?.id ?? '');
  const story = STORIES[storyId];
  const max = story ? storyMaxTier(game.profile, story.id, story.tiers.length) : 0;
  const [tier, setTier] = useState(max);
  if (!story) return null;
  const record = game.profile.stories?.[story.id];
  const shownTier = Math.min(tier, max);
  return (
    <div className="screen setup-screen story-setup">
      <header className="setup-head">
        <button type="button" onClick={game.toTitle}>
          ← Back
        </button>
        <h1>Story mode</h1>
      </header>
      {stories.length > 1 && (
        <section className="setup-section">
          <h2>Story</h2>
          <div className="tier-picker" role="radiogroup" aria-label="Story">
            {stories.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={s.id === storyId} className={s.id === storyId ? 'active' : ''} onClick={() => setStoryId(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="setup-section">
        <h2>{story.name}</h2>
        <p>{story.blurb}</p>
        <p className="muted small">
          {story.missions.length} missions, each a map of fights, events, shops and camps ending in a boss. The story gives you its heroes; the shop never sells recruits.
          You have {story.lives} lives per mission: run out and the mission starts over.
          {record ? ` Finished ${record.completions} time${record.completions === 1 ? '' : 's'}.` : ''}
        </p>
        <ul className="story-heroes">
          {story.heroes.map((h) => {
            const look = classStyle(game.baseCtx.content, h.classId);
            return (
              <li key={h.id} style={{ '--class-color': look.color } as React.CSSProperties}>
                <span className="avatar small" aria-hidden>
                  <Icon id={look.icon} />
                </span>
                <span>
                  <strong>{h.name}</strong>, {className(game.baseCtx.content, h.classId)}
                  {h.lockedAdvanced ? ` (becomes a ${className(game.baseCtx.content, h.lockedAdvanced)})` : ''}
                  <span className="muted small"> · {h.title}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="setup-section">
        <h2>Difficulty</h2>
        <div className="tier-picker" role="radiogroup" aria-label="Story tier">
          {Array.from({ length: max + 1 }, (_, t) => (
            <button key={t} type="button" role="radio" aria-checked={shownTier === t} className={shownTier === t ? 'active' : ''} onClick={() => setTier(t)}>
              Tier {t}
            </button>
          ))}
          {max < story.tiers.length && <span className="muted small">Finish tier {max} to unlock tier {max + 1}.</span>}
        </div>
        {shownTier > 0 ? (
          <ol className="tier-mods">
            {story.tiers
              .filter((t) => t.tier <= shownTier)
              .map((t) => (
                <li key={t.tier}>{t.description}</li>
              ))}
          </ol>
        ) : (
          <p className="muted small">The story as written: no modifiers.</p>
        )}
      </section>
      <div className="setup-actions">
        <button type="button" className="primary big" onClick={() => game.startStory(story.id, shownTier)}>
          Begin {story.name}
          {game.savedStory && <span className="sub">Abandons the story in progress</span>}
        </button>
      </div>
    </div>
  );
}

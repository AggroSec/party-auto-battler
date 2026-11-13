import { STORIES } from '../../data/stories/index.ts';
import type { RunContext, RunState } from '../../engine/run/index.ts';
import { promptOptions } from '../../engine/story/story.ts';

/**
 * A mission's story text (Milestone 14): its intro when it starts; after a
 * boss, the finished mission's outro and then the next one's intro.
 */
export function StoryScene({ run, onDone }: { run: RunState; onDone: () => void }) {
  const progress = run.story!;
  const story = STORIES[progress.storyId];
  if (!story || !progress.scene) return null;
  // After a boss the run has already moved on to the next mission (unless it was the last).
  const finished = run.phase === 'complete' ? progress.mission : progress.mission - 1;
  const mission = progress.scene === 'outro' ? story.missions[finished] : story.missions[progress.mission];
  if (!mission) return null;
  const joined = progress.scene === 'intro' ? mission.joins.map((id) => story.heroes.find((h) => h.id === id)).filter((h) => h !== undefined) : [];
  const restarted = progress.scene === 'intro' && !!progress.restarted;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`modal story-scene ${progress.scene}`} role="dialog" aria-modal="true" aria-label={mission.name}>
        <p className="story-kicker muted small">
          {story.name} · Mission {(progress.scene === 'outro' ? finished : progress.mission) + 1} of {story.missions.length}
          {progress.scene === 'outro' ? ' · complete' : ''}
        </p>
        <h2>{mission.name}</h2>
        {restarted && <p className="story-restart">💔 Out of lives: the mission starts over, with the party as it was when the mission began.</p>}
        <p className="story-text">{progress.scene === 'outro' ? mission.outro : mission.intro}</p>
        {joined.length > 0 && (
          <ul className="story-joins">
            {joined.map((h) => (
              <li key={h.id}>
                <strong>{h.name}</strong> joins the war band. <span className="muted">{h.title}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="primary" onClick={onDone} autoFocus>
          {progress.scene === 'outro' ? (run.phase === 'complete' ? 'The end →' : 'Onward →') : 'Set out →'}
        </button>
      </section>
    </div>
  );
}

/** The current stop's event or camp: its text and options, then what happened. */
export function StoryPrompt({ run, ctx, onChoose }: { run: RunState; ctx: RunContext; onChoose: (option: number) => void }) {
  const progress = run.story!;
  const prompt = progress.prompt;
  if (!prompt) return null;
  const story = STORIES[progress.storyId];
  const event = prompt.id === 'rest' ? null : story?.events[prompt.id];
  const options = promptOptions(run, ctx);
  const title = event ? event.title : 'Camp';
  const text = event ? event.text : 'A sheltered hollow and a small fire. The war band can rest, or someone can train while the others sleep.';
  return (
    <section className="story-prompt" aria-label={title}>
      <h2>{event ? '❓' : '🔥'} {title}</h2>
      <p>{text}</p>
      {prompt.picked === undefined ? (
        <div className="story-options">
          {options.map((o, i) => (
            <button key={i} type="button" onClick={() => onChoose(i)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="story-result">
          <strong>{prompt.chosen?.label}.</strong> {prompt.chosen?.result}
        </p>
      )}
    </section>
  );
}

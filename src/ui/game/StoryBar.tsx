import { currentNode } from '../../engine/story/story.ts';
import type { RunState } from '../../engine/run/index.ts';
import { NODE_LOOK } from './StoryMap.tsx';

/**
 * Story mode's fight bar (Milestone 14): fight the current stop, or open the
 * map to move on once this stop is dealt with.
 */
export function StoryBar({ run, pending, onFight, onMap }: { run: RunState; pending: boolean; onFight: () => void; onMap: () => void }) {
  const story = run.story!;
  const node = currentNode(run);
  if (story.toFight && node) {
    const look = NODE_LOOK[node.kind];
    return (
      <button type="button" className="fight" disabled={pending} onClick={onFight} title={look.hint}>
        {look.icon} Fight{node.kind === 'fight' && story.eliteNext ? ' (Elite)' : node.kind === 'fight' ? '' : `: ${look.label}`}
      </button>
    );
  }
  const waiting = !!story.prompt && story.prompt.picked === undefined;
  return (
    <button type="button" className="fight" disabled={waiting} onClick={onMap} title={waiting ? 'Choose an option first.' : 'Pick your next stop.'}>
      🗺️ {story.at === null ? 'Set out' : 'Move on'}
    </button>
  );
}

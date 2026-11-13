import { useEffect } from 'react';
import { LAYERS, reachable } from '../../engine/story/map.ts';
import type { RunState, StoryNode, StoryNodeKind } from '../../engine/run/index.ts';

/** How each kind of stop looks on the map. */
export const NODE_LOOK: Record<StoryNodeKind, { icon: string; label: string; hint: string }> = {
  fight: { icon: '⚔️', label: 'Fight', hint: 'A fight. Win for gold and XP.' },
  elite: { icon: '💀', label: 'Elite', hint: 'A harder fight with an Elite and one more enemy. Win for more gold, more XP and a free item.' },
  shop: { icon: '🛒', label: 'Shop', hint: 'Items, training and a consumable. You can reroll here.' },
  event: { icon: '❓', label: 'Event', hint: 'Something happens. You choose how it goes.' },
  rest: { icon: '🔥', label: 'Camp', hint: 'Rest for a life, or train a hero.' },
  boss: { icon: '👑', label: 'Boss', hint: 'The mission’s boss. Lose and it waits for another try.' },
};

/** Where a stop sits on the map, in percent of the map's width and height (layer 0 at the bottom). */
function position(node: StoryNode, map: readonly StoryNode[]): { x: number; y: number } {
  const width = map.filter((n) => n.layer === node.layer).length;
  return { x: ((node.col + 0.5) / width) * 100, y: 100 - ((node.layer + 0.5) / LAYERS) * 100 };
}

/**
 * The mission map (Milestone 14): stops in layers, paths between them, the
 * route taken so far, and the stops the party can move to next.
 */
export function StoryMap({ run, onTravel, onClose }: { run: RunState; onTravel?: (node: string) => void; onClose: () => void }) {
  const story = run.story!;
  const open = new Set(onTravel ? reachable(story.map, story.at).map((n) => n.id) : []);
  const visited = new Set(story.path);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal story-map-modal" role="dialog" aria-label="Mission map" onClick={(e) => e.stopPropagation()}>
        <header className="story-map-head">
          <h2>Map</h2>
          <span className="muted small">{onTravel ? 'Choose your next stop. The boss waits at the top.' : 'Where you have been, and what lies ahead.'}</span>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="story-map">
          <svg className="story-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {story.map.flatMap((n) =>
              n.next.map((id) => {
                const to = story.map.find((m) => m.id === id)!;
                const a = position(n, story.map);
                const b = position(to, story.map);
                const taken = visited.has(n.id) && visited.has(id);
                const ahead = n.id === story.at && open.has(id);
                return (
                  <line key={`${n.id}>${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={taken ? 'taken' : ahead ? 'ahead' : ''} vectorEffect="non-scaling-stroke" />
                );
              }),
            )}
          </svg>
          {story.map.map((n) => {
            const look = NODE_LOOK[n.kind];
            const { x, y } = position(n, story.map);
            const here = n.id === story.at;
            const can = open.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                className={`story-node ${n.kind}${here ? ' here' : ''}${visited.has(n.id) && !here ? ' visited' : ''}${can ? ' open' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                disabled={!can}
                onClick={() => can && onTravel?.(n.id)}
                title={look.hint}
                aria-label={`${look.label}${here ? ' (you are here)' : ''}${can ? ': go here' : ''}`}
              >
                <span aria-hidden>{look.icon}</span>
                <span className="story-node-label">{here ? 'You' : look.label}</span>
              </button>
            );
          })}
        </div>
        <ul className="story-legend muted small">
          {Object.values(NODE_LOOK).map((l) => (
            <li key={l.label}>
              {l.icon} {l.label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

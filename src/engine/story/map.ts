// Mission maps (Milestone 14): layers of stops joined by paths, generated from
// the run's seed. Paths never cross, every stop can be reached, and every
// stop leads on. The first layer is all fights, the layer before the boss is
// a camp, and the middle of the map always has a shop somewhere.
import { Rng } from '../rng.ts';
import type { StoryNode, StoryNodeKind } from './types.ts';

/** Layers per map: 0..LAYERS-1, the last is the boss. */
export const LAYERS = 7;
export const BOSS_LAYER = LAYERS - 1;
const REST_LAYER = BOSS_LAYER - 1;
const SHOP_LAYER = 3;
/** Elites only from this layer, so a mission opens gently. */
const ELITE_FROM = 2;

/** What a middle stop rolls as: fights most often, then events, shops and elites. */
const WEIGHTS: [StoryNodeKind, number][] = [
  ['fight', 0.45],
  ['event', 0.25],
  ['shop', 0.15],
  ['elite', 0.15],
];

function rollKind(rng: Rng, layer: number): StoryNodeKind {
  if (layer === 0) return 'fight';
  if (layer === REST_LAYER) return 'rest';
  if (layer === BOSS_LAYER) return 'boss';
  const open = WEIGHTS.filter(([k]) => k !== 'elite' || layer >= ELITE_FROM);
  const total = open.reduce((s, [, w]) => s + w, 0);
  let roll = rng.next() * total;
  for (const [kind, w] of open) {
    roll -= w;
    if (roll < 0) return kind;
  }
  return 'fight';
}

/**
 * Generate a mission's map. `events` is the mission's event pool; each event
 * stop draws one, without repeats while any are left.
 */
export function generateMap(seed: string, mission: number, events: readonly string[]): StoryNode[] {
  const rng = new Rng(`${seed}:map:${mission}`);
  const counts = Array.from({ length: LAYERS }, (_, layer) => (layer === 0 ? 2 : layer === BOSS_LAYER ? 1 : layer === REST_LAYER ? 2 : 2 + rng.int(3)));
  const layers: StoryNode[][] = counts.map((n, layer) =>
    Array.from({ length: n }, (_, col) => ({ id: `${layer}-${col}`, layer, col, kind: rollKind(rng, layer), next: [] })),
  );
  // The middle of the map always offers a shop.
  const middle = layers[SHOP_LAYER]!;
  if (!middle.some((n) => n.kind === 'shop')) middle[rng.int(middle.length)]!.kind = 'shop';

  // Join each stop to a contiguous run of the next layer's stops. Ranges
  // overlap by at most their ends, so paths never cross.
  for (let layer = 0; layer < BOSS_LAYER; layer++) {
    const here = layers[layer]!;
    const there = layers[layer + 1]!;
    here.forEach((node, i) => {
      const from = Math.floor((i * there.length) / here.length);
      const to = Math.max(from, Math.ceil(((i + 1) * there.length) / here.length) - 1);
      for (let j = from; j <= to; j++) node.next.push(there[j]!.id);
    });
  }

  let pool: string[] = [];
  for (const node of layers.flat()) {
    if (node.kind !== 'event') continue;
    if (pool.length === 0) pool = [...events];
    if (pool.length === 0) {
      node.kind = 'fight';
      continue;
    }
    node.eventId = pool.splice(rng.int(pool.length), 1)[0]!;
  }
  return layers.flat();
}

/** The stops the party can move to next: the first layer at a mission's start, else the current stop's paths. */
export function reachable(map: readonly StoryNode[], at: string | null): StoryNode[] {
  if (at === null) return map.filter((n) => n.layer === 0);
  const here = map.find((n) => n.id === at);
  return here ? map.filter((n) => here.next.includes(n.id)) : [];
}

/** True for stops that are fights (a fight, an elite or the boss). */
export const isFightNode = (kind: StoryNodeKind): boolean => kind === 'fight' || kind === 'elite' || kind === 'boss';

// Story mode (Milestone 14, issue #26): a fixed, themed party built up through
// missions. Each mission is a map of stops (fights, elites, shops, events,
// camps) ending in a boss. The story gives you its heroes; the shop never
// sells recruits. Content is data (src/data/stories); this is its shape.
import type { BossDef, LadderTier } from '../run/content-types.ts';
import type { EnemyArchetype, RunState } from '../run/types.ts';
import type { Stats } from '../types.ts';

export type StoryNodeKind = 'fight' | 'elite' | 'shop' | 'event' | 'rest' | 'boss';

/** One stop on a mission's map. */
export interface StoryNode {
  /** Unique within the map, e.g. "3-1" (layer 3, column 1). */
  id: string;
  /** Depth: 0 is where the mission starts, the last layer is the boss. */
  layer: number;
  /** Position within the layer (0 = leftmost). */
  col: number;
  kind: StoryNodeKind;
  /** Stops on the next layer reachable from here. */
  next: string[];
  /** Event stops: which event. */
  eventId?: string;
}

/** A named hero the story gives the party. */
export interface StoryHeroDef {
  id: string;
  name: string;
  /** Base class. */
  classId: string;
  /** The only advanced class the hero may take (unset = either). The tertiary class is always the player's pick. */
  lockedAdvanced?: string;
  /** One line about who they are. */
  title: string;
}

/** What picking an event option (or a camp choice) does. */
export type StoryOutcome =
  | { kind: 'gold'; amount: number }
  /** XP for every hero, or one hero by id. */
  | { kind: 'xp'; amount: number; hero?: string }
  | { kind: 'life'; amount: number }
  /** Stat points for every hero, or one hero by id. */
  | { kind: 'statPoints'; amount: number; hero?: string }
  /** A permanent stat gain for one hero (e.g. Bram's wolf, healed). */
  | { kind: 'growth'; hero: string; stats: Partial<Stats> }
  /** Free random items (cost 0) at the camp until the party moves on. */
  | { kind: 'item'; count: number }
  /** A free random consumable at the camp until the party moves on. */
  | { kind: 'consumable' }
  /** The next fight on this mission is an elite (a harder fight, with its reward). */
  | { kind: 'eliteNext' };

export interface StoryEventOption {
  label: string;
  /** Shown after picking it. */
  result: string;
  outcomes: StoryOutcome[];
}

export interface StoryEventDef {
  id: string;
  title: string;
  text: string;
  options: StoryEventOption[];
}

export interface StoryMissionDef {
  id: string;
  name: string;
  /** Shown when the mission starts. */
  intro: string;
  /** Shown when its boss falls. */
  outro: string;
  /** Heroes (by id) who join at the start of this mission. */
  joins: string[];
  /** The mission's enemies: themed archetypes. */
  enemies: EnemyArchetype[];
  /** The boss waiting at the end of the map. */
  boss: BossDef;
  /** Events that can appear on this mission's map. */
  events: string[];
}

export interface StoryDef {
  id: string;
  name: string;
  /** One paragraph for the story picker. */
  blurb: string;
  heroes: StoryHeroDef[];
  missions: StoryMissionDef[];
  events: Readonly<Record<string, StoryEventDef>>;
  /**
   * The story's own small ladder: index 0 = tier 1. Winning the story on its
   * highest unlocked tier opens the next one.
   */
  tiers: LadderTier[];
  startingGold: number;
  /** Lives per mission attempt; running out restarts the mission. */
  lives: number;
  /**
   * Enemy HP and ATK bonus for the whole story (negative = weaker). Story
   * parties are smaller than a run's early on, so its enemies are tuned on
   * their own (docs/BALANCE.md).
   */
  enemyStats?: number;
  /** The level heroes join at, at least (later heroes join at about the party's level). */
  startLevel?: number;
}

/** A choice waiting at the current stop: an event, or the camp's. */
export interface StoryPrompt {
  /** An event id, or 'rest' for a camp. */
  id: string;
  /** Set once picked: the option's index (its result is shown until the party moves on). */
  picked?: number;
  /** The picked option's text and result, as they read when picked. */
  chosen?: { label: string; result: string };
}

/** Where a story run is. Lives on RunState.story; the rest of RunState is the party and its gold. */
export interface StoryProgress {
  storyId: string;
  /** Mission index (0-based). */
  mission: number;
  map: StoryNode[];
  /** The stop the party is at (null = the mission's start, before the first stop). */
  at: string | null;
  /** Stops visited this mission, in order. */
  path: string[];
  /** The current stop is a fight not yet won (a lost boss fight stays to be fought again). */
  toFight?: boolean;
  /** An event or camp choice at the current stop. */
  prompt?: StoryPrompt | null;
  /** The current stop sells things (a shop): rerolls are allowed. */
  shopOpen?: boolean;
  /** The next fight is an elite (an event said so). */
  eliteNext?: boolean;
  /** The mission's story text is waiting to be read: 'intro' at a mission's start, 'outro' after its boss. */
  scene?: 'intro' | 'outro' | null;
  /** The mission just restarted (out of lives); cleared once its intro is read. */
  restarted?: boolean;
  /** How many times the party ran out of lives and restarted a mission. */
  restarts: number;
  /** The state at the mission's start, to restart from when lives run out. Its own checkpoint is null. */
  checkpoint: RunState | null;
}

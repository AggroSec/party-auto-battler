// Meta progression (M7): achievements, unlocks and the player's profile.
import type { UnitFilter } from '../run/content-types.ts';
import type { RunMode } from '../run/types.ts';

/** Content an achievement unlocks (or the starting set). */
export interface Unlocks {
  classes?: readonly string[];
  items?: readonly string[];
  synergies?: readonly string[];
  perks?: readonly string[];
  /** Raises how many starting perks you keep (Perkception). */
  perkSlots?: number;
  /** Raises how many favored classes a run can have (Chosen One). */
  favoredSlots?: number;
}

/** What earns an achievement. Checked after every fight and at the end of a run. */
export type AchievementCondition =
  /** Win a run, optionally on at least `minTier`, with at most `maxLives` left, or without losing a life. */
  /** …and, with `favoredLevel`, with a unit of one of the run's favored classes at that level or higher. */
  | { kind: 'completeRun'; minTier?: number; maxLives?: number; flawless?: boolean; favoredLevel?: number; distinctClasses?: number }
  | { kind: 'loseRun' }
  /** Finish a story (story mode, Milestone 14), optionally on at least `minTier` of its own ladder. */
  | { kind: 'completeStory'; story: string; minTier?: number }
  | { kind: 'winStreak'; count: number }
  | { kind: 'reachRound'; round: number }
  | { kind: 'reachLevel'; level: number }
  /** Win a fight with this many different base classes. */
  | { kind: 'winWithDistinctClasses'; count: number }
  /** Win a fight with this many units matching the filter. */
  | { kind: 'winWithUnits'; filter: UnitFilter; count: number }
  /** Win a fight with each of these base classes in the party, each at `minLevel` or higher. */
  | { kind: 'winWithClasses'; classIds: readonly string[]; minLevel?: number }
  /** Win a fight with at most this many of your units still standing (summons don't count). */
  | { kind: 'lastStanding'; survivors: number }
  /** Healing done in one fight; with `shields`, shielding counts too. */
  | { kind: 'healInFight'; amount: number; shields?: boolean }
  | { kind: 'activeSynergies'; count: number }
  /** Kill this many enemies in a single moment (one attack or ability and what it sets off). */
  | { kind: 'killsAtOnce'; count: number }
  /** Win a fight from this round on without any ally falling (summons don't count). */
  | { kind: 'flawlessWin'; minRound: number }
  /** Win a fight after this many allies fell. */
  | { kind: 'winAfterLosses'; allies: number }
  | { kind: 'winInTicks'; ticks: number }
  | { kind: 'summonsInFight'; count: number }
  /** Go into a fight with this much gold unspent. */
  | { kind: 'goldInHand'; gold: number }
  /** Go into this many fights in a row, each with at least `gold` unspent. */
  | { kind: 'goldStreak'; gold: number; rounds: number }
  /** Buy this many locked shop offers in one run. */
  | { kind: 'lockedBought'; count: number }
  /** Go into a fight with 5 units holding 2 items each. */
  | { kind: 'fullyEquipped' }
  /** Go into a fight with this many weapons equipped across the party. */
  | { kind: 'weaponsEquipped'; count: number }
  /** Reach this many different tertiary classes across all runs. */
  | { kind: 'tertiaryDiscovered'; count: number }
  /** Lifetime totals. */
  | { kind: 'runsCompleted'; count: number }
  | { kind: 'fightsWon'; count: number };

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  condition: AchievementCondition;
  /** Only counts in runs of this mode. */
  mode?: RunMode;
  reward: Unlocks;
}

/** Everything meta progression needs to know about the game's content. */
export interface MetaCatalog {
  /** Unlocked from the start; perkSlots is the base number of perks kept. */
  starter: Required<Unlocks>;
  achievements: readonly AchievementDef[];
  /** Every unlockable thing, in display order. */
  all: { classes: readonly string[]; items: readonly string[]; synergies: readonly string[]; perks: readonly string[]; rulesClasses?: readonly string[] };
  /** Rules-mode classes a new player starts with. */
  rulesStarter?: readonly string[];
  maxTier: number;
  maxPerkSlots: number;
  maxFavoredSlots: number;
  /** Extra perks offered beyond the number kept. */
  perkChoiceExtra: number;
}

export interface DailyRecord {
  /** YYYY-MM-DD. */
  date: string;
  wins: number;
  rounds: number;
  completed: boolean;
  /** The run has ended (one attempt per day). */
  done: boolean;
}

/** The player's saved meta progression. Plain JSON. */
export interface Profile {
  achievements: string[];
  /** Highest ladder tier the player may start (0 until a run is won). */
  maxTier: number;
  /** Tertiary classes the player has reached, for the Collection. */
  discovered: string[];
  stats: { runs: number; completed: number; fightsWon: number };
  daily: DailyRecord | null;
  /** Testing toggle: everything unlocked. Progress still tracks. Only offered in dev builds since 1.0. */
  unlockAll: boolean;
  /** Story mode (Milestone 14), by story id: the highest story tier unlocked and how often it was finished. Optional so older profiles load. */
  stories?: Record<string, StoryRecord>;
}

export interface StoryRecord {
  /** Highest tier of the story's own ladder the player may start (0 until it's finished once). */
  maxTier: number;
  completions: number;
}

/** What the player can use right now. */
export interface Unlocked {
  classes: string[];
  /** Rules-mode classes (post-1.0). */
  rulesClasses: string[];
  items: string[];
  synergies: string[];
  perks: string[];
  perkSlots: number;
  /** How many favored classes a run can pick. */
  favoredSlots: number;
  maxTier: number;
}

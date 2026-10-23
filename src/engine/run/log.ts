import type { Winner } from '../events.ts';
import type { RunError, RunSetup, RunState, ShopAction } from './types.ts';

/**
 * One line of a dev play log. Runs are deterministic, so a run's seed plus
 * its actions in order is enough to replay it exactly (see `npm run playlog`).
 * `run` identifies a run within the log; `at` is wall-clock time from the UI.
 */
export type PlayLogEntry =
  /** `setup` (M7): tier, perks and unlocked content; logs from before M7 omit it (tier 0, everything). */
  | { type: 'start'; run: string; at: string; seed: string; setup?: RunSetup }
  /** A saved run was reloaded (e.g. after a page refresh); replay continues from `state`. */
  | { type: 'resume'; run: string; at: string; state: RunState }
  | { type: 'action'; run: string; at: string; action: ShopAction; error?: RunError }
  | { type: 'fight'; run: string; at: string; round: number; winner: Winner };

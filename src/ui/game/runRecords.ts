// Pure helpers for what the UI remembers about runs: the saved run, per-unit
// run totals and the best run. Kept out of React so they can be tested.
import type { CombatResult } from '../../engine/index.ts';
import { boardUnits, effectiveClassId, type Board, type RunContext, type RunState } from '../../engine/run/index.ts';
import { isObject } from './storage.ts';

/** Per-unit totals across the run, keyed by unit uid. */
export interface UnitRunStats {
  name: string;
  classId: string;
  fights: number;
  dealt: number;
  taken: number;
  /** Healing plus shielding done. */
  healed: number;
  kills: number;
}

export type RunStats = Record<number, UnitRunStats>;

export interface BestRun {
  wins: number;
  rounds: number;
  completed: boolean;
}

export interface SavedRun {
  runId: string;
  run: RunState;
  stats: RunStats;
}

export const RUN_KEY = 'run';
export const BEST_KEY = 'best';

/** Shallow shape check of a saved run; every class on the board must still exist. */
export function savedRunValidator(ctx: RunContext) {
  return (x: unknown): x is SavedRun => {
    if (!isObject(x) || typeof x.runId !== 'string' || !isObject(x.stats) || !isObject(x.run)) return false;
    const run = x.run as Partial<RunState>;
    if (typeof run.seed !== 'string' || run.phase !== 'shop' || !isObject(run.board) || !Array.isArray(run.shop)) return false;
    try {
      return boardUnits(run.board as Board).every((u) => !!ctx.content.classes[u.classId]);
    } catch {
      return false;
    }
  };
}

export const isBestRun = (x: unknown): x is BestRun =>
  isObject(x) && typeof x.wins === 'number' && typeof x.rounds === 'number' && typeof x.completed === 'boolean';

/** More wins is better; at equal wins, fewer rounds. */
export function isBetterRun(a: BestRun, best: BestRun | null): boolean {
  return !best || a.wins > best.wins || (a.wins === best.wins && a.rounds < best.rounds);
}

/** Add one fight's per-unit summary to the run totals. Player combat ids follow board order. */
export function addFightStats(stats: RunStats, board: Board, combat: CombatResult): RunStats {
  const next = structuredClone(stats);
  (['front', 'back'] as const).forEach((row) =>
    board[row].forEach((u, col) => {
      if (!u) return;
      const s = combat.summary.find((x) => x.id === `p${row === 'front' ? col : 3 + col}`);
      if (!s) return;
      const t = next[u.uid] ?? { name: u.name, classId: u.classId, fights: 0, dealt: 0, taken: 0, healed: 0, kills: 0 };
      next[u.uid] = {
        name: u.name,
        classId: effectiveClassId(u),
        fights: t.fights + 1,
        dealt: t.dealt + s.damageDealt,
        taken: t.taken + s.damageTaken,
        healed: t.healed + s.healingDone + s.shieldingDone,
        kills: t.kills + s.kills,
      };
    }),
  );
  return next;
}

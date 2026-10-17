import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildRunContext } from '../../data/content.ts';
import type { CombatResult } from '../../engine/index.ts';
import {
  applyShopAction,
  boardUnits,
  createRun,
  effectiveClassId,
  fight as runFight,
  type Board,
  type IncomeBreakdown,
  type RunContext,
  type RunError,
  type RunState,
  type ShopAction,
} from '../../engine/run/index.ts';
import { logPlay, newRunId } from '../playlog.ts';
import { isObject, load, remove, save } from './storage.ts';

/** One finished fight, kept for playback and the result screen. */
export interface FightView {
  round: number;
  combat: CombatResult;
  /** The player's board as it fought (before XP and level-ups). */
  board: Board;
  enemy: Board;
  income: IncomeBreakdown | null;
  xp: number;
}

/** Per-unit totals across the run, keyed by unit uid. */
export interface UnitRunStats {
  name: string;
  classId: string;
  fights: number;
  dealt: number;
  taken: number;
  healed: number;
  kills: number;
}

export type RunStats = Record<number, UnitRunStats>;

export interface BestRun {
  wins: number;
  rounds: number;
  completed: boolean;
}

export type Screen = 'title' | 'shop' | 'combat' | 'summary';

interface SavedRun {
  runId: string;
  run: RunState;
  stats: RunStats;
}

const RUN_KEY = 'run';
const BEST_KEY = 'best';

/** Shallow shape check, plus every class on the board must still exist. */
function savedRunValidator(ctx: RunContext) {
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

const isBest = (x: unknown): x is BestRun => isObject(x) && typeof x.wins === 'number' && typeof x.rounds === 'number';

export const randomSeed = () => Math.random().toString(36).slice(2, 8);

function addFightStats(stats: RunStats, board: Board, combat: CombatResult): RunStats {
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

/** All game state and transitions for the UI. The engine does the work. */
export function useGame() {
  const ctx = useMemo(() => buildRunContext(), []);
  const [saved] = useState(() => load(RUN_KEY, savedRunValidator(ctx)));
  const [screen, setScreen] = useState<Screen>('title');
  const [runId, setRunId] = useState(() => saved?.runId ?? newRunId());
  const [run, setRun] = useState<RunState>(() => saved?.run ?? createRun(randomSeed(), ctx));
  const [stats, setStats] = useState<RunStats>(() => saved?.stats ?? {});
  const [lastFight, setLastFight] = useState<FightView | null>(null);
  const [error, setError] = useState<RunError | null>(null);
  const [best, setBest] = useState<BestRun | null>(() => load(BEST_KEY, isBest));
  const [canContinue, setCanContinue] = useState(saved !== null);

  // Save after every change while a run is in its shop phase.
  useEffect(() => {
    if (screen === 'title') return;
    if (run.phase === 'shop') save(RUN_KEY, { runId, run, stats } satisfies SavedRun);
    else remove(RUN_KEY);
  }, [screen, runId, run, stats]);

  const startRun = useCallback(
    (seed: string = randomSeed()) => {
      const id = newRunId();
      setRunId(id);
      setRun(createRun(seed, ctx));
      setStats({});
      setLastFight(null);
      setError(null);
      setScreen('shop');
      logPlay({ type: 'start', run: id, seed });
    },
    [ctx],
  );

  const continueRun = useCallback(() => {
    setScreen('shop');
    logPlay({ type: 'resume', run: runId, state: run });
  }, [runId, run]);

  const dispatch = useCallback(
    (action: ShopAction): boolean => {
      const r = applyShopAction(run, action, ctx);
      logPlay(r.ok ? { type: 'action', run: runId, action } : { type: 'action', run: runId, action, error: r.error });
      if (r.ok) {
        setRun(r.state);
        setError(null);
      } else {
        setError(r.error);
      }
      return r.ok;
    },
    [run, ctx, runId],
  );

  const fight = useCallback(() => {
    const r = runFight(run, ctx);
    if (!r.ok) return setError(r.error);
    logPlay({ type: 'fight', run: runId, round: run.round, winner: r.combat.winner });
    const { progression } = ctx.config;
    const xp = { player: progression.xpPerWin, enemy: progression.xpPerLoss, draw: progression.xpPerDraw }[r.combat.winner];
    setLastFight({ round: run.round, combat: r.combat, board: run.board, enemy: r.enemyBuilds, income: r.income, xp });
    setStats((s) => addFightStats(s, run.board, r.combat));
    setRun(r.state);
    setError(null);
    setScreen('combat');
    if (r.state.phase !== 'shop') {
      const result: BestRun = { wins: r.state.wins, rounds: r.state.history.length, completed: r.state.phase === 'complete' };
      const better = !best || result.wins > best.wins || (result.wins === best.wins && result.rounds < best.rounds);
      if (better) {
        setBest(result);
        save(BEST_KEY, result);
      }
      setCanContinue(false);
    }
  }, [run, ctx, runId, best]);

  /** Leave the combat screen: back to the shop, or to the summary if the run ended. */
  const finishCombat = useCallback(() => setScreen(run.phase === 'shop' ? 'shop' : 'summary'), [run.phase]);

  const toTitle = useCallback(() => {
    setCanContinue(run.phase === 'shop' && (run.history.length > 0 || boardUnits(run.board).length > 0));
    setScreen('title');
  }, [run]);

  return {
    ctx,
    screen,
    run,
    stats,
    lastFight,
    error,
    clearError: () => setError(null),
    best,
    canContinue,
    startRun,
    continueRun,
    dispatch,
    fight,
    finishCombat,
    toTitle,
  };
}

export type Game = ReturnType<typeof useGame>;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildRunContext } from '../../data/content.ts';
import { META_CATALOG } from '../../data/meta/catalog.ts';
import type { CombatResult } from '../../engine/index.ts';
import {
  dailyRun,
  newProfile,
  recordDiscovery,
  recordFight,
  recordRunEnd,
  unlockedContent,
  type AchievementDef,
  type MetaUpdate,
  type Profile,
} from '../../engine/meta/index.ts';
import {
  applyShopAction,
  boardUnits,
  createRun,
  fight as runFight,
  runContext,
  type Board,
  type IncomeBreakdown,
  type RunError,
  type RunSetup,
  type RunState,
  type ShopAction,
} from '../../engine/run/index.ts';
import { logPlay, newRunId } from '../playlog.ts';
import { levelUps, mergeLevelUps, type LevelUp } from './levelUps.ts';
import { loadProfile, saveProfile, todayString } from './profileStore.ts';
import {
  addFightStats,
  BEST_KEY,
  isBestRun,
  isBetterRun,
  RUN_KEY,
  savedRunValidator,
  type BestRun,
  type RunStats,
  type SavedRun,
} from './runRecords.ts';
import { load, remove, save } from './storage.ts';

/** One finished fight, kept for playback and the result screen. */
export interface FightView {
  round: number;
  combat: CombatResult;
  /** The player's board as it fought (before XP and level-ups). */
  board: Board;
  enemy: Board;
  income: IncomeBreakdown | null;
  xp: number;
  levelUps: LevelUp[];
}

export type Screen = 'title' | 'setup' | 'collection' | 'shop' | 'combat' | 'summary';

export const randomSeed = () => Math.random().toString(36).slice(2, 8);

/** All game state and transitions for the UI. The engine does the work. */
export function useGame() {
  const baseCtx = useMemo(() => buildRunContext(), []);
  const [saved] = useState(() => load(RUN_KEY, savedRunValidator(baseCtx)));
  const [screen, setScreen] = useState<Screen>('title');
  const [runId, setRunId] = useState(() => saved?.runId ?? newRunId());
  const [run, setRun] = useState<RunState>(() => saved?.run ?? createRun(randomSeed(), baseCtx));
  const [stats, setStats] = useState<RunStats>(() => saved?.stats ?? {});
  const [lastFight, setLastFight] = useState<FightView | null>(null);
  const [error, setError] = useState<RunError | null>(null);
  /** Recent level-ups (this round's fight and any training since), for showing stat gains. */
  const [recentLevelUps, setRecentLevelUps] = useState<LevelUp[]>([]);
  const [best, setBest] = useState<BestRun | null>(() => load(BEST_KEY, isBestRun));
  const [canContinue, setCanContinue] = useState(saved !== null);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  /** Achievements earned and not yet dismissed (toasts). */
  const [toasts, setToasts] = useState<AchievementDef[]>([]);
  /** Achievements earned during the current run, for its summary. */
  const [runEarned, setRunEarned] = useState<AchievementDef[]>([]);
  /** A ladder tier the run that just ended unlocked, if any. */
  const [tierUnlocked, setTierUnlocked] = useState<number | null>(null);
  /** The setup screen's mode: a normal run or today's daily. */
  const [setupDaily, setSetupDaily] = useState(false);

  /** The current run's effective rules (its tier, perks and unlocked content applied). */
  const ctx = useMemo(() => runContext(run.setup, baseCtx), [run.setup, baseCtx]);
  const unlocked = useMemo(() => unlockedContent(profile, META_CATALOG), [profile]);
  const today = todayString();
  const daily = useMemo(() => dailyRun(today, META_CATALOG), [today]);

  // Save after every change while a run is in its shop phase.
  useEffect(() => {
    if (screen === 'title' || screen === 'setup' || screen === 'collection') return;
    if (run.phase === 'shop') save(RUN_KEY, { runId, run, stats } satisfies SavedRun);
    else remove(RUN_KEY);
  }, [screen, runId, run, stats]);

  const applyMeta = useCallback((update: MetaUpdate) => {
    saveProfile(update.profile);
    setProfile(update.profile);
    if (update.earned.length > 0) {
      setToasts((t) => [...t, ...update.earned]);
      setRunEarned((e) => [...e, ...update.earned]);
    }
  }, []);

  const startRun = useCallback(
    (seed: string, setup: RunSetup) => {
      const id = newRunId();
      setRunId(id);
      setRun(createRun(seed, baseCtx, setup));
      setStats({});
      setLastFight(null);
      setRecentLevelUps([]);
      setRunEarned([]);
      setTierUnlocked(null);
      setError(null);
      setScreen('shop');
      logPlay({ type: 'start', run: id, seed, setup });
      if (setup.daily) {
        // One attempt per day: the daily counts as used as soon as it starts.
        const next: Profile = { ...profile, daily: { date: setup.daily, wins: 0, rounds: 0, completed: false, done: false } };
        saveProfile(next);
        setProfile(next);
      }
    },
    [baseCtx, profile],
  );

  /** Open the run setup screen (tier and perks), for a normal run or today's daily. */
  const openSetup = useCallback((isDaily = false) => {
    setSetupDaily(isDaily);
    setScreen('setup');
  }, []);

  const continueRun = useCallback(() => {
    setScreen('shop');
    logPlay({ type: 'resume', run: runId, state: run });
  }, [runId, run]);

  const dispatch = useCallback(
    (action: ShopAction): boolean => {
      const r = applyShopAction(run, action, baseCtx);
      logPlay(r.ok ? { type: 'action', run: runId, action } : { type: 'action', run: runId, action, error: r.error });
      if (r.ok) {
        const gained = levelUps(run.board, r.state.board, ctx.config.progression);
        if (gained.length > 0) setRecentLevelUps((l) => mergeLevelUps(l, gained));
        setRun(r.state);
        setError(null);
        if (action.type === 'choose') applyMeta(recordDiscovery(profile, r.state, META_CATALOG));
      } else {
        setError(r.error);
      }
      return r.ok;
    },
    [run, baseCtx, ctx, runId, profile, applyMeta],
  );

  const fight = useCallback(() => {
    const r = runFight(run, baseCtx);
    if (!r.ok) return setError(r.error);
    logPlay({ type: 'fight', run: runId, round: run.round, winner: r.combat.winner });
    const { progression } = ctx.config;
    const xp = { player: progression.xpPerWin, enemy: progression.xpPerLoss, draw: progression.xpPerDraw }[r.combat.winner];
    const gained = levelUps(run.board, r.state.board, progression);
    setLastFight({ round: run.round, combat: r.combat, board: run.board, enemy: r.enemyBuilds, income: r.income, xp, levelUps: gained });
    setRecentLevelUps(gained);
    setStats((s) => addFightStats(s, run.board, r.combat));
    setRun(r.state);
    setError(null);
    setScreen('combat');

    let meta = recordFight(profile, { before: run, after: r.state, combat: r.combat }, baseCtx, META_CATALOG);
    if (r.state.phase !== 'shop') {
      const end = recordRunEnd(meta.profile, r.state, META_CATALOG);
      if (end.profile.maxTier > meta.profile.maxTier) setTierUnlocked(end.profile.maxTier);
      meta = { profile: end.profile, earned: [...meta.earned, ...end.earned] };
      const result: BestRun = { wins: r.state.wins, rounds: r.state.history.length, completed: r.state.phase === 'complete' };
      if (isBetterRun(result, best)) {
        setBest(result);
        save(BEST_KEY, result);
      }
      setCanContinue(false);
    }
    applyMeta(meta);
  }, [run, baseCtx, ctx, runId, best, profile, applyMeta]);

  /** Leave the combat screen: back to the shop, or to the summary if the run ended. */
  const finishCombat = useCallback(() => setScreen(run.phase === 'shop' ? 'shop' : 'summary'), [run.phase]);

  const toTitle = useCallback(() => {
    setCanContinue(run.phase === 'shop' && (run.history.length > 0 || boardUnits(run.board).length > 0));
    setScreen('title');
  }, [run]);

  const setUnlockAll = useCallback(
    (on: boolean) => {
      const next = { ...profile, unlockAll: on };
      saveProfile(next);
      setProfile(next);
    },
    [profile],
  );

  /** Start progress over (achievements, ladder, discoveries), keeping the unlock-all setting and today's daily attempt. */
  const resetProgress = useCallback(() => {
    const next: Profile = { ...newProfile(), unlockAll: profile.unlockAll, daily: profile.daily };
    saveProfile(next);
    setProfile(next);
  }, [profile]);

  return {
    /** The current run's effective context. */
    ctx,
    baseCtx,
    screen,
    run,
    stats,
    lastFight,
    recentLevelUps,
    error,
    clearError: () => setError(null),
    best,
    canContinue,
    profile,
    unlocked,
    daily,
    today,
    /** Today's daily was already started (one attempt per day). */
    dailyUsed: profile.daily?.date === today,
    setupDaily,
    toasts,
    dismissToast: () => setToasts((t) => t.slice(1)),
    runEarned,
    tierUnlocked,
    startRun,
    openSetup,
    openCollection: () => setScreen('collection'),
    continueRun,
    dispatch,
    fight,
    finishCombat,
    toTitle,
    setUnlockAll,
    resetProgress,
  };
}

export type Game = ReturnType<typeof useGame>;

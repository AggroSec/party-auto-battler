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
  recordStoryEnd,
  storyMaxTier,
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
import { createStoryRun } from '../../engine/story/story.ts';
import { STORIES, storySetup } from '../../data/stories/index.ts';
import { play } from '../audio/sfx.ts';
import type { SoundId } from '../audio/sounds.ts';
import { DEV_TOOLS } from '../devTools.ts';
import { logPlay, newRunId } from '../playlog.ts';
import { levelUps, mergeLevelUps, type LevelUp } from './levelUps.ts';
import { loadProfile, saveProfile, todayString } from './profileStore.ts';
import {
  addFightStats,
  BEST_KEY,
  isBestRun,
  isBetterRun,
  RUN_KEY,
  STORY_KEY,
  migrateSavedRun,
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
  /** Story fights: gold won, and whether running out of lives restarted the mission. */
  story?: { gold: number; restarted: boolean };
}

export type Screen = 'title' | 'setup' | 'storySetup' | 'collection' | 'credits' | 'guide' | 'shop' | 'combat' | 'summary';

/** What each successful shop action sounds like (a level-up overrides it). */
const ACTION_SOUND: Record<ShopAction['type'], SoundId | null> = {
  buy: 'buy',
  sell: 'sell',
  sellItem: 'sell',
  reroll: 'reroll',
  lock: 'lock',
  choose: 'choose',
  allocate: 'choose',
  setRules: null,
  move: null,
  moveItem: null,
  travel: 'choose',
  storyChoice: 'choose',
  scene: null,
};

export const randomSeed = () => Math.random().toString(36).slice(2, 8);

/** All game state and transitions for the UI. The engine does the work. */
export function useGame() {
  const baseCtx = useMemo(() => buildRunContext(), []);
  const [saved] = useState(() => {
    const run = load(RUN_KEY, savedRunValidator(baseCtx));
    return run && migrateSavedRun(run);
  });
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
  const [savedStory, setSavedStory] = useState(() => load(STORY_KEY, savedRunValidator(baseCtx)));
  /** A story run that just ended unlocked this story tier, if any. */
  const [storyTierUnlocked, setStoryTierUnlocked] = useState<number | null>(null);
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
  // Unlock everything is a dev-only testing toggle: a saved profile that has it on is ignored in release builds.
  const unlocked = useMemo(() => unlockedContent(DEV_TOOLS ? profile : { ...profile, unlockAll: false }, META_CATALOG), [profile]);
  const today = todayString();
  const daily = useMemo(() => dailyRun(today, META_CATALOG), [today]);

  // Save after every change while a run is in its shop phase. A story keeps its own save, beside a normal run's.
  useEffect(() => {
    if (screen === 'title' || screen === 'setup' || screen === 'storySetup' || screen === 'collection' || screen === 'credits' || screen === 'guide') return;
    const key = run.story ? STORY_KEY : RUN_KEY;
    if (run.phase === 'shop') save(key, { runId, run, stats } satisfies SavedRun);
    else remove(key);
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

  /** Pick up the saved normal run (or, with `story`, the saved story) where it was left. */
  const resume = useCallback(
    (story: boolean) => {
      const stored = story ? load(STORY_KEY, savedRunValidator(baseCtx)) : load(RUN_KEY, savedRunValidator(baseCtx));
      const next = stored ? migrateSavedRun(stored) : null;
      if (next) {
        setRunId(next.runId);
        setRun(next.run);
        setStats(next.stats);
        setLastFight(null);
        setRecentLevelUps([]);
        setRunEarned([]);
        setTierUnlocked(null);
        setStoryTierUnlocked(null);
        setError(null);
      }
      setScreen('shop');
      const current = next ?? { runId, run };
      logPlay({ type: 'resume', run: current.runId, state: current.run });
    },
    [baseCtx, runId, run],
  );
  const continueRun = useCallback(() => resume(false), [resume]);
  const continueStory = useCallback(() => resume(true), [resume]);

  /** Start a story on one of its tiers (Milestone 14). */
  const startStory = useCallback(
    (storyId: string, tier: number) => {
      const story = STORIES[storyId];
      if (!story) return;
      const max = storyMaxTier(profile, storyId, story.tiers.length);
      // A story's own synergy (Strength of the Tribe) is always on in it: it's the story's point.
      const setup = storySetup(storyId, Math.min(tier, max), unlocked, [...new Set([...unlocked.synergies, 'strength-of-the-tribe'])]);
      const seed = randomSeed();
      const id = newRunId();
      setRunId(id);
      setRun(createStoryRun(seed, baseCtx, setup));
      setStats({});
      setLastFight(null);
      setRecentLevelUps([]);
      setRunEarned([]);
      setTierUnlocked(null);
      setStoryTierUnlocked(null);
      setError(null);
      setSavedStory(null);
      setScreen('shop');
      logPlay({ type: 'start', run: id, seed, setup });
    },
    [baseCtx, profile, unlocked],
  );

  const dispatch = useCallback(
    (action: ShopAction): boolean => {
      const r = applyShopAction(run, action, baseCtx);
      logPlay(r.ok ? { type: 'action', run: runId, action } : { type: 'action', run: runId, action, error: r.error });
      if (r.ok) {
        const gained = levelUps(run.board, r.state.board, ctx.config.progression);
        play(gained.length > 0 ? 'levelUp' : ACTION_SOUND[action.type]);
        if (gained.length > 0) setRecentLevelUps((l) => mergeLevelUps(l, gained));
        setRun(r.state);
        setError(null);
        if (action.type === 'choose') applyMeta(recordDiscovery(profile, r.state, META_CATALOG));
      } else {
        play('error');
        setError(r.error);
      }
      return r.ok;
    },
    [run, baseCtx, ctx, runId, profile, applyMeta],
  );

  const fight = useCallback(() => {
    const r = runFight(run, baseCtx);
    if (!r.ok) {
      play('error');
      return setError(r.error);
    }
    play('fight');
    logPlay({ type: 'fight', run: runId, round: run.round, winner: r.combat.winner });
    const { progression } = ctx.config;
    const restarted = !!run.story && r.state.story!.restarts > run.story.restarts;
    const xp = run.story
      ? restarted
        ? 0
        : boardUnits(r.state.board).reduce((m, u) => Math.max(m, u.xp - (boardUnits(run.board).find((b) => b.uid === u.uid)?.xp ?? u.xp)), 0)
      : { player: progression.xpPerWin, enemy: progression.xpPerLoss, draw: progression.xpPerDraw }[r.combat.winner];
    const gained = restarted ? [] : levelUps(run.board, r.state.board, progression);
    const story = run.story ? { gold: restarted ? 0 : r.state.gold - run.gold, restarted } : undefined;
    setLastFight({ round: run.round, combat: r.combat, board: run.board, enemy: r.enemyBuilds, income: r.income, xp, levelUps: gained, ...(story ? { story } : {}) });
    setRecentLevelUps(gained);
    setStats((s) => addFightStats(s, run.board, r.combat));
    setRun(r.state);
    setError(null);
    setScreen('combat');

    if (run.story) {
      // Stories keep their own record (Milestone 14): only finishing one counts.
      let meta: MetaUpdate = recordDiscovery(profile, r.state, META_CATALOG);
      if (r.state.phase === 'complete') {
        const tiers = STORIES[run.story.storyId]?.tiers.length ?? 0;
        const before = storyMaxTier(meta.profile, run.story.storyId, tiers);
        const end = recordStoryEnd(meta.profile, r.state, tiers, META_CATALOG);
        const after = storyMaxTier(end.profile, run.story.storyId, tiers);
        if (after > before) setStoryTierUnlocked(after);
        meta = { profile: end.profile, earned: [...meta.earned, ...end.earned] };
        setSavedStory(null);
      }
      applyMeta(meta);
      return;
    }

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
    if (run.story) setSavedStory(run.phase === 'shop' ? { runId, run, stats } : null);
    else setCanContinue(run.phase === 'shop' && (run.history.length > 0 || boardUnits(run.board).length > 0));
    setScreen('title');
  }, [run, runId, stats]);

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
    openCredits: () => setScreen('credits'),
    openGuide: () => setScreen('guide'),
    continueRun,
    /** The saved story run, if any (Milestone 14). */
    savedStory,
    storyTierUnlocked,
    continueStory,
    startStory,
    openStorySetup: () => setScreen('storySetup'),
    dispatch,
    fight,
    finishCombat,
    toTitle,
    setUnlockAll,
    resetProgress,
  };
}

export type Game = ReturnType<typeof useGame>;

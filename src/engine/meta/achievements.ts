// Achievement checks (M7). Pure: given the profile and what just happened,
// return the updated profile and any newly earned achievements.
import type { CombatResult } from '../events.ts';
import { activeSynergies, boardUnits, matchesFilter } from '../run/build.ts';
import { runContext } from '../run/setup.ts';
import type { RunContext, RunState } from '../run/types.ts';
import type { AchievementCondition, AchievementDef, MetaCatalog, Profile } from './types.ts';

/** A finished fight: the shop state that fought, the state after, and the combat. */
export interface FightInfo {
  before: RunState;
  after: RunState;
  combat: CombatResult;
}

export interface MetaUpdate {
  profile: Profile;
  earned: AchievementDef[];
}

const isPlayer = (id: string) => id.startsWith('p');
/** Summoned units' ids carry an "s" ("ps0"); board units are "p0".."p4". */
const isSummon = (id: string) => id.length > 1 && id[1] === 's';

/** Most enemies killed in one moment (same tick, same killer). */
function maxKillsAtOnce(combat: CombatResult): number {
  const counts = new Map<string, number>();
  for (const e of combat.events) {
    if (e.type !== 'death' || isPlayer(e.target) || !isPlayer(e.source)) continue;
    const key = `${e.tick}:${e.source}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

function alliesFallen(combat: CombatResult): number {
  return combat.events.filter((e) => e.type === 'death' && isPlayer(e.target) && !isSummon(e.target)).length;
}

function fightMet(cond: AchievementCondition, info: FightInfo, ctx: RunContext): boolean {
  const { before, after, combat } = info;
  const won = combat.winner === 'player';
  const units = boardUnits(before.board);
  switch (cond.kind) {
    case 'winStreak':
      return after.winStreak >= cond.count;
    case 'reachRound':
      return before.round >= cond.round;
    case 'reachLevel':
      return boardUnits(after.board).some((u) => u.level >= cond.level);
    case 'winWithDistinctClasses':
      return won && new Set(units.map((u) => u.classId)).size >= cond.count;
    case 'winWithUnits':
      return won && units.filter((u) => matchesFilter(u, cond.filter, ctx.content)).length >= cond.count;
    case 'winWithClasses':
      return won && cond.classIds.every((id) => units.some((u) => u.classId === id && u.level >= (cond.minLevel ?? 1)));
    case 'lastStanding':
      return won && combat.summary.filter((s) => s.side === 'player' && s.survived && !s.summonedBy).length <= cond.survivors;
    case 'healInFight':
      return combat.summary.filter((s) => s.side === 'player').reduce((sum, s) => sum + s.healingDone + (cond.shields ? s.shieldingDone : 0), 0) >= cond.amount;
    case 'activeSynergies':
      return activeSynergies(units, ctx.content).length >= cond.count;
    case 'killsAtOnce':
      return maxKillsAtOnce(combat) >= cond.count;
    case 'flawlessWin':
      return won && before.round >= cond.minRound && alliesFallen(combat) === 0;
    case 'winAfterLosses':
      return won && alliesFallen(combat) >= cond.allies;
    case 'winInTicks':
      return won && combat.ticks <= cond.ticks;
    case 'summonsInFight':
      return combat.events.filter((e) => e.type === 'summon' && isPlayer(e.source)).length >= cond.count;
    case 'goldInHand':
      return before.gold >= cond.gold;
    case 'goldStreak': {
      const last = after.history.slice(-cond.rounds);
      return last.length === cond.rounds && last.every((r) => (r.gold ?? 0) >= cond.gold);
    }
    case 'lockedBought':
      return (before.lockedBought ?? 0) >= cond.count;
    case 'fullyEquipped':
      return units.length >= 5 && units.every((u) => u.items.length >= ctx.config.progression.maxItemsPerUnit);
    default:
      return false;
  }
}

function lifetimeMet(cond: AchievementCondition, profile: Profile): boolean {
  switch (cond.kind) {
    case 'tertiaryDiscovered':
      return profile.discovered.length >= cond.count;
    case 'runsCompleted':
      return profile.stats.completed >= cond.count;
    case 'fightsWon':
      return profile.stats.fightsWon >= cond.count;
    default:
      return false;
  }
}

function runEndMet(cond: AchievementCondition, state: RunState): boolean {
  const complete = state.phase === 'complete';
  switch (cond.kind) {
    case 'completeRun':
      return (
        complete &&
        state.setup.tier >= (cond.minTier ?? 0) &&
        state.lives <= (cond.maxLives ?? Infinity) &&
        (!cond.flawless || state.losses === 0)
      );
    case 'loseRun':
      return state.phase === 'defeated';
    default:
      return false;
  }
}

function award(profile: Profile, catalog: MetaCatalog, met: (a: AchievementDef) => boolean): AchievementDef[] {
  const earned = catalog.achievements.filter((a) => !profile.achievements.includes(a.id) && met(a));
  profile.achievements.push(...earned.map((a) => a.id));
  return earned;
}

/** After a fight: lifetime stats, discovered tertiary classes and fight achievements. */
export function recordFight(profile: Profile, info: FightInfo, base: RunContext, catalog: MetaCatalog): MetaUpdate {
  // Brandon (post-M7): daily runs have everything unlocked, so they never count toward progress.
  if (info.before.setup.daily) return { profile, earned: [] };
  const next = structuredClone(profile);
  const ctx = runContext(info.before.setup, base);
  if (info.combat.winner === 'player') next.stats.fightsWon += 1;
  for (const u of boardUnits(info.after.board)) {
    if (u.tertiaryClassId && !next.discovered.includes(u.tertiaryClassId)) next.discovered.push(u.tertiaryClassId);
  }
  const earned = award(next, catalog, (a) => fightMet(a.condition, info, ctx) || lifetimeMet(a.condition, next));
  return { profile: next, earned };
}

/** Note a tertiary class reached mid-shop (the Collection marks it discovered at once). */
export function recordDiscovery(profile: Profile, state: RunState, catalog: MetaCatalog): MetaUpdate {
  if (state.setup.daily) return { profile, earned: [] };
  const fresh = boardUnits(state.board).flatMap((u) => (u.tertiaryClassId && !profile.discovered.includes(u.tertiaryClassId) ? [u.tertiaryClassId] : []));
  if (fresh.length === 0) return { profile, earned: [] };
  const next = structuredClone(profile);
  next.discovered.push(...new Set(fresh));
  return { profile: next, earned: award(next, catalog, (a) => lifetimeMet(a.condition, next)) };
}

/** After a run ends: totals, the next ladder tier, the daily record and run achievements. */
export function recordRunEnd(profile: Profile, state: RunState, catalog: MetaCatalog): MetaUpdate {
  const next = structuredClone(profile);
  const complete = state.phase === 'complete';
  if (state.setup.daily) {
    // The daily keeps its own record and nothing else (see recordFight).
    next.daily = { date: state.setup.daily, wins: state.wins, rounds: state.history.length, completed: complete, done: true };
    return { profile: next, earned: [] };
  }
  next.stats.runs += 1;
  if (complete) next.stats.completed += 1;
  if (complete && state.setup.tier >= next.maxTier) {
    next.maxTier = Math.min(catalog.maxTier, state.setup.tier + 1);
  }
  const earned = award(next, catalog, (a) => runEndMet(a.condition, state) || lifetimeMet(a.condition, next));
  return { profile: next, earned };
}

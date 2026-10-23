// Full-run simulation: bots play complete runs; we tally how often fights are
// won when each class, advanced class, item, talent and synergy is present.
import { DEFAULT_TICK_CAP, Rng } from '../engine/index.ts';
import { activeSynergies, boardUnits, createRun, defaultSetup, fight, runContext, type RunContext, type RunSetup } from '../engine/run/index.ts';
import { resolvePending, type Bot } from './bots.ts';

/** Safety net: a run can't need more fights than wins + lives (+ draws). */
const MAX_ROUNDS = 40;

export type EntityKind = 'class' | 'advanced' | 'tertiary' | 'item' | 'talent' | 'synergy';

export interface Tally {
  fights: number;
  /** Wins, with draws counted as half. */
  score: number;
}

export interface BotRunReport {
  bot: string;
  runs: number;
  completionRate: number;
  avgWins: number;
  /** Average number of rounds played (the brief's "average round reached"). */
  avgRounds: number;
  drawRate: number;
  fightWinRate: number;
  tickCapHits: number;
  winsHistogram: number[];
  winRateByRound: { round: number; fights: number; winRate: number }[];
  avgUnspentGold: number;
  avgLevel: number;
  stuckRuns: number;
  /** Per-entity tallies by round, keyed `${kind}:${id}`. */
  entities: Map<string, Map<number, Tally>>;
  /** All fights by round (for round-adjusted lift). */
  rounds: Map<number, Tally>;
}

function bump<K>(map: Map<K, Tally>, key: K, score: number, fights = 1): void {
  const t = map.get(key) ?? { fights: 0, score: 0 };
  map.set(key, { fights: t.fights + fights, score: t.score + score });
}

function bumpByRound(map: Map<string, Map<number, Tally>>, key: string, round: number, score: number): void {
  let inner = map.get(key);
  if (!inner) map.set(key, (inner = new Map()));
  bump(inner, round, score);
}

/** Play `runs` full runs with one bot. `setup` picks the ladder tier and perks (default: tier 0, everything unlocked). */
export function runBot(bot: Bot, baseCtx: RunContext, runs: number, seed: string, setup: RunSetup = defaultSetup(baseCtx)): BotRunReport {
  const ctx = runContext(setup, baseCtx);
  const botRng = new Rng(`${seed}:${bot.name}`);
  const hist = Array<number>(ctx.config.winsToComplete + 1).fill(0);
  const byRound = new Map<number, Tally>();
  const entities = new Map<string, Map<number, Tally>>();
  let completed = 0, winsSum = 0, roundsSum = 0, fights = 0, draws = 0, wins = 0;
  let unspent = 0, stuck = 0, tickCap = 0, levelSum = 0, unitSamples = 0;

  for (let i = 0; i < runs; i++) {
    let state = createRun(`${seed}:run${i}`, ctx, setup);
    let rounds = 0;
    while (state.phase === 'shop' && rounds < MAX_ROUNDS) {
      let shopped = resolvePending(bot, state, ctx, botRng);
      shopped = resolvePending(bot, bot.shop(shopped, ctx, botRng), ctx, botRng);
      if (bot.allocate) shopped = bot.allocate(shopped, ctx, botRng);
      const r = fight(shopped, ctx);
      if (!r.ok) {
        stuck++;
        break;
      }
      rounds++;
      fights++;
      unspent += shopped.gold;
      if (r.combat.ticks >= DEFAULT_TICK_CAP) tickCap++;
      const score = r.combat.winner === 'player' ? 1 : r.combat.winner === 'draw' ? 0.5 : 0;
      if (r.combat.winner === 'draw') draws++;
      wins += score;
      bump(byRound, shopped.round, score);

      const units = boardUnits(shopped.board);
      const present = new Set<string>();
      for (const u of units) {
        levelSum += u.level;
        unitSamples++;
        present.add(`class:${u.classId}`);
        if (u.advancedClassId) present.add(`advanced:${u.advancedClassId}`);
        if (u.tertiaryClassId) present.add(`tertiary:${u.tertiaryClassId}`);
        for (const it of u.items) present.add(`item:${it}`);
        for (const t of u.talents) present.add(`talent:${t}`);
      }
      for (const a of activeSynergies(units, ctx.content)) present.add(`synergy:${a.synergy.id}#${a.tier + 1}`);
      for (const key of present) bumpByRound(entities, key, shopped.round, score);
      state = r.state;
    }
    if (state.phase === 'complete') completed++;
    winsSum += state.wins;
    roundsSum += rounds;
    hist[Math.min(state.wins, hist.length - 1)]! += 1;
  }

  return {
    bot: bot.name,
    runs,
    completionRate: completed / runs,
    avgWins: winsSum / runs,
    avgRounds: roundsSum / runs,
    drawRate: fights ? draws / fights : 0,
    fightWinRate: fights ? wins / fights : 0,
    tickCapHits: tickCap,
    winsHistogram: hist,
    winRateByRound: [...byRound.entries()]
      .map(([round, t]) => ({ round, fights: t.fights, winRate: t.score / t.fights }))
      .sort((a, b) => a.round - b.round),
    rounds: byRound,
    avgUnspentGold: fights ? unspent / fights : 0,
    avgLevel: unitSamples ? levelSum / unitSamples : 0,
    stuckRuns: stuck,
    entities,
  };
}

export interface EntityStat extends Tally {
  /**
   * Round-adjusted lift: average of (result − that round's overall win rate)
   * across the entity's fights. Removes the bias from entities that only
   * appear in later, harder rounds. +0.05 = wins 5 points more than usual.
   */
  lift: number;
}

/** Merge tallies across bots and compute raw and round-adjusted rates. */
export function mergeEntities(reports: BotRunReport[]): Map<string, EntityStat> {
  const rounds = new Map<number, Tally>();
  for (const r of reports) for (const [round, t] of r.rounds) bump(rounds, round, t.score, t.fights);
  const base = (round: number) => {
    const t = rounds.get(round);
    return t ? t.score / t.fights : 0;
  };

  const merged = new Map<string, EntityStat>();
  for (const r of reports) {
    for (const [key, byRound] of r.entities) {
      const m = merged.get(key) ?? { fights: 0, score: 0, lift: 0 };
      for (const [round, t] of byRound) {
        m.fights += t.fights;
        m.score += t.score;
        m.lift += t.score - t.fights * base(round); // summed for now
      }
      merged.set(key, m);
    }
  }
  for (const m of merged.values()) m.lift = m.fights ? m.lift / m.fights : 0;
  return merged;
}

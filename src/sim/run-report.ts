// Full-run simulation: bots play complete runs; we tally how often fights are
// won when each class, advanced class, item, talent and synergy is present.
import { DEFAULT_TICK_CAP, Rng } from '../engine/index.ts';
import { activeSynergies, boardUnits, createRun, fight, type RunContext } from '../engine/run/index.ts';
import { resolvePending, type Bot } from './bots.ts';

/** Safety net: a run can't need more fights than wins + lives (+ draws). */
const MAX_ROUNDS = 40;

export type EntityKind = 'class' | 'advanced' | 'item' | 'talent' | 'synergy';

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
  /** Per-entity tallies, keyed `${kind}:${id}`. */
  entities: Map<string, Tally>;
}

function bump(map: Map<string, Tally>, key: string, score: number): void {
  const t = map.get(key) ?? { fights: 0, score: 0 };
  map.set(key, { fights: t.fights + 1, score: t.score + score });
}

export function runBot(bot: Bot, ctx: RunContext, runs: number, seed: string): BotRunReport {
  const botRng = new Rng(`${seed}:${bot.name}`);
  const hist = Array<number>(ctx.config.winsToComplete + 1).fill(0);
  const byRound = new Map<string, Tally>();
  const entities = new Map<string, Tally>();
  let completed = 0, winsSum = 0, roundsSum = 0, fights = 0, draws = 0, wins = 0;
  let unspent = 0, stuck = 0, tickCap = 0, levelSum = 0, unitSamples = 0;

  for (let i = 0; i < runs; i++) {
    let state = createRun(`${seed}:run${i}`, ctx);
    let rounds = 0;
    while (state.phase === 'shop' && rounds < MAX_ROUNDS) {
      let shopped = resolvePending(bot, state, ctx, botRng);
      shopped = resolvePending(bot, bot.shop(shopped, ctx, botRng), ctx, botRng);
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
      bump(byRound, String(shopped.round), score);

      const units = boardUnits(shopped.board);
      const present = new Set<string>();
      for (const u of units) {
        levelSum += u.level;
        unitSamples++;
        present.add(`class:${u.classId}`);
        if (u.advancedClassId) present.add(`advanced:${u.advancedClassId}`);
        for (const it of u.items) present.add(`item:${it}`);
        for (const t of u.talents) present.add(`talent:${t}`);
      }
      for (const a of activeSynergies(units, ctx.content)) present.add(`synergy:${a.synergy.id}#${a.tier + 1}`);
      for (const key of present) bump(entities, key, score);
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
      .map(([round, t]) => ({ round: Number(round), fights: t.fights, winRate: t.score / t.fights }))
      .sort((a, b) => a.round - b.round),
    avgUnspentGold: fights ? unspent / fights : 0,
    avgLevel: unitSamples ? levelSum / unitSamples : 0,
    stuckRuns: stuck,
    entities,
  };
}

/** Merge entity tallies across bots. */
export function mergeEntities(reports: BotRunReport[]): Map<string, Tally> {
  const merged = new Map<string, Tally>();
  for (const r of reports) {
    for (const [k, t] of r.entities) {
      const m = merged.get(k) ?? { fights: 0, score: 0 };
      merged.set(k, { fights: m.fights + t.fights, score: m.score + t.score });
    }
  }
  return merged;
}

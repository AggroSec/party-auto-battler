// Full-run simulation: bots play complete runs; report difficulty and economy.
import { CLASSES } from '../data/classes.ts';
import { Rng } from '../engine/index.ts';
import { createRun, fight, type RunContext } from '../engine/run/index.ts';
import type { Bot } from './bots.ts';

/** Safety net: a run can't need more fights than wins + lives (+ draws). */
const MAX_ROUNDS = 40;

export interface BotRunReport {
  bot: string;
  runs: number;
  completionRate: number;
  avgWins: number;
  avgRounds: number;
  drawRate: number;
  /** winsHistogram[n] = runs that ended with n wins. */
  winsHistogram: number[];
  /** Share of fights won, by round number. */
  winRateByRound: { round: number; fights: number; winRate: number }[];
  /** Average gold left unspent when entering combat. */
  avgUnspentGold: number;
  /** Fight win rate when the class was on the board (draws count half). */
  byClass: { classId: string; fights: number; winRate: number }[];
  stuckRuns: number;
}

export function runBot(bot: Bot, ctx: RunContext, runs: number, seed: string): BotRunReport {
  const botRng = new Rng(`${seed}:${bot.name}`);
  const hist = Array<number>(ctx.config.winsToComplete + 1).fill(0);
  const byRound = new Map<number, { n: number; w: number }>();
  const byClass = new Map<string, { n: number; w: number }>();
  let completed = 0, winsSum = 0, roundsSum = 0, fights = 0, draws = 0, unspent = 0, stuck = 0;

  for (let i = 0; i < runs; i++) {
    let state = createRun(`${seed}:run${i}`, ctx);
    let rounds = 0;
    while (state.phase === 'shop' && rounds < MAX_ROUNDS) {
      const shopped = bot.shop(state, ctx, botRng);
      const r = fight(shopped, ctx);
      if (!r.ok) {
        stuck++;
        break;
      }
      rounds++;
      fights++;
      unspent += shopped.gold;
      const score = r.combat.winner === 'player' ? 1 : r.combat.winner === 'draw' ? 0.5 : 0;
      if (r.combat.winner === 'draw') draws++;
      const br = byRound.get(shopped.round) ?? { n: 0, w: 0 };
      byRound.set(shopped.round, { n: br.n + 1, w: br.w + score });
      const classes = new Set([...shopped.board.front, ...shopped.board.back].flatMap((u) => (u ? [u.classId] : [])));
      for (const c of classes) {
        const bc = byClass.get(c) ?? { n: 0, w: 0 };
        byClass.set(c, { n: bc.n + 1, w: bc.w + score });
      }
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
    winsHistogram: hist,
    winRateByRound: [...byRound.entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, t]) => ({ round, fights: t.n, winRate: t.w / t.n })),
    avgUnspentGold: fights ? unspent / fights : 0,
    byClass: [...byClass.entries()].map(([classId, t]) => ({ classId, fights: t.n, winRate: t.w / t.n })),
    stuckRuns: stuck,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const className = (id: string) => (CLASSES as Record<string, { name: string }>)[id]?.name ?? id;

export function formatRunReports(reports: BotRunReport[], bots: readonly Bot[]): string {
  const lines: string[] = [];
  lines.push('| Bot | Runs | Completed (10 wins) | Avg wins | Avg rounds | Draw rate | Avg unspent gold | Stuck |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of reports) {
    lines.push(
      `| ${r.bot} | ${r.runs} | ${pct(r.completionRate)} | ${r.avgWins.toFixed(2)} | ${r.avgRounds.toFixed(1)} | ` +
        `${pct(r.drawRate)} | ${r.avgUnspentGold.toFixed(1)} | ${r.stuckRuns} |`,
    );
  }
  lines.push('', ...bots.map((b) => `- **${b.name}**: ${b.description}`), '');

  const rounds = Math.max(...reports.map((r) => r.winRateByRound.length));
  lines.push('#### Fight win rate by round', '');
  lines.push(`| Round | ${reports.map((r) => r.bot).join(' | ')} |`, `|---:|${reports.map(() => '---:').join('|')}|`);
  for (let i = 0; i < rounds; i++) {
    const cells = reports.map((r) => {
      const row = r.winRateByRound[i];
      return row ? `${pct(row.winRate)} (${row.fights})` : '–';
    });
    lines.push(`| ${i + 1} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  lines.push('#### Runs ending with N wins', '');
  const maxWins = reports[0]?.winsHistogram.length ?? 0;
  lines.push(`| Wins | ${reports.map((r) => r.bot).join(' | ')} |`, `|---:|${reports.map(() => '---:').join('|')}|`);
  for (let w = 0; w < maxWins; w++) {
    lines.push(`| ${w} | ${reports.map((r) => r.winsHistogram[w]).join(' | ')} |`);
  }
  lines.push('');

  lines.push('#### Fight win rate with class on the board', '');
  const classIds = [...new Set(reports.flatMap((r) => r.byClass.map((c) => c.classId)))];
  lines.push(`| Class | ${reports.map((r) => r.bot).join(' | ')} |`, `|---|${reports.map(() => '---:').join('|')}|`);
  for (const id of classIds) {
    const cells = reports.map((r) => {
      const c = r.byClass.find((x) => x.classId === id);
      return c ? pct(c.winRate) : '–';
    });
    lines.push(`| ${className(id)} | ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

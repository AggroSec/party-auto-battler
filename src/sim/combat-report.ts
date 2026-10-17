// Milestone-1 balance probes: class-vs-class duels and random 5v5 fights.
// The full run-based simulator with bots arrives in Milestone 3.
import { CLASSES, CLASS_IDS, type ClassId } from '../data/classes.ts';
import { partyOf } from '../data/units.ts';
import { DEFAULT_TICK_CAP, Rng, simulateCombat, type CombatResult, type Party } from '../engine/index.ts';

export const OUTLIER_HIGH = 0.65;
export const OUTLIER_LOW = 0.35;

export interface DuelMatrix {
  /** winRate[a][b] = share of a-vs-b duels won by a (draws count half). */
  winRate: Record<ClassId, Record<ClassId, number>>;
  /** Average win rate of each class across all opponents (excluding mirrors). */
  overall: Record<ClassId, number>;
}

export interface TeamClassStat {
  classId: ClassId;
  /** Fights where this class appeared on a side. */
  appearances: number;
  /** Share of those fights the side won (draws count half). */
  winRate: number;
}

export interface TeamReport {
  fights: number;
  draws: number;
  timeouts: number;
  avgTicks: number;
  maxTicks: number;
  byClass: TeamClassStat[];
}

const score = (r: CombatResult, side: 'player' | 'enemy') => (r.winner === side ? 1 : r.winner === 'draw' ? 0.5 : 0);

/** 1v1 duels, each class in the front row. Both sides alternate who is "player" to cancel tie-break bias. */
export function runDuels(fightsPerPair: number, seed: string): DuelMatrix {
  const rng = new Rng(seed);
  const winRate = {} as DuelMatrix['winRate'];
  const overall = {} as DuelMatrix['overall'];
  for (const a of CLASS_IDS) {
    winRate[a] = {} as Record<ClassId, number>;
    for (const b of CLASS_IDS) {
      let total = 0;
      for (let i = 0; i < fightsPerPair; i++) {
        const aIsPlayer = i % 2 === 0;
        const pa = partyOf([a]);
        const pb = partyOf([b]);
        const r = simulateCombat({ player: aIsPlayer ? pa : pb, enemy: aIsPlayer ? pb : pa, rng: rng.fork() });
        total += score(r, aIsPlayer ? 'player' : 'enemy');
      }
      winRate[a][b] = total / fightsPerPair;
    }
    const others = CLASS_IDS.filter((b) => b !== a);
    overall[a] = others.reduce((s, b) => s + winRate[a][b], 0) / others.length;
  }
  return { winRate, overall };
}

function randomParty(rng: Rng): { party: Party; classes: Set<ClassId> } {
  const ids = Array.from({ length: 5 }, () => rng.pick(CLASS_IDS));
  // Stable sort keeps the random draw order among equal preferences.
  const placed = [...ids].sort((a, b) => CLASSES[a].placement - CLASSES[b].placement);
  return { party: partyOf(placed.slice(0, 3), placed.slice(3)), classes: new Set(ids) };
}

/** Random full-size parties, placed by role, against each other. */
export function runTeamFights(fights: number, seed: string): TeamReport {
  const rng = new Rng(seed);
  const tally = new Map<ClassId, { n: number; w: number }>(CLASS_IDS.map((id) => [id, { n: 0, w: 0 }]));
  let draws = 0;
  let timeouts = 0;
  let tickSum = 0;
  let maxTicks = 0;

  for (let i = 0; i < fights; i++) {
    const p = randomParty(rng);
    const e = randomParty(rng);
    const r = simulateCombat({ player: p.party, enemy: e.party, rng: rng.fork() });
    if (r.winner === 'draw') draws++;
    if (r.ticks >= DEFAULT_TICK_CAP) timeouts++;
    tickSum += r.ticks;
    maxTicks = Math.max(maxTicks, r.ticks);
    for (const [side, classes] of [['player', p.classes], ['enemy', e.classes]] as const) {
      for (const id of classes) {
        const t = tally.get(id)!;
        t.n++;
        t.w += score(r, side);
      }
    }
  }

  return {
    fights,
    draws,
    timeouts,
    avgTicks: tickSum / fights,
    maxTicks,
    byClass: CLASS_IDS.map((classId) => {
      const t = tally.get(classId)!;
      return { classId, appearances: t.n, winRate: t.n ? t.w / t.n : 0 };
    }),
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const flag = (x: number) => (x > OUTLIER_HIGH ? ' ⚠️ high' : x < OUTLIER_LOW ? ' ⚠️ low' : '');

export function formatReport(duels: DuelMatrix, teams: TeamReport, opts: { seed: string; duelsPerPair: number }): string {
  const name = (id: ClassId) => CLASSES[id].name;
  const lines: string[] = [];
  lines.push(`Seed \`${opts.seed}\`. Draws count as half a win.`, '');

  lines.push(`### Random 5v5 fights (${teams.fights} fights)`, '');
  lines.push('Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.', '');
  lines.push('| Class | Appearances | Win rate |', '|---|---:|---:|');
  for (const c of teams.byClass) lines.push(`| ${name(c.classId)} | ${c.appearances} | ${pct(c.winRate)}${flag(c.winRate)} |`);
  lines.push('');
  lines.push(
    `Draws: ${teams.draws} (${pct(teams.draws / teams.fights)}), tick-cap timeouts: ${teams.timeouts}, ` +
      `avg length: ${teams.avgTicks.toFixed(1)} ticks, longest: ${teams.maxTicks} ticks (cap ${DEFAULT_TICK_CAP}).`,
    '',
  );

  lines.push(`### 1v1 duels (${opts.duelsPerPair} per pairing, sides alternated)`, '');
  lines.push(`| Row beats column | ${CLASS_IDS.map(name).join(' | ')} | Overall |`);
  lines.push(`|---|${CLASS_IDS.map(() => '---:').join('|')}|---:|`);
  for (const a of CLASS_IDS) {
    const cells = CLASS_IDS.map((b) => (a === b ? '–' : pct(duels.winRate[a][b])));
    lines.push(`| ${name(a)} | ${cells.join(' | ')} | ${pct(duels.overall[a])} |`);
  }
  lines.push('');
  lines.push(
    '_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._',
  );
  return lines.join('\n');
}

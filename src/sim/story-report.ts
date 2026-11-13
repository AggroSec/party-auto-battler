// Story-mode simulation (Milestone 14): bots play whole stories. They shop
// and level up like the run bots, pick paths and event options, and we tally
// how far they get, how often each mission's fights and boss are won, and how
// often they run out of lives.
import { Rng } from '../engine/index.ts';
import { activeSynergies, boardUnits, fight, runContext, type RunContext, type RunSetup, type RunState } from '../engine/run/index.ts';
import { reachable } from '../engine/story/map.ts';
import { createStoryRun, promptOptions, storyDef, storyLives } from '../engine/story/story.ts';
import type { StoryNode } from '../engine/story/types.ts';
import { resolvePending, tryAct, type Bot } from './bots.ts';

/** Safety net per story: no story needs this many decisions. */
const MAX_STEPS = 600;

export interface StoryReport {
  bot: string;
  runs: number;
  completionRate: number;
  /** Runs that reached each mission (index 0 = all of them). */
  reached: number[];
  avgRestarts: number;
  /** Per mission: fights, fights won, boss attempts, bosses won, restarts. */
  missions: { fights: number; won: number; bossFights: number; bossWins: number; restarts: number }[];
  /** Share of fights that ended with Strength of the Tribe active, by tier (3, 4, 5 classes). */
  tribe: Record<number, number>;
  avgLevelAtEnd: number;
  stuck: number;
}

/** Where a bot heads next: a camp when hurt, a shop with gold to spend, else events and fights; elites only with lives to spare. */
function pickNode(state: RunState, options: StoryNode[], ctx: RunContext, rng: Rng, careful: boolean): StoryNode {
  if (!careful) return rng.pick(options);
  const story = storyDef(ctx, state.story!.storyId);
  const score = (n: StoryNode) => {
    switch (n.kind) {
      case 'rest':
        return state.lives < storyLives(ctx, story) ? 5 : 2;
      case 'shop':
        return state.gold >= 6 ? 4 : 1;
      case 'event':
        return 3;
      case 'elite':
        return state.lives >= 2 ? 2.5 : 0;
      default:
        return 2;
    }
  };
  return [...options].sort((a, b) => score(b) - score(a) + (rng.next() - 0.5) * 0.1)[0]!;
}

/** Event and camp picks: a careful bot rests when hurt and otherwise trains its lowest-level hero; events are random. */
function pickOption(state: RunState, ctx: RunContext, rng: Rng, careful: boolean): number {
  const options = promptOptions(state, ctx);
  if (state.story?.prompt?.id !== 'rest' || !careful) return rng.int(options.length);
  const rest = options.findIndex((o) => o.outcomes.some((x) => x.kind === 'life'));
  if (rest >= 0 && state.lives <= 1) return rest;
  const heroes = boardUnits(state.board);
  const lowest = [...heroes].sort((a, b) => a.level - b.level)[0];
  const train = options.findIndex((o) => lowest && o.label.includes(lowest.name));
  return train >= 0 ? train : 0;
}

export function runStoryBot(bot: Bot, baseCtx: RunContext, runs: number, seed: string, setup: RunSetup, careful = true): StoryReport {
  const ctx = runContext(setup, baseCtx);
  const story = storyDef(ctx, setup.story!);
  const rng = new Rng(`${seed}:${bot.name}`);
  const missions = story.missions.map(() => ({ fights: 0, won: 0, bossFights: 0, bossWins: 0, restarts: 0 }));
  const reached = story.missions.map(() => 0);
  const tribeFights: Record<number, number> = { 3: 0, 4: 0, 5: 0 };
  let completed = 0, restarts = 0, stuck = 0, fights = 0, levelSum = 0, levelUnits = 0;

  for (let i = 0; i < runs; i++) {
    let s = createStoryRun(`${seed}:${i}`, baseCtx, setup);
    let steps = 0;
    let furthest = 0;
    for (; s.phase === 'shop' && steps < MAX_STEPS; steps++) {
      const p = s.story!;
      furthest = Math.max(furthest, p.mission);
      if (p.scene) {
        s = tryAct(s, { type: 'scene' }, ctx) ?? s;
        continue;
      }
      s = resolvePending(bot, s, ctx, rng);
      if (bot.allocate) s = bot.allocate(s, ctx, rng);
      if (p.prompt && p.prompt.picked === undefined) {
        s = tryAct(s, { type: 'storyChoice', option: pickOption(s, ctx, rng, careful) }, ctx) ?? s;
        continue;
      }
      s = bot.shop(s, ctx, rng);
      s = resolvePending(bot, s, ctx, rng);
      if (p.toFight) {
        const node = p.map.find((n) => n.id === p.at)!;
        const m = missions[p.mission]!;
        const tribe = activeSynergies(boardUnits(s.board), ctx.content).find((a) => a.synergy.id === 'strength-of-the-tribe');
        if (tribe) tribeFights[tribe.tier + 3] = (tribeFights[tribe.tier + 3] ?? 0) + 1;
        const before = s.story!.restarts;
        const r = fight(s, baseCtx);
        if (!r.ok) break;
        fights += 1;
        const won = r.combat.winner === 'player';
        m.fights += 1;
        if (won) m.won += 1;
        if (node.kind === 'boss') {
          m.bossFights += 1;
          if (won) m.bossWins += 1;
        }
        if (r.state.story!.restarts > before) m.restarts += 1;
        s = r.state;
        continue;
      }
      const options = reachable(p.map, p.at);
      if (options.length === 0) break;
      s = tryAct(s, { type: 'travel', node: pickNode(s, options, ctx, rng, careful).id }, ctx) ?? s;
    }
    for (let m = 0; m <= furthest; m++) reached[m] = (reached[m] ?? 0) + 1;
    if (s.phase === 'complete') completed += 1;
    else if (steps >= MAX_STEPS) stuck += 1;
    restarts += s.story!.restarts;
    for (const u of boardUnits(s.board)) {
      levelSum += u.level;
      levelUnits += 1;
    }
  }
  return {
    bot: bot.name,
    runs,
    completionRate: completed / runs,
    reached,
    avgRestarts: restarts / runs,
    missions,
    tribe: Object.fromEntries(Object.entries(tribeFights).map(([k, v]) => [k, fights > 0 ? v / fights : 0])),
    avgLevelAtEnd: levelUnits > 0 ? levelSum / levelUnits : 0,
    stuck,
  };
}

export function formatStoryReports(reports: StoryReport[], tier: number): string {
  const rows = [
    `| Bot | Complete | Reached M2 / M3 | Restarts/run | Avg level at end | ${reports[0]?.missions.map((_, i) => `M${i + 1} fights won | M${i + 1} boss won`).join(' | ')} |`,
    `|---|---|---|---|---|${reports[0]?.missions.map(() => '---|---').join('|')}|`,
  ];
  for (const r of reports) {
    const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(0)}%` : '–');
    rows.push(
      `| ${r.bot} | ${(r.completionRate * 100).toFixed(1)}% | ${r.reached.slice(1).map((n) => pct(n, r.runs)).join(' / ')} | ${r.avgRestarts.toFixed(2)} | ${r.avgLevelAtEnd.toFixed(1)} | ` +
        r.missions.map((m) => `${pct(m.won, m.fights)} | ${pct(m.bossWins, m.bossFights)}`).join(' | ') +
        ' |',
    );
  }
  return [`Story tier ${tier}:`, rows.join('\n')].join('\n\n');
}

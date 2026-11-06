// Headless balance simulator.
// Usage: npm run sim -- [--runs 2000] [--fights 2000] [--duels 200] [--seed m2] [--only runs|combat|ladder] [--tier 0] [--mode rules] [--out file.md]
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { buildRunContext } from '../data/content.ts';
import { RULES_CLASS_IDS } from '../data/rules-mode/index.ts';
import { defaultSetup, type RunSetup } from '../engine/run/index.ts';
import { BOTS } from './bots.ts';
import { formatReport, runDuels, runTeamFights } from './combat-report.ts';
import { formatRunReports } from './run-format.ts';
import { runBot } from './run-report.ts';

const { values } = parseArgs({
  options: {
    runs: { type: 'string', default: '2000' },
    fights: { type: 'string', default: '2000' },
    duels: { type: 'string', default: '200' },
    seed: { type: 'string', default: 'm3' },
    only: { type: 'string' },
    tier: { type: 'string', default: '0' },
    out: { type: 'string' },
    mode: { type: 'string' },
  },
});

/** The setup for a tier: classic (every class), or rules mode (every rules-mode class, default rules). */
const setupFor = (ctx: ReturnType<typeof buildRunContext>, tier: number): RunSetup =>
  values.mode === 'rules' ? { ...defaultSetup(ctx), tier, classes: [...RULES_CLASS_IDS], mode: 'rules' } : { ...defaultSetup(ctx), tier };

const seed = values.seed;
const sections: string[] = [`Seed \`${seed}\`. Draws count as half a win.`];

if (values.only === undefined || values.only === 'runs') {
  const runs = Number(values.runs);
  const ctx = buildRunContext();
  const tier = Number(values.tier);
  const reports = BOTS.map((bot) => runBot(bot, ctx, runs, `${seed}:runs`, setupFor(ctx, tier)));
  sections.push(`### Full runs (${runs} per bot, all content, ladder tier ${tier}${values.mode ? `, ${values.mode} mode` : ''})`, formatRunReports(reports, BOTS, ctx.content));
}

if (values.only === 'ladder') {
  // Completion by ladder tier for the two strongest bots (M7).
  const runs = Number(values.runs);
  const ctx = buildRunContext();
  const bots = BOTS.filter((b) => b.name === 'sensible' || b.name === 'greedy');
  const rows = ['| Tier | ' + bots.map((b) => `${b.name} completion | ${b.name} avg wins`).join(' | ') + ' |', '|---|' + bots.map(() => '---|---').join('|') + '|'];
  for (let tier = 0; tier <= ctx.content.ladder.length; tier++) {
    const reports = bots.map((bot) => runBot(bot, ctx, runs, `${seed}:ladder${tier}`, setupFor(ctx, tier)));
    rows.push(`| ${tier} | ` + reports.map((r) => `${(r.completionRate * 100).toFixed(1)}% | ${r.avgWins.toFixed(1)}`).join(' | ') + ' |');
    console.error(`tier ${tier} done`);
  }
  sections.push(`### Ladder (${runs} runs per bot per tier)`, rows.join('\n'));
}

if (values.only === undefined || values.only === 'combat') {
  const duelsPerPair = Number(values.duels);
  const teams = runTeamFights(Number(values.fights), `${seed}:teams`);
  const duels = runDuels(duelsPerPair, `${seed}:duels`);
  sections.push(formatReport(duels, teams, { duelsPerPair }));
}

const report = sections.join('\n\n');
console.log(report);
if (values.out) {
  writeFileSync(values.out, report + '\n');
  console.error(`\nWrote ${values.out}`);
}

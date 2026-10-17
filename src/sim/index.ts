// Headless balance simulator.
// Usage: npm run sim -- [--runs 2000] [--fights 2000] [--duels 200] [--seed m2] [--only runs|combat] [--out file.md]
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { buildRunContext } from '../data/content.ts';
import { BOTS } from './bots.ts';
import { formatReport, runDuels, runTeamFights } from './combat-report.ts';
import { formatRunReports, runBot } from './run-report.ts';

const { values } = parseArgs({
  options: {
    runs: { type: 'string', default: '2000' },
    fights: { type: 'string', default: '2000' },
    duels: { type: 'string', default: '200' },
    seed: { type: 'string', default: 'm2' },
    only: { type: 'string' },
    out: { type: 'string' },
  },
});

const seed = values.seed;
const sections: string[] = [`Seed \`${seed}\`. Draws count as half a win.`];

if (values.only !== 'combat') {
  const runs = Number(values.runs);
  const ctx = buildRunContext();
  const reports = BOTS.map((bot) => runBot(bot, ctx, runs, `${seed}:runs`));
  sections.push(`### Full runs (${runs} per bot, starter classes)`, formatRunReports(reports, BOTS));
}

if (values.only !== 'runs') {
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

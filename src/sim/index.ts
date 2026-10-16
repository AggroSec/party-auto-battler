// Headless balance simulator.
// Usage: npm run sim -- [--fights 2000] [--duels 200] [--seed m1] [--out docs/BALANCE-latest.md]
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { formatReport, runDuels, runTeamFights } from './combat-report.ts';

const { values } = parseArgs({
  options: {
    fights: { type: 'string', default: '2000' },
    duels: { type: 'string', default: '200' },
    seed: { type: 'string', default: 'm1' },
    out: { type: 'string' },
  },
});

const fights = Number(values.fights);
const duelsPerPair = Number(values.duels);
const seed = values.seed;

const teams = runTeamFights(fights, `${seed}:teams`);
const duels = runDuels(duelsPerPair, `${seed}:duels`);
const report = formatReport(duels, teams, { seed, duelsPerPair });

console.log(report);
if (values.out) {
  writeFileSync(values.out, report + '\n');
  console.error(`\nWrote ${values.out}`);
}

// Usage: npm run playlog -- [file.jsonl] [--out report.md]
// Defaults to the newest file in playlogs/. Files from the game's
// "Export play log" button work too.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { buildRunContext } from '../data/content.ts';
import type { PlayLogEntry } from '../engine/run/index.ts';
import { formatReplay, replayLog } from './playlog.ts';

const { values, positionals } = parseArgs({ options: { out: { type: 'string' } }, allowPositionals: true });

const DIR = 'playlogs';
const file =
  positionals[0] ??
  (() => {
    try {
      const latest = readdirSync(DIR).filter((f) => f.endsWith('.jsonl')).sort().at(-1);
      return latest ? `${DIR}/${latest}` : undefined;
    } catch {
      return undefined;
    }
  })();

if (!file) {
  console.error('No play logs found. Play a run with `npm run dev` first (logs go to playlogs/).');
  process.exit(1);
}

const entries = readFileSync(file, 'utf8')
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line) as PlayLogEntry);
const ctx = buildRunContext();
const report = formatReplay(replayLog(entries, ctx), ctx);
console.log(report);
if (values.out) writeFileSync(values.out, report);

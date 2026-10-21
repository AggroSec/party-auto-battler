import { buildRunContext } from '../../data/content.ts';
import { greedyBot, sensibleBot } from '../bots.ts';
import { runBot } from '../run-report.ts';
const base = buildRunContext();
const variants: Record<string, Partial<typeof base.content.enemyScaling>> = JSON.parse(process.argv[2]!);
for (const [name, v] of Object.entries(variants)) {
  const ctx = { ...base, content: { ...base.content, enemyScaling: { ...base.content.enemyScaling, ...v } } };
  for (const bot of [sensibleBot, greedyBot]) {
    const r = runBot(bot, ctx, Number(process.argv[3] ?? 300), 'tune');
    const byRound = r.winRateByRound.filter((x) => x.round <= 19).map((x) => Math.round(100 * x.winRate)).join(' ');
    console.log(`${name.padEnd(10)} ${bot.name.padEnd(8)} done ${(100 * r.completionRate).toFixed(1)}% rnds ${r.avgRounds.toFixed(1)} lvl ${r.avgLevel.toFixed(2)} | ${byRound}`);
  }
}

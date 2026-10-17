import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../data/content.ts';
import { BOTS, randomBot, sensibleBot } from './bots.ts';
import { formatRunReports, runBot } from './run-report.ts';
import { Rng } from '../engine/index.ts';
import { createRun, unitCount } from '../engine/run/index.ts';

describe('run simulator', () => {
  const ctx = buildRunContext();

  it('plays every run to a finish without getting stuck', () => {
    for (const bot of BOTS) {
      const r = runBot(bot, ctx, 30, 'test');
      expect(r.stuckRuns).toBe(0);
      expect(r.winsHistogram.reduce((a, b) => a + b, 0)).toBe(30);
      expect(r.avgRounds).toBeGreaterThanOrEqual(ctx.config.startingLives);
    }
  });

  it('is deterministic for a seed', () => {
    expect(runBot(sensibleBot, ctx, 20, 'd')).toEqual(runBot(sensibleBot, ctx, 20, 'd'));
  });

  it('bots spend their opening gold on units', () => {
    for (const bot of [randomBot, sensibleBot]) {
      const s = bot.shop(createRun('open', ctx), ctx, new Rng(1));
      expect(unitCount(s.board)).toBe(3);
      expect(s.gold).toBeLessThan(ctx.config.unitCost);
    }
  });

  it('formats a report', () => {
    const md = formatRunReports([runBot(randomBot, ctx, 5, 'f')], [randomBot]);
    expect(md).toContain('| random |');
    expect(md).toContain('Fight win rate by round');
  });
});

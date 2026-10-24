import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../data/content.ts';
import { Rng } from '../engine/index.ts';
import { createRun, unitCount } from '../engine/run/index.ts';
import { BOTS, greedyBot, partyPower, randomBot, resolvePending, sensibleBot, synergyBot, synergyTagOf } from './bots.ts';
import { entityRows, formatRunReports, MIN_FIGHTS_FOR_FLAG } from './run-format.ts';
import { mergeEntities, runBot, type BotRunReport } from './run-report.ts';

describe('run simulator', () => {
  const ctx = buildRunContext();

  // 60 full runs: ~1.5s locally, but CI runners can be several times slower than the 5s default.
  it('plays every run to a finish without getting stuck', { timeout: 30_000 }, () => {
    for (const bot of BOTS) {
      const r = runBot(bot, ctx, 15, 'test');
      expect(r.stuckRuns).toBe(0);
      expect(r.tickCapHits).toBe(0);
      expect(r.winsHistogram.reduce((a, b) => a + b, 0)).toBe(15);
      expect(r.avgRounds).toBeGreaterThanOrEqual(Math.min(ctx.config.startingLives, ctx.config.winsToComplete));
    }
  });

  it('is deterministic for a seed', () => {
    const a = runBot(sensibleBot, ctx, 10, 'd');
    const b = runBot(sensibleBot, ctx, 10, 'd');
    expect({ ...a, entities: [...a.entities] }).toEqual({ ...b, entities: [...b.entities] });
  });

  it('bots recruit in round 1 (deliberate bots spend their opening gold on units)', () => {
    expect(unitCount(randomBot.shop(createRun('open', ctx), ctx, new Rng(1)).board)).toBeGreaterThanOrEqual(1);
    for (const bot of [sensibleBot, greedyBot, synergyBot]) {
      const s = bot.shop(createRun('open', ctx), ctx, new Rng(1));
      expect(unitCount(s.board)).toBe(3);
      expect(s.gold).toBeLessThan(ctx.config.unitCost);
    }
  });

  it('bots resolve every level-up choice', () => {
    for (const bot of BOTS) {
      let s = createRun('lv', ctx);
      s = bot.shop(s, ctx, new Rng(2));
      s.pending = [{ uid: s.board.front[0]?.uid ?? s.board.back[0]!.uid, level: 2, kind: 'talent', options: ['warrior/challenge', 'warrior/polearm'] }];
      s.board.front[0] ??= s.board.back[0]!;
      expect(resolvePending(bot, s, ctx, new Rng(3)).pending).toEqual([]);
    }
  });

  it('greedy prefers more power; synergy bot picks a stable tag per run', () => {
    expect(partyPower({ front: [], back: [] })).toBe(0);
    const s = createRun('tag', ctx);
    expect(synergyTagOf(s, ctx)).toBe(synergyTagOf(s, ctx));
    expect(greedyBot.name).toBe('greedy');
    expect(synergyBot.name).toBe('synergy');
  });

  it('round-adjusted lift removes round bias', () => {
    const tally = (fights: number, score: number) => ({ fights, score });
    const fake = (entities: [string, [number, ReturnType<typeof tally>][]][], rounds: [number, ReturnType<typeof tally>][]) =>
      ({ entities: new Map(entities.map(([k, v]) => [k, new Map(v)])), rounds: new Map(rounds) }) as unknown as BotRunReport;
    // Round 1 is easy (90%), round 10 is hard (20%). "late" only appears in round 10 and wins 20% there: lift 0.
    // "strong" also only appears in round 10 but wins 60% there: lift +40 points.
    const merged = mergeEntities([
      fake(
        [
          ['item:late', [[10, tally(10, 2)]]],
          ['item:strong', [[10, tally(10, 6)]]],
        ],
        [
          [1, tally(100, 90)],
          [10, tally(100, 20)],
        ],
      ),
    ]);
    expect(merged.get('item:late')!.lift).toBeCloseTo(0);
    expect(merged.get('item:strong')!.lift).toBeCloseTo(0.4);
  });

  it('tracks entities and formats a report with outlier flags', () => {
    const reports = [runBot(randomBot, ctx, 8, 'f')];
    const rows = entityRows(mergeEntities(reports), ctx.content);
    expect(rows.some((r) => r.kind === 'class')).toBe(true);
    expect(rows.filter((r) => r.fights < MIN_FIGHTS_FOR_FLAG).every((r) => r.flag === '')).toBe(true);
    const md = formatRunReports(reports, [randomBot], ctx.content);
    expect(md).toContain('| random |');
    expect(md).toContain('Pick-to-win rates');
  });
});

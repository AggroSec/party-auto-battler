// Tiers 11–15 (post-1.0): boss fights that cost 2 lives, higher enemy levels,
// unique bosses and a second Elite.
import { describe, expect, it } from 'vitest';
import { boardUnits, createRun, defaultSetup, fight, generateEnemy, lifeCost, newUnit, runContext } from '../../engine/run/index.ts';
import { buildRunContext } from '../content.ts';
import { BOSSES } from './bosses.ts';

const ctx = buildRunContext();
const tier = (n: number) => ({ ...defaultSetup(ctx), tier: n });
const at = (n: number) => runContext(tier(n), ctx);
const unique = new Set(BOSSES.filter((b) => b.unique).map((b) => b.id));

describe('ladder tiers 11–15', () => {
  it('past tier 10, a lost boss fight costs 2 lives; other fights still cost 1', () => {
    expect(lifeCost(5, at(10))).toBe(1);
    expect(lifeCost(5, at(11))).toBe(2);
    expect(lifeCost(6, at(11))).toBe(1);

    const s = createRun('boss', ctx, tier(11));
    s.round = 5;
    s.lives = 3;
    s.board.front[0] = newUnit(1, 'bard', 'Lute');
    const r = fight(s, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.combat.winner).toBe('enemy');
    expect(r.state.lives).toBe(1);
  });

  it('a boss loss never takes lives below 0', () => {
    const s = createRun('boss', ctx, tier(11));
    s.round = 5;
    s.lives = 1;
    s.board.front[0] = newUnit(1, 'bard', 'Lute');
    const r = fight(s, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state).toMatchObject({ lives: 0, phase: 'defeated' });
  });

  it('from tier 13 the unique bosses take over boss rounds', () => {
    for (const round of [5, 10, 15]) {
      for (let seed = 0; seed < 10; seed++) {
        const boss = (t: number) => boardUnits(generateEnemy(`b${seed}`, round, at(t)).builds).find((u) => u.bossId)!;
        expect(unique.has(boss(12).bossId!)).toBe(false);
        expect(unique.has(boss(13).bossId!)).toBe(true);
      }
    }
  });

  it('unique bosses fight and resolve like any enemy', () => {
    const enemy = generateEnemy('wyrm', 15, at(15));
    const boss = boardUnits(enemy.builds).find((u) => u.bossId);
    expect(boss?.bossId && unique.has(boss.bossId)).toBe(true);
    const s = createRun('wyrm', ctx, tier(15));
    s.round = 15;
    s.board.front[0] = newUnit(1, 'warrior', 'W');
    expect(fight(s, ctx).ok).toBe(true);
  });

  it('tier 14 adds a second Elite from round 10', () => {
    const elites = (t: number, round: number) => boardUnits(generateEnemy('e', round, at(t)).builds).filter((u) => u.elite).length;
    expect(elites(13, 10)).toBe(1);
    expect(elites(14, 9)).toBe(1);
    expect(elites(14, 10)).toBe(2);
  });

  it('tiers 12 and 15 raise enemy levels', () => {
    const avg = (t: number) => {
      let sum = 0, n = 0;
      for (let seed = 0; seed < 20; seed++) {
        for (const u of boardUnits(generateEnemy(`l${seed}`, 12, at(t)).builds)) {
          if (u.elite || u.bossId) continue;
          sum += u.level;
          n++;
        }
      }
      return sum / n;
    };
    expect(avg(12) - avg(11)).toBeGreaterThan(0.7);
    expect(avg(15) - avg(14)).toBeGreaterThan(0.7);
  });
});

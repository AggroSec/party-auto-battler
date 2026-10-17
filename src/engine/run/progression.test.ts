import { describe, expect, it } from 'vitest';
import { Rng } from '../rng.ts';
import { newUnit } from './build.ts';
import { applyChoice, grantXp, sample, talentOptions } from './progression.ts';
import { TEST_CONFIG, makeCtx } from './test-fixtures.ts';

const { content } = makeCtx();
const cfg = TEST_CONFIG.progression;

describe('progression', () => {
  it('levels at the XP thresholds and caps at max level', () => {
    const u = newUnit(1, 'archer', 'A');
    grantXp(u, 1, content, cfg, new Rng(1));
    expect(u.level).toBe(1);
    grantXp(u, 1, content, cfg, new Rng(1));
    expect(u.level).toBe(2);
    grantXp(u, 100, content, cfg, new Rng(1));
    expect(u.level).toBe(5);
    expect(u.xp).toBe(102);
  });

  it('rolls stat growth within the class ranges, deterministically', () => {
    const roll = (seed: number) => {
      const u = newUnit(1, 'archer', 'A');
      grantXp(u, 14, content, cfg, new Rng(seed));
      return u.growth;
    };
    const g = roll(3);
    // 4 level-ups: hp 1-3, atk 0-2, def 0-1, spd 1-4 each.
    expect(g.hp).toBeGreaterThanOrEqual(4);
    expect(g.hp).toBeLessThanOrEqual(12);
    expect(g.spd).toBeGreaterThanOrEqual(4);
    expect(g.spd).toBeLessThanOrEqual(16);
    expect(roll(3)).toEqual(g);
    const spread = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(roll(i))));
    expect(spread.size).toBeGreaterThan(1);
  });

  it('queues a talent choice at level 2 and an advanced-class choice at level 3', () => {
    const u = newUnit(1, 'tank', 'T');
    const choices = grantXp(u, 5, content, cfg, new Rng(2));
    expect(choices.map((c) => [c.level, c.kind])).toEqual([
      [2, 'talent'],
      [3, 'advance'],
    ]);
    expect(choices[0]!.options).toHaveLength(3);
    expect(new Set(choices[0]!.options).size).toBe(3);
    expect(choices[1]!.options).toEqual(['paladin', 'brute']);
  });

  it('defers post-advance talent options until the advanced class is chosen', () => {
    const u = newUnit(1, 'tank', 'T');
    const choices = grantXp(u, 9, content, cfg, new Rng(2));
    expect(choices.map((c) => [c.level, c.kind, c.options.length])).toEqual([
      [2, 'talent', 3],
      [3, 'advance', 2],
      [4, 'talent', 0],
    ]);
    applyChoice(u, choices[1]!, 0);
    expect(talentOptions(u, 4, content, cfg, new Rng(1))?.sort()).toEqual(['holy1', 'holy2']);
  });

  it('skips talent choices when the pool is exhausted, and never re-offers owned talents', () => {
    const u = newUnit(1, 'tank', 'T');
    u.talents = ['tough', 'strong', 'quick'];
    expect(talentOptions(u, 2, content, cfg, new Rng(1))).toEqual(['sturdy']);
    u.talents.push('sturdy');
    expect(talentOptions(u, 2, content, cfg, new Rng(1))).toEqual([]);
    const archer = newUnit(2, 'archer', 'A');
    expect(grantXp(archer, 2, content, cfg, new Rng(1))).toEqual([]);
  });

  it('sample picks distinct items', () => {
    const picks = sample(new Rng(4), [1, 2, 3, 4, 5], 3);
    expect(new Set(picks).size).toBe(3);
    expect(sample(new Rng(4), [1, 2], 5)).toHaveLength(2);
  });
});

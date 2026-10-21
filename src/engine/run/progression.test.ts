import { describe, expect, it } from 'vitest';
import { Rng } from '../rng.ts';
import { effectiveClassId, newUnit, resolveUnit, unitTags } from './build.ts';
import { allocatePoints, applyChoice, choiceOptions, grantXp, recommendedAllocation, sample, talentOptions } from './progression.ts';
import { LONG_PROGRESSION, TEMPLATES, TEST_CONFIG, makeCtx } from './test-fixtures.ts';

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

  it('grants stat points per level, with the bigger bumps at levels 3 and 5', () => {
    const u = newUnit(1, 'archer', 'A');
    grantXp(u, 2, content, cfg, new Rng(1));
    expect(u.statPoints).toBe(3);
    grantXp(u, 12, content, cfg, new Rng(1));
    expect(u).toMatchObject({ level: 5, statPoints: 16 });
    expect(u.growth).toEqual({ hp: 0, atk: 0, def: 0, spd: 0 });
  });

  it('gives no XP at the level cap', () => {
    const u = newUnit(1, 'archer', 'A');
    grantXp(u, 14, content, cfg, new Rng(1));
    expect(grantXp(u, 5, content, cfg, new Rng(1))).toEqual([]);
    expect(u).toMatchObject({ level: 5, xp: 14 });
  });

  it('spends points freely, rejecting overspends and bad values', () => {
    const u = newUnit(1, 'archer', 'A');
    u.statPoints = 4;
    expect(allocatePoints(u, { atk: 2, spd: 3 }, cfg)).toBe(false);
    expect(allocatePoints(u, { atk: -1 }, cfg)).toBe(false);
    expect(allocatePoints(u, { atk: 1.5 }, cfg)).toBe(false);
    expect(u.statPoints).toBe(4);
    expect(allocatePoints(u, { hp: 1, spd: 3 }, cfg)).toBe(true);
    expect(u).toMatchObject({ statPoints: 0, growth: { hp: 3, atk: 0, def: 0, spd: 3 } });
  });

  it('recommends a spread that follows the class weights across levels', () => {
    const u = newUnit(1, 'archer', 'A'); // weights hp 1, atk 2, spd 1
    expect(recommendedAllocation(u, content, cfg, 4)).toEqual({ hp: 1, atk: 2, def: 0, spd: 1 });
    u.statPoints = 3;
    allocatePoints(u, { hp: 3 }, cfg);
    // Already heavy on HP: the next points go to ATK and SPD until the spread catches up.
    expect(recommendedAllocation(u, content, cfg, 5)).toEqual({ hp: 0, atk: 4, def: 0, spd: 1 });
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
    const options = talentOptions(u, 4, content, cfg, new Rng(1))!;
    expect(options.slice(0, 2).sort()).toEqual(['holy1', 'holy2']);
    expect(TEMPLATES.tank.talents).toContain(options[2]);
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

describe('tertiary classes and granted abilities (M6)', () => {
  const { content } = makeCtx();
  const long = { ...TEST_CONFIG.progression, ...LONG_PROGRESSION };

  it('offers the tertiary choice at the ascend level, then draws from its pool', () => {
    const u = newUnit(1, 'tank', 'T');
    const rng = new Rng(3);
    for (const c of grantXp(u, 25, content, long, rng)) {
      const options = choiceOptions(u, c, content, long, rng)!;
      if (c.kind === 'ascend') expect(options).toEqual(['templar', 'crusader']);
      applyChoice(u, { ...c, options }, c.kind === 'advance' ? options.indexOf('paladin') : 0);
    }
    expect(u.level).toBe(7);
    expect(u.tertiaryClassId).toBe('templar');
    expect(effectiveClassId(u)).toBe('templar');
    expect(unitTags(u, content)).toEqual(['holy']);
    const options = talentOptions(u, 8, content, long, rng)!;
    expect(options.slice(0, 2).sort()).toEqual(['prayer', 'zeal1']);
    expect(options).toHaveLength(3);
  });

  it('defers the tertiary choice when the advanced class is still undecided', () => {
    const u = newUnit(1, 'tank', 'T');
    const choices = grantXp(u, 25, content, long, new Rng(1));
    expect(choices.map((c) => [c.level, c.kind, c.options.length])).toContainEqual([7, 'ascend', 0]);
  });

  it('skips the tertiary tier for an advanced class without tertiary classes', () => {
    const u = { ...newUnit(1, 'tank', 'T'), level: 7, advancedClassId: 'brute' };
    expect(talentOptions(u, 8, content, long, new Rng(1))).not.toBeNull();
  });

  it('resolves the tertiary ability and stats, and talent-granted abilities with cooldown changes', () => {
    const u = { ...newUnit(1, 'tank', 'T'), advancedClassId: 'paladin', tertiaryClassId: 'templar', talents: ['prayer', 'quick'] };
    const setup = resolveUnit(u, content);
    expect(setup.classId).toBe('templar');
    expect(setup.ability).toMatchObject({ id: 'judgement', cooldown: 2 });
    expect(setup.extraAbilities?.map((a) => [a.id, a.cooldown])).toEqual([['prayer', 4]]);
    expect(setup.stats.hp).toBe(TEMPLATES.tank.baseStats.hp + 10);
  });
});

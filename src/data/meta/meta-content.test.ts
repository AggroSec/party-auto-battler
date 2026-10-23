import { describe, expect, it } from 'vitest';
import { newProfile, runSetupFor, unlockedContent } from '../../engine/meta/index.ts';
import { createRun, fight, newUnit } from '../../engine/run/index.ts';
import { TERTIARY_CLASSES } from '../builds/index.ts';
import { CLASSES } from '../classes.ts';
import { buildRunContext } from '../content.ts';
import { ITEMS, ITEM_IDS } from '../items.ts';
import { SYNERGIES } from '../synergies.ts';
import { ACHIEVEMENTS } from './achievements.ts';
import { BOSSES } from './bosses.ts';
import { META_CATALOG } from './catalog.ts';
import { LADDER } from './ladder.ts';
import { PERKS, PERK_IDS } from './perks.ts';

describe('signature items', () => {
  const signatures = Object.values(ITEMS).filter((i) => i.tertiaryClassId);

  it('every tertiary class has exactly one, priced 7–8, kept out of the random item pool', () => {
    expect(signatures).toHaveLength(Object.keys(TERTIARY_CLASSES).length);
    for (const id of Object.keys(TERTIARY_CLASSES)) expect(signatures.filter((i) => i.tertiaryClassId === id)).toHaveLength(1);
    for (const item of signatures) {
      expect(item.cost).toBeGreaterThanOrEqual(7);
      expect(item.cost).toBeLessThanOrEqual(8);
      expect(ITEM_IDS).not.toContain(item.id);
    }
  });
});

describe('meta content', () => {
  it('achievements have unique ids and only reward things that exist', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    const synergyIds = SYNERGIES.map((s) => s.id);
    for (const a of ACHIEVEMENTS) {
      for (const id of a.reward.classes ?? []) expect(CLASSES).toHaveProperty(id);
      for (const id of a.reward.items ?? []) expect(ITEM_IDS).toContain(id);
      for (const id of a.reward.synergies ?? []) expect(synergyIds).toContain(id);
      for (const id of a.reward.perks ?? []) expect(PERKS).toHaveProperty(id);
    }
  });

  it('everything locked can be unlocked, and earning every achievement unlocks it all', () => {
    const all = unlockedContent({ ...newProfile(), achievements: ACHIEVEMENTS.map((a) => a.id), maxTier: LADDER.length }, META_CATALOG);
    expect(all).toEqual(unlockedContent({ ...newProfile(), unlockAll: true }, META_CATALOG));
  });

  it('a new player starts with the original five classes and three perks', () => {
    const start = unlockedContent(newProfile(), META_CATALOG);
    expect(start.classes).toEqual(['warrior', 'rogue', 'mage', 'cleric', 'ranger']);
    expect(start.perks).toHaveLength(3);
    expect(start.perkSlots).toBe(1);
    expect(start.maxTier).toBe(0);
  });

  it('the ladder runs tiers 1–10 in order; perks and bosses are well formed', () => {
    expect(LADDER.map((l) => l.tier)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(PERK_IDS).toHaveLength(12);
    for (const b of BOSSES) expect(CLASSES).toHaveProperty(b.classId);
  });

  it('a starter run and a tier-10 run with everything both play', () => {
    const ctx = buildRunContext();
    const starter = unlockedContent(newProfile(), META_CATALOG);
    const run = createRun('meta', ctx, runSetupFor(starter, 0, ['deep-pockets']));
    expect(run.gold).toBe(13);
    expect(run.shop.filter((o) => o?.kind === 'unit').every((o) => o?.kind === 'unit' && starter.classes.includes(o.classId))).toBe(true);

    const everything = unlockedContent({ ...newProfile(), unlockAll: true }, META_CATALOG);
    const hard = createRun('meta', ctx, runSetupFor(everything, 10, []));
    expect(hard).toMatchObject({ gold: 8, lives: 4 });
    hard.board.front[0] = newUnit(1, 'warrior', 'W');
    expect(fight(hard, ctx).ok).toBe(true);
  });
});

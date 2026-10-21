import { describe, expect, it } from 'vitest';
import { emptyBoard, explainUnit, newUnit, resolveBoard, STATS, type Contribution } from '../engine/run/index.ts';
import { ADVANCED_CLASSES, TERTIARY_CLASSES } from './builds/index.ts';
import { CLASSES } from './classes.ts';
import { buildRunContent } from './content.ts';
import { ITEMS } from './items.ts';

const sum = (cs: Contribution[]) => cs.reduce((s, c) => s + c.amount, 0);

describe('explainUnit', () => {
  it('adds up to the resolved unit for every advanced and tertiary class, with items and synergies', () => {
    const content = buildRunContent();
    const itemIds = Object.keys(ITEMS);
    const tiers = [
      ...Object.values(ADVANCED_CLASSES).map((adv) => ({ adv, tert: undefined })),
      ...Object.values(TERTIARY_CLASSES).map((tert) => ({ adv: ADVANCED_CLASSES[tert.advancedClassId]!, tert })),
    ];
    tiers.forEach(({ adv, tert }, i) => {
      const u = newUnit(1, adv.baseClassId, 'X');
      u.advancedClassId = adv.id;
      u.tertiaryClassId = tert?.id ?? null;
      u.talents = [
        ...CLASSES[adv.baseClassId as keyof typeof CLASSES].talents.slice(0, 1),
        ...adv.talents.slice(i % 3, (i % 3) + 2),
        ...(tert?.talents.slice(i % 2, (i % 2) + 3) ?? []),
      ];
      u.items = [itemIds[i % itemIds.length]!, itemIds[(i * 7 + 3) % itemIds.length]!];
      u.growth = { hp: 6, atk: 2, def: 1, spd: i % 3 };
      const board = emptyBoard();
      board.front[0] = u;
      // Same-class allies switch on tag synergies.
      board.front[1] = newUnit(2, adv.baseClassId, 'A');
      board.back[0] = newUnit(3, adv.baseClassId, 'B');
      board.back[1] = newUnit(4, 'cleric', 'C');
      const setup = resolveBoard(board, content).front[0]!;
      const ex = explainUnit(u, board, content);
      for (const k of STATS) expect(Math.max(k === 'hp' || k === 'spd' ? 1 : 0, sum(ex.stats[k])), `${tert?.id ?? adv.id} ${k}`).toBe(setup.stats[k]);
      expect(Math.max(1, sum(ex.cooldown)), adv.id).toBe(setup.ability.cooldown);
      expect(1 + sum(ex.abilityPower), adv.id).toBeCloseTo(setup.abilityPower ?? 1);
      expect(sum(ex.lifesteal), adv.id).toBeCloseTo(setup.lifesteal ?? 0);
    });
  });

  it('labels where each number comes from', () => {
    const content = buildRunContent();
    const u = newUnit(1, 'mage', 'X');
    u.items = ['hourglass'];
    u.growth = { hp: 0, atk: 3, def: 0, spd: 0 };
    const board = emptyBoard();
    board.back[0] = u;
    const ex = explainUnit(u, board, content);
    expect(ex.stats.atk).toEqual([
      { label: 'Mage base', amount: 7 },
      { label: 'Stat points', amount: 3 },
    ]);
    expect(ex.cooldown).toEqual([
      { label: 'Fireball', amount: 3 },
      { label: 'Hourglass', amount: -1 },
    ]);
  });
});

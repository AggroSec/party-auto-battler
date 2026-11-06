import { describe, expect, it } from 'vitest';
import { applyShopAction, createRun, defaultSetup, fight, generateEnemy, newUnit, boardUnits, runContext, rollShop } from '../engine/run/index.ts';
import { Rng } from '../engine/rng.ts';
import { buildRunContext } from './content.ts';
import { CONSUMABLE_IDS } from './consumables.ts';

const ctx = buildRunContext();

describe('consumables', () => {
  it('every shop has a consumable slot at the end', () => {
    const shop = rollShop(new Rng(1), ctx, createRun('c', ctx).board);
    const last = shop.at(-1);
    expect(last?.kind === 'item' && CONSUMABLE_IDS.includes(last.itemId)).toBe(true);
  });

  it('buying one fills the consumable slot (replacing the old one), not an item slot', () => {
    let s = createRun('c', ctx);
    s.board.front[0] = newUnit(1, 'warrior', 'W');
    s.gold = 10;
    s.shop = [{ kind: 'item', itemId: 'healing-potion', cost: 1 }, { kind: 'item', itemId: 'swiftness-draught', cost: 1 }];
    for (const offer of [0, 1]) {
      const r = applyShopAction(s, { type: 'buy', offer, to: { row: 'front', col: 0 } }, ctx);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.board.front[0]).toMatchObject({ consumable: 'swiftness-draught', items: [] });
  });

  it('a consumable that fires is used up; one whose trigger never happens stays', () => {
    const s = createRun('c', ctx);
    s.board.front[0] = { ...newUnit(1, 'warrior', 'W'), consumable: 'swiftness-draught' };
    s.board.front[1] = { ...newUnit(2, 'cleric', 'C'), consumable: 'last-rites' };
    const r = fight(s, ctx);
    if (!r.ok) throw new Error(r.error);
    const fell = r.combat.events.some((e) => e.type === 'death' && e.target.startsWith('p'));
    expect(r.state.board.front[0]?.consumable).toBeNull();
    expect(r.state.board.front[1]?.consumable).toBe(fell ? null : 'last-rites');
  });

  it('won fights sometimes drop a free consumable into the next shop', () => {
    let drops = 0;
    for (let i = 0; i < 30; i++) {
      const s = createRun(`d${i}`, ctx);
      s.board.front[0] = newUnit(1, 'warrior', 'W');
      s.board.front[0].level = 5;
      s.board.front[0].growth = { hp: 200, atk: 20, def: 5, spd: 0 };
      const r = fight(s, ctx);
      if (r.ok && r.combat.winner === 'player' && r.state.shop.some((o) => o?.kind === 'item' && o.cost === 0)) drops++;
    }
    expect(drops).toBeGreaterThan(3);
    expect(drops).toBeLessThan(25);
  });

  it('enemies carry consumables from round 5 on tier 14', () => {
    const at = (tier: number) => runContext({ ...defaultSetup(ctx), tier }, ctx);
    const carried = (tier: number, round: number) => boardUnits(generateEnemy('e', round, at(tier)).builds).filter((u) => u.consumable).length;
    expect(carried(13, 6)).toBe(0);
    expect(carried(14, 4)).toBe(0);
    expect(carried(14, 5)).toBeGreaterThan(0);
  });
});

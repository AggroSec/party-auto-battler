import { describe, expect, it } from 'vitest';
import { applyShopAction, createRun, fight } from './run.ts';
import { defaultSetup, runContext } from './setup.ts';
import { ensureFavored, FAVORED_ROUNDS, favoredClasses } from './shop.ts';
import { makeCtx } from './test-fixtures.ts';
import type { RunState, ShopOffer } from './types.ts';

const unit = (classId: string, name = classId): ShopOffer => ({ kind: 'unit', classId, name, cost: 3 });
const hasArcher = (s: RunState) => s.shop.some((o) => o?.kind === 'unit' && o.classId === 'archer');

describe('ensureFavored', () => {
  const ctx = makeCtx();

  it('turns the first recruit offer into the favored class when none is offered', () => {
    const shop = [unit('tank', 'A'), unit('tank', 'B'), { kind: 'item', itemId: 'sword', cost: 3 } as ShopOffer];
    expect(ensureFavored(shop, [], { favored: 'archer' }, 1, ctx)).toEqual([unit('archer', 'A'), unit('tank', 'B'), shop[2]]);
  });

  it('leaves the shop alone when the class is already offered, after the favored rounds, or with no favored class', () => {
    const offered = [unit('tank'), unit('archer')];
    expect(ensureFavored(offered, [], { favored: 'archer' }, 1, ctx)).toEqual(offered);
    const tanks = [unit('tank'), unit('tank')];
    expect(ensureFavored(tanks, [], { favored: 'archer' }, FAVORED_ROUNDS + 1, ctx)).toEqual(tanks);
    expect(ensureFavored(tanks, [], {}, 1, ctx)).toEqual(tanks);
  });

  it('skips locked and bought slots, and ignores classes the run cannot recruit', () => {
    expect(ensureFavored([unit('tank', 'A'), null, unit('tank', 'B')], [0], { favored: 'archer' }, 2, ctx)).toEqual([unit('tank', 'A'), null, unit('archer', 'B')]);
    expect(ensureFavored([unit('tank')], [], { favored: 'mage' }, 1, ctx)).toEqual([unit('tank')]);
  });
});

describe('favored class in a run', () => {
  const ctx = makeCtx();
  const setup = { ...defaultSetup(ctx), favored: 'archer' };

  it('offers the favored class in every shop of the first rounds, rerolls included', () => {
    for (let i = 0; i < 30; i++) {
      let s = createRun(`fav${i}`, ctx, setup);
      expect(hasArcher(s)).toBe(true);
      for (let r = 0; r < 3; r++) {
        s.gold = 10;
        const rolled = applyShopAction(s, { type: 'reroll' }, ctx);
        if (!rolled.ok) throw new Error(rolled.error);
        s = rolled.state;
        expect(hasArcher(s)).toBe(true);
      }
    }
  });

  it('keeps the run deterministic and changes nothing without a favored class', () => {
    expect(createRun('a', ctx, setup)).toEqual(createRun('a', ctx, setup));
    expect(createRun('a', ctx, defaultSetup(ctx)).shop).toEqual(createRun('a', ctx).shop);
  });

  it('applies to the next round’s shop until the favored rounds end', () => {
    let s = createRun('fav-round', ctx, setup);
    const bought = applyShopAction(s, { type: 'buy', offer: s.shop.findIndex((o) => o?.kind === 'unit') }, ctx);
    if (!bought.ok) throw new Error(bought.error);
    const r = fight(bought.state, ctx);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    expect(s.round).toBe(2);
    expect(hasArcher(s)).toBe(true);
    expect(runContext(setup, ctx).content.shopPool).toContain('archer');
  });
});

describe('two favored classes', () => {
  const ctx = makeCtx();

  it('guarantees each one, without overwriting the other', () => {
    const shop = [unit('tank', 'A'), unit('tank', 'B'), unit('tank', 'C')];
    expect(ensureFavored(shop, [], { favored: ['archer', 'tank'] }, 1, ctx)).toEqual([unit('archer', 'A'), unit('tank', 'B'), unit('tank', 'C')]);
    const archers = [unit('archer', 'A'), unit('archer', 'B')];
    expect(ensureFavored(archers, [], { favored: ['archer', 'tank'] }, 1, ctx)).toEqual([unit('tank', 'A'), unit('archer', 'B')]);
  });

  it('reads a single favored class from older saves', () => {
    expect(favoredClasses({ favored: 'archer' })).toEqual(['archer']);
    expect(favoredClasses({ favored: ['archer', 'tank'] })).toEqual(['archer', 'tank']);
    expect(favoredClasses({})).toEqual([]);
  });
});

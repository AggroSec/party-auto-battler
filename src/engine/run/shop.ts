import type { Rng } from '../rng.ts';
import { boardUnits } from './build.ts';
import type { Board, RunContext, ShopOffer } from './types.ts';

export function rollUnitOffer(rng: Rng, ctx: RunContext): ShopOffer {
  const classId = rng.pick(ctx.content.shopPool);
  return { kind: 'unit', classId, name: rng.pick(ctx.content.unitNames), cost: ctx.config.unitCost };
}

/**
 * An extra-slot offer: training for a class on your board (so it's useful, but
 * you reroll to chase the class you want), otherwise an item.
 */
export function rollExtraOffer(rng: Rng, ctx: RunContext, board: Board): ShopOffer {
  const owned = [...new Set(boardUnits(board).map((u) => u.classId))];
  const { trainingChance } = ctx.config.shop;
  const { trainingXp, trainingCost } = ctx.config.progression;
  if (owned.length > 0 && (ctx.content.itemPool.length === 0 || rng.chance(trainingChance))) {
    return { kind: 'training', classId: rng.pick(owned), xp: trainingXp, cost: trainingCost };
  }
  if (ctx.content.itemPool.length === 0) return rollUnitOffer(rng, ctx);
  const itemId = rng.pick(ctx.content.itemPool);
  return { kind: 'item', itemId, cost: ctx.content.items[itemId]?.cost ?? ctx.config.unitCost };
}

/** A fresh shop: unit slots first, then extra (item/training) slots. */
export function rollShop(rng: Rng, ctx: RunContext, board: Board): ShopOffer[] {
  const { unitSlots, extraSlots } = ctx.config.shop;
  return [
    ...Array.from({ length: unitSlots }, () => rollUnitOffer(rng, ctx)),
    ...Array.from({ length: extraSlots }, () => rollExtraOffer(rng, ctx, board)),
  ];
}

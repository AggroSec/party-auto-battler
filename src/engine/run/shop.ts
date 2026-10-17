import type { Rng } from '../rng.ts';
import { boardUnits } from './build.ts';
import type { Board, RunContext, ShopOffer } from './types.ts';

/**
 * A recruit offer. Its name avoids `taken` (names in the party and already in
 * this shop) so a party never has two units with the same name.
 */
export function rollUnitOffer(rng: Rng, ctx: RunContext, taken: ReadonlySet<string> = new Set()): ShopOffer {
  const classId = rng.pick(ctx.content.shopPool);
  const free = ctx.content.unitNames.filter((n) => !taken.has(n));
  const name = rng.pick(free.length > 0 ? free : ctx.content.unitNames);
  return { kind: 'unit', classId, name, cost: ctx.config.unitCost };
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
  const taken = new Set(boardUnits(board).map((u) => u.name));
  const units = Array.from({ length: unitSlots }, () => {
    const offer = rollUnitOffer(rng, ctx, taken);
    if (offer.kind === 'unit') taken.add(offer.name);
    return offer;
  });
  return [...units, ...Array.from({ length: extraSlots }, () => rollExtraOffer(rng, ctx, board))];
}

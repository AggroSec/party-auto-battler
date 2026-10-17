import type { Rng } from '../rng.ts';
import type { RunContext, ShopOffer } from './types.ts';

export function rollOffer(rng: Rng, ctx: RunContext): ShopOffer {
  const classId = rng.pick(ctx.content.shopPool);
  return { classId, name: rng.pick(ctx.content.unitNames), cost: ctx.config.unitCost };
}

/** A fresh shop. Every offer is drawn uniformly from the shop pool. */
export function rollShop(rng: Rng, ctx: RunContext): ShopOffer[] {
  return Array.from({ length: ctx.config.shopSize }, () => rollOffer(rng, ctx));
}

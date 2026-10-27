import type { Rng } from '../rng.ts';
import { BACK_SLOTS, FRONT_SLOTS } from '../types.ts';
import { unitCount } from './board.ts';
import { boardUnits } from './build.ts';
import { isMaxLevel } from './progression.ts';
import { recruitCost } from './setup.ts';
import type { Board, OwnedUnit, RunContext, ShopOffer } from './types.ts';

/** Chance an extra slot offers a tertiary class's signature item while one is missing it (M7). */
export const TERTIARY_ITEM_CHANCE = 0.3;

/** The signature item of a tertiary class, if it has one. */
export function tertiaryItemFor(tertiaryClassId: string, ctx: RunContext): string | undefined {
  return Object.values(ctx.content.items).find((i) => i.tertiaryClassId === tertiaryClassId)?.id;
}

/** Signature items the party could use: one per tertiary unit that doesn't hold its own yet. */
export function wantedTertiaryItems(board: Board, ctx: RunContext): string[] {
  const ids = boardUnits(board).flatMap((u: OwnedUnit) => {
    const item = u.tertiaryClassId ? tertiaryItemFor(u.tertiaryClassId, ctx) : undefined;
    return item && !u.items.includes(item) ? [item] : [];
  });
  return [...new Set(ids)];
}

/**
 * A recruit offer. Its name avoids `taken` (names in the party and already in
 * this shop) so a party never has two units with the same name.
 */
export function rollUnitOffer(rng: Rng, ctx: RunContext, taken: ReadonlySet<string> = new Set(), round = 1): ShopOffer {
  const classId = rng.pick(ctx.content.shopPool);
  const free = ctx.content.unitNames.filter((n) => !taken.has(n));
  const name = rng.pick(free.length > 0 ? free : ctx.content.unitNames);
  return { kind: 'unit', classId, name, cost: recruitCost(round, ctx) };
}

/**
 * An extra-slot offer: training for a class on your board (so it's useful, but
 * you reroll to chase the class you want), otherwise an item.
 */
export function rollExtraOffer(rng: Rng, ctx: RunContext, board: Board, round = 1): ShopOffer {
  const signature = wantedTertiaryItems(board, ctx);
  if (signature.length > 0 && rng.chance(TERTIARY_ITEM_CHANCE)) {
    const itemId = rng.pick(signature);
    return { kind: 'item', itemId, cost: ctx.content.items[itemId]?.cost ?? ctx.config.unitCost };
  }
  // Only classes with a unit below the level cap: training a maxed class would be wasted.
  const owned = [...new Set(boardUnits(board).filter((u) => !isMaxLevel(u, ctx.config.progression)).map((u) => u.classId))];
  const { trainingChance } = ctx.config.shop;
  const { trainingXp, trainingCost } = ctx.config.progression;
  if (owned.length > 0 && (ctx.content.itemPool.length === 0 || rng.chance(trainingChance))) {
    return { kind: 'training', classId: rng.pick(owned), xp: trainingXp, cost: trainingCost };
  }
  if (ctx.content.itemPool.length === 0) return rollUnitOffer(rng, ctx, new Set(), round);
  const itemId = rng.pick(ctx.content.itemPool);
  return { kind: 'item', itemId, cost: ctx.content.items[itemId]?.cost ?? ctx.config.unitCost };
}

/**
 * A fresh shop: unit slots first, then extra (item/training) slots. With a
 * full board, most recruit slots turn into item/training slots.
 */
export function rollShop(rng: Rng, ctx: RunContext, board: Board, round = 1): ShopOffer[] {
  const { shop } = ctx.config;
  const full = unitCount(board) >= FRONT_SLOTS + BACK_SLOTS;
  const unitSlots = full ? Math.min(shop.fullPartyUnitSlots, shop.unitSlots) : shop.unitSlots;
  const extraSlots = shop.extraSlots + shop.unitSlots - unitSlots;
  const taken = new Set(boardUnits(board).map((u) => u.name));
  const units = Array.from({ length: unitSlots }, () => {
    const offer = rollUnitOffer(rng, ctx, taken, round);
    if (offer.kind === 'unit') taken.add(offer.name);
    return offer;
  });
  return [...units, ...Array.from({ length: extraSlots }, () => rollExtraOffer(rng, ctx, board, round))];
}

/** Rounds in which a run's favored class is guaranteed a recruit offer. */
export const FAVORED_ROUNDS = 2;

/**
 * Favored class: in the first FAVORED_ROUNDS rounds, if no recruit offer is
 * that class, the first unlocked recruit offer becomes it. Same name and cost,
 * and no RNG, so the rest of the shop is unchanged.
 */
export function ensureFavored(
  shop: readonly (ShopOffer | null)[],
  locked: readonly number[],
  favored: string | undefined,
  round: number,
  ctx: RunContext,
): (ShopOffer | null)[] {
  const out = [...shop];
  if (!favored || round > FAVORED_ROUNDS || !ctx.content.shopPool.includes(favored)) return out;
  if (out.some((o) => o?.kind === 'unit' && o.classId === favored)) return out;
  const i = out.findIndex((o, j) => o?.kind === 'unit' && !locked.includes(j));
  const offer = out[i];
  if (offer?.kind === 'unit') out[i] = { ...offer, classId: favored };
  return out;
}

/** A free random item for the Armory perk's first shop. */
export function rollFreeItem(rng: Rng, ctx: RunContext): ShopOffer | null {
  return ctx.content.itemPool.length > 0 ? { kind: 'item', itemId: rng.pick(ctx.content.itemPool), cost: 0 } : null;
}

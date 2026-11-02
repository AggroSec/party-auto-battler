import type { Rng } from '../rng.ts';
import { BACK_SLOTS, FRONT_SLOTS } from '../types.ts';
import { unitCount } from './board.ts';
import { boardUnits } from './build.ts';
import { isMaxLevel } from './progression.ts';
import { recruitCost } from './setup.ts';
import type { Board, RunContext, RunSetup, ShopOffer } from './types.ts';

/** The signature item of a tertiary class, if it has one. */
export function tertiaryItemFor(tertiaryClassId: string, ctx: RunContext): string | undefined {
  return Object.values(ctx.content.items).find((i) => i.tertiaryClassId === tertiaryClassId)?.id;
}

/**
 * The one-time offer a unit gets on reaching a tertiary class. It takes its own
 * slot on the end of the shop and never rolls again, so a reroll or a fight
 * ends it unless it's bought or locked.
 */
export function signatureOffer(tertiaryClassId: string, ctx: RunContext): ShopOffer | null {
  const itemId = tertiaryItemFor(tertiaryClassId, ctx);
  return itemId ? { kind: 'item', itemId, cost: ctx.content.items[itemId]?.cost ?? ctx.config.unitCost } : null;
}

/** One-per-party classes this board already has. */
function uniqueClassesOn(board: Board, ctx: RunContext): Set<string> {
  return new Set(boardUnits(board).flatMap((u) => (ctx.content.classes[u.classId]?.uniqueInParty ? [u.classId] : [])));
}

/**
 * A recruit offer, never of a class in `barred`. Its name avoids `taken`
 * (names in the party and already in this shop) so a party never has two units
 * with the same name, unless its class has a fixed name.
 */
export function rollUnitOffer(rng: Rng, ctx: RunContext, taken: ReadonlySet<string> = new Set(), round = 1, barred: ReadonlySet<string> = new Set()): ShopOffer {
  const open = ctx.content.shopPool.filter((c) => !barred.has(c));
  const classId = rng.pick(open.length > 0 ? open : ctx.content.shopPool);
  const free = ctx.content.unitNames.filter((n) => !taken.has(n));
  const name = rng.pick(free.length > 0 ? free : ctx.content.unitNames);
  return { kind: 'unit', classId, name: ctx.content.classes[classId]?.fixedName ?? name, cost: recruitCost(round, ctx) };
}

/**
 * An extra-slot offer: training for a class on your board (so it's useful, but
 * you reroll to chase the class you want), otherwise an item.
 */
export function rollExtraOffer(rng: Rng, ctx: RunContext, board: Board, round = 1): ShopOffer {
  // Only classes with a unit below the level cap: training a maxed class would be wasted.
  const owned = [...new Set(boardUnits(board).filter((u) => !isMaxLevel(u, ctx.config.progression)).map((u) => u.classId))];
  const { trainingChance } = ctx.config.shop;
  const { trainingXp, trainingCost } = ctx.config.progression;
  if (owned.length > 0 && (ctx.content.itemPool.length === 0 || rng.chance(trainingChance))) {
    return { kind: 'training', classId: rng.pick(owned), xp: trainingXp, cost: trainingCost };
  }
  if (ctx.content.itemPool.length === 0) return rollUnitOffer(rng, ctx, new Set(), round, uniqueClassesOn(board, ctx));
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
  const barred = uniqueClassesOn(board, ctx);
  const units = Array.from({ length: unitSlots }, () => {
    const offer = rollUnitOffer(rng, ctx, taken, round, barred);
    if (offer.kind === 'unit') {
      taken.add(offer.name);
      if (ctx.content.classes[offer.classId]?.uniqueInParty) barred.add(offer.classId);
    }
    return offer;
  });
  return [...units, ...Array.from({ length: extraSlots }, () => rollExtraOffer(rng, ctx, board, round))];
}

/** Rounds in which a run's favored classes are guaranteed a recruit offer. */
export const FAVORED_ROUNDS = 2;

/** A setup's favored classes as a list (older saves store a single class). */
export function favoredClasses(setup: Pick<RunSetup, 'favored'>): string[] {
  const f = setup.favored;
  return f === undefined ? [] : typeof f === 'string' ? [f] : [...f];
}

/**
 * Favored classes: in the first FAVORED_ROUNDS rounds, each favored class
 * missing from the recruit offers takes over the first unlocked recruit offer
 * it can without leaving another favored class with no offer. Same name and
 * cost, and no RNG, so the rest of the shop is unchanged. A one-per-party class
 * the board already has isn't guaranteed, and its offer (with its fixed name)
 * is never taken over.
 */
export function ensureFavored(
  shop: readonly (ShopOffer | null)[],
  locked: readonly number[],
  setup: Pick<RunSetup, 'favored'>,
  round: number,
  ctx: RunContext,
  board?: Board,
): (ShopOffer | null)[] {
  const out = [...shop];
  if (round > FAVORED_ROUNDS) return out;
  const owned = board ? uniqueClassesOn(board, ctx) : new Set<string>();
  const favored = favoredClasses(setup).filter((c) => ctx.content.shopPool.includes(c) && !owned.has(c));
  const offersOf = (cls: string) => out.filter((o) => o?.kind === 'unit' && o.classId === cls).length;
  // An offer can be taken unless it's the last one of a favored class.
  const spare = (o: ShopOffer | null) =>
    o?.kind === 'unit' && !ctx.content.classes[o.classId]?.fixedName && (!favored.includes(o.classId) || offersOf(o.classId) > 1);
  for (const cls of favored) {
    if (offersOf(cls) > 0) continue;
    const i = out.findIndex((o, j) => !locked.includes(j) && spare(o));
    const offer = out[i];
    if (offer?.kind === 'unit') out[i] = { ...offer, classId: cls, name: ctx.content.classes[cls]?.fixedName ?? offer.name };
  }
  return out;
}

/** A free random item for the Armory perk's first shop. */
export function rollFreeItem(rng: Rng, ctx: RunContext): ShopOffer | null {
  return ctx.content.itemPool.length > 0 ? { kind: 'item', itemId: rng.pick(ctx.content.itemPool), cost: 0 } : null;
}

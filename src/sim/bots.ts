// Shop-phase bots for the run simulator. Milestone 3 adds smarter ones
// (greedy, synergy-focused) once talents, items and synergies exist.
import { applyShopAction, allSlots, getSlot, unitCount } from '../engine/run/index.ts';
import type { RunContext, RunState, ShopAction } from '../engine/run/index.ts';
import type { Rng } from '../engine/index.ts';

export interface Bot {
  name: string;
  description: string;
  /** Take shop actions for one round and return the state to fight with. */
  shop(state: RunState, ctx: RunContext, rng: Rng): RunState;
}

function tryAct(state: RunState, action: ShopAction, ctx: RunContext): RunState | null {
  const r = applyShopAction(state, action, ctx);
  return r.ok ? r.state : null;
}

const emptySlots = (s: RunState) => allSlots().filter((slot) => getSlot(s.board, slot) === null);
const affordableOffers = (s: RunState) =>
  s.shop.flatMap((o, i) => (o && o.cost <= s.gold ? [i] : []));

/** Buys random affordable units into random empty slots; sometimes rerolls. */
export const randomBot: Bot = {
  name: 'random',
  description: 'Buys random affordable units into random slots; rerolls 30% of the time when it has spare gold.',
  shop(state, ctx, rng) {
    let s = state;
    for (let guard = 0; guard < 20; guard++) {
      const offers = affordableOffers(s);
      const slots = emptySlots(s);
      if (offers.length > 0 && slots.length > 0) {
        s = tryAct(s, { type: 'buy', offer: rng.pick(offers), to: rng.pick(slots) }, ctx) ?? s;
      } else if (s.gold > ctx.config.rerollCost && slots.length > 0 && rng.chance(0.3)) {
        s = tryAct(s, { type: 'reroll' }, ctx) ?? s;
      } else {
        break;
      }
    }
    return s;
  },
};

/**
 * Builds a sensible party: wants two frontliners, then prefers classes it
 * doesn't own yet. Uses auto-placement and banks spare gold for interest.
 */
export const sensibleBot: Bot = {
  name: 'sensible',
  description: 'Wants 2 frontliners, then class variety; auto-places; rerolls only to find a missing frontliner.',
  shop(state, ctx) {
    let s = state;
    const isFront = (classId: string) => (ctx.content.classes[classId]?.placement ?? 9) <= 1;
    const owned = () => [...s.board.front, ...s.board.back].flatMap((u) => (u ? [u.classId] : []));

    for (let guard = 0; guard < 20; guard++) {
      if (unitCount(s.board) >= 5) break;
      const have = owned();
      const needFront = have.filter(isFront).length < 2;
      const score = (classId: string) => (needFront && isFront(classId) ? 2 : 0) + (have.includes(classId) ? 0 : 1);
      const offers = affordableOffers(s).sort((a, b) => score(s.shop[b]!.classId) - score(s.shop[a]!.classId));
      const best = offers[0];
      if (best !== undefined && (!needFront || isFront(s.shop[best]!.classId) || s.gold < ctx.config.unitCost + ctx.config.rerollCost)) {
        s = tryAct(s, { type: 'buy', offer: best }, ctx) ?? s;
      } else if (needFront && s.gold >= ctx.config.unitCost + ctx.config.rerollCost) {
        s = tryAct(s, { type: 'reroll' }, ctx) ?? s;
      } else if (best !== undefined) {
        s = tryAct(s, { type: 'buy', offer: best }, ctx) ?? s;
      } else {
        break;
      }
    }
    return s;
  },
};

export const BOTS: readonly Bot[] = [randomBot, sensibleBot];

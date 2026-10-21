// Shop-phase bots for the run simulator. Each makes shop decisions and
// level-up choices; together they give coverage of classes, items and talents.
import { allSlots, applyShopAction, autoAllocate, getSlot, resolveBoard, STATS, unitCount } from '../engine/run/index.ts';
import type { PendingChoice, RunContext, RunState, ShopAction, SlotRef } from '../engine/run/index.ts';
import type { Party, Rng } from '../engine/index.ts';

export interface Bot {
  name: string;
  description: string;
  /** Take shop actions for one round and return the state to fight with. */
  shop(state: RunState, ctx: RunContext, rng: Rng): RunState;
  /** Pick an option index for the first pending choice. */
  choose(state: RunState, choice: PendingChoice, ctx: RunContext, rng: Rng): number;
  /** Spend stat points. Bots without this leave them to the fight's recommended auto-spend. */
  allocate?(state: RunState, ctx: RunContext, rng: Rng): RunState;
}

export function tryAct(state: RunState, action: ShopAction, ctx: RunContext): RunState | null {
  const r = applyShopAction(state, action, ctx);
  return r.ok ? r.state : null;
}

/** Resolve every pending level-up choice with the bot's policy. */
export function resolvePending(bot: Bot, state: RunState, ctx: RunContext, rng: Rng): RunState {
  let s = state;
  for (let guard = 0; s.pending.length > 0 && guard < 50; guard++) {
    const choice = s.pending[0]!;
    const pick = Math.min(Math.max(0, bot.choose(s, choice, ctx, rng)), choice.options.length - 1);
    s = tryAct(s, { type: 'choose', option: pick }, ctx) ?? tryAct(s, { type: 'choose', option: 0 }, ctx) ?? s;
  }
  return s;
}

const emptySlots = (s: RunState) => allSlots().filter((slot) => getSlot(s.board, slot) === null);
const filledSlots = (s: RunState) => allSlots().filter((slot) => getSlot(s.board, slot) !== null);
const affordable = (s: RunState) => s.shop.flatMap((o, i) => (o && o.cost <= s.gold ? [i] : []));

/** Slots that can legally receive offer i (empty slots for units, valid owners for items/training). */
export function targetsFor(s: RunState, i: number, ctx: RunContext): SlotRef[] {
  const offer = s.shop[i];
  if (!offer) return [];
  if (offer.kind === 'unit') return emptySlots(s);
  return filledSlots(s).filter((slot) => {
    const u = getSlot(s.board, slot)!;
    return offer.kind === 'item' ? u.items.length < ctx.config.progression.maxItemsPerUnit : u.classId === offer.classId;
  });
}

/** Rough strength of a resolved party: effective HP × damage output, plus a bonus per special effect. */
export function partyPower(party: Party): number {
  let total = 0;
  for (const u of [...party.front, ...party.back]) {
    if (!u) continue;
    const ehp = u.stats.hp * (1 + u.stats.def / 10);
    const dps = u.stats.atk * (u.stats.spd / 10) * (1 + 0.4 * ((u.abilityPower ?? 1) - 1) + (u.lifesteal ?? 0));
    total += ehp * dps + 15 * u.triggers.length + (u.reach ? 20 : 0);
  }
  return total;
}

/** Party power as it would fight: unspent stat points go on the recommended spread. */
const power = (s: RunState, ctx: RunContext) => {
  const copy = structuredClone(s);
  autoAllocate(copy, ctx);
  return partyPower(resolveBoard(copy.board, ctx.content));
};

/** Spend every point one at a time with `pick` choosing the stat. */
function spendEach(s: RunState, ctx: RunContext, pick: (s: RunState, at: SlotRef) => (typeof STATS)[number]): RunState {
  let state = s;
  for (const at of filledSlots(state)) {
    for (let guard = 0; getSlot(state.board, at)!.statPoints > 0 && guard < 100; guard++) {
      state = tryAct(state, { type: 'allocate', at, points: { [pick(state, at)]: 1 } }, ctx) ?? state;
    }
  }
  return state;
}

/** Buys random affordable offers for random valid targets; sometimes rerolls; random choices. */
export const randomBot: Bot = {
  name: 'random',
  description: 'Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices and stat points.',
  shop(state, ctx, rng) {
    let s = state;
    for (let guard = 0; guard < 30; guard++) {
      const options = affordable(s).flatMap((i) => targetsFor(s, i, ctx).map((to) => ({ i, to })));
      if (options.length > 0 && (unitCount(s.board) === 0 || !rng.chance(0.15))) {
        const { i, to } = rng.pick(options);
        s = tryAct(s, { type: 'buy', offer: i, to }, ctx) ?? s;
      } else if (s.gold > ctx.config.rerollCost && rng.chance(0.3)) {
        s = tryAct(s, { type: 'reroll' }, ctx) ?? s;
      } else break;
    }
    return s;
  },
  choose: (_s, choice, _ctx, rng) => rng.int(choice.options.length),
  allocate: (s, ctx, rng) => spendEach(s, ctx, () => rng.pick(STATS)),
};

/**
 * Wants two frontliners, then class variety. Once full, gears up its
 * highest-level units and buys training for them. Random level-up choices.
 */
export const sensibleBot: Bot = {
  name: 'sensible',
  description: 'Two frontliners then class variety; then items/training for its best units; random level-up choices.',
  shop(state, ctx, rng) {
    let s = state;
    const isFront = (classId: string) => (ctx.content.classes[classId]?.placement ?? 9) <= 1;
    const owned = () => [...s.board.front, ...s.board.back].flatMap((u) => (u ? [u.classId] : []));
    for (let guard = 0; guard < 30; guard++) {
      const units = affordable(s).filter((i) => s.shop[i]!.kind === 'unit');
      if (unitCount(s.board) < 5 && units.length > 0) {
        const have = owned();
        const needFront = have.filter(isFront).length < 2;
        const score = (i: number) => {
          const id = (s.shop[i] as { classId: string }).classId;
          return (needFront && isFront(id) ? 2 : 0) + (have.includes(id) ? 0 : 1);
        };
        const best = [...units].sort((a, b) => score(b) - score(a))[0]!;
        s = tryAct(s, { type: 'buy', offer: best }, ctx) ?? s;
        continue;
      }
      // Gear up: best target = highest level.
      const gear = affordable(s).filter((i) => s.shop[i]!.kind !== 'unit' && targetsFor(s, i, ctx).length > 0);
      if (gear.length > 0 && unitCount(s.board) >= 3) {
        const i = gear[0]!;
        const to = [...targetsFor(s, i, ctx)].sort((a, b) => getSlot(s.board, b)!.level - getSlot(s.board, a)!.level)[0]!;
        s = tryAct(s, { type: 'buy', offer: i, to }, ctx) ?? s;
        continue;
      }
      if (unitCount(s.board) >= 5 && s.gold >= 8 && rng.chance(0.5)) {
        s = tryAct(s, { type: 'reroll' }, ctx) ?? s;
        continue;
      }
      break;
    }
    return s;
  },
  choose: (_s, choice, _ctx, rng) => rng.int(choice.options.length),
};

/** Buys whatever raises its estimated party power most; picks power-maximizing choices. */
export const greedyBot: Bot = {
  name: 'greedy',
  description: 'Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices and stat points the same way.',
  shop(state, ctx, rng) {
    let s = state;
    for (let guard = 0; guard < 30; guard++) {
      const base = power(s, ctx);
      let best: { s: RunState; gain: number } | null = null;
      for (const i of affordable(s)) {
        for (const to of targetsFor(s, i, ctx)) {
          let next = tryAct(s, { type: 'buy', offer: i, to }, ctx);
          if (!next) continue;
          next = resolvePending(greedyBot, next, ctx, rng);
          const gain = (power(next, ctx) - base) / s.shop[i]!.cost;
          if (gain > 0 && (!best || gain > best.gain)) best = { s: next, gain };
        }
      }
      if (best) {
        s = best.s;
        continue;
      }
      if (unitCount(s.board) >= 5 && s.gold >= 7) {
        s = tryAct(s, { type: 'reroll' }, ctx) ?? s;
        continue;
      }
      break;
    }
    return s;
  },
  choose(state, choice, ctx) {
    let bestIdx = 0;
    let bestPower = -Infinity;
    choice.options.forEach((_, idx) => {
      const r = applyShopAction(state, { type: 'choose', option: idx }, ctx);
      const p = r.ok ? power(r.state, ctx) : -Infinity;
      if (p > bestPower) [bestIdx, bestPower] = [idx, p];
    });
    return bestIdx;
  },
  allocate: (s, ctx) =>
    spendEach(s, ctx, (state, at) => {
      let best: (typeof STATS)[number] = 'hp';
      let bestPower = -Infinity;
      for (const stat of STATS) {
        const r = applyShopAction(state, { type: 'allocate', at, points: { [stat]: 1 } }, ctx);
        const p = r.ok ? power(r.state, ctx) : -Infinity;
        if (p > bestPower) [best, bestPower] = [stat, p];
      }
      return best;
    }),
};

/** Picks a random synergy tag per run and builds around it. */
export function synergyTagOf(state: RunState, ctx: RunContext): string {
  const tags = [...new Set(ctx.content.synergies.flatMap((s) => s.tiers.flatMap((t) => t.requires.flatMap((r) => (r.kind === 'tag' ? [r.tag] : [])))))].sort();
  // Derive the run's target tag from its seed so it's stable across rounds.
  let h = 0;
  for (const ch of state.seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tags[h % tags.length]!;
}

const hasTag = (classId: string, tag: string, ctx: RunContext) =>
  (ctx.content.classes[classId]?.tags ?? ctx.content.advancedClasses[classId]?.tags ?? []).includes(tag) ||
  (ctx.content.classes[classId]?.advancedClasses ?? []).some((a) => ctx.content.advancedClasses[a]?.tags.includes(tag));

export const synergyBot: Bot = {
  name: 'synergy',
  description: 'Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.',
  shop(state, ctx, rng) {
    const tag = synergyTagOf(state, ctx);
    let s = state;
    for (let guard = 0; guard < 30; guard++) {
      const offers = affordable(s);
      const unitOffer = offers.find((i) => {
        const o = s.shop[i]!;
        return o.kind === 'unit' && hasTag(o.classId, tag, ctx);
      });
      if (unitOffer !== undefined && unitCount(s.board) < 5) {
        s = tryAct(s, { type: 'buy', offer: unitOffer }, ctx) ?? s;
        continue;
      }
      // Fill out with anything if the party is small.
      const anyUnit = offers.find((i) => s.shop[i]!.kind === 'unit');
      if (anyUnit !== undefined && unitCount(s.board) < 3) {
        s = tryAct(s, { type: 'buy', offer: anyUnit }, ctx) ?? s;
        continue;
      }
      const gear = offers.find((i) => s.shop[i]!.kind !== 'unit' && targetsFor(s, i, ctx).length > 0);
      if (gear !== undefined) {
        const targets = targetsFor(s, gear, ctx);
        const tagged = targets.filter((t) => hasTag(getSlot(s.board, t)!.classId, tag, ctx));
        s = tryAct(s, { type: 'buy', offer: gear, to: (tagged[0] ?? targets[0])! }, ctx) ?? s;
        continue;
      }
      if (s.gold >= 6 && rng.chance(0.6)) {
        s = tryAct(s, { type: 'reroll' }, ctx) ?? s;
        continue;
      }
      break;
    }
    return s;
  },
  choose(state, choice, ctx, rng) {
    if (choice.kind !== 'talent') {
      const tag = synergyTagOf(state, ctx);
      const tags = (id: string) => (choice.kind === 'advance' ? ctx.content.advancedClasses[id] : ctx.content.tertiaryClasses[id])?.tags;
      const idx = choice.options.findIndex((id) => tags(id)?.includes(tag));
      if (idx >= 0) return idx;
    }
    return rng.int(choice.options.length);
  },
};

export const BOTS: readonly Bot[] = [randomBot, sensibleBot, greedyBot, synergyBot];


import { simulateCombat } from '../combat.ts';
import { Rng } from '../rng.ts';
import {
  autoPlaceSlot,
  boardToParty,
  emptyBoard,
  getSlot,
  isValidSlot,
  setSlot,
  templateFor,
  unitCount,
} from './board.ts';
import { roundIncome } from './economy.ts';
import { generateEnemy } from './enemies.ts';
import { rollShop } from './shop.ts';
import type { ActionResult, FightResult, RunContext, RunError, RunState, ShopAction } from './types.ts';

/** Start a run. Round 1 opens with starting gold and a free shop. */
export function createRun(seed: string, ctx: RunContext): RunState {
  const rng = new Rng(`${seed}:shop`);
  const shop = rollShop(rng, ctx);
  return {
    seed,
    rngState: rng.getState(),
    phase: 'shop',
    round: 1,
    lives: ctx.config.startingLives,
    wins: 0,
    losses: 0,
    draws: 0,
    gold: ctx.config.startingGold,
    winStreak: 0,
    lossStreak: 0,
    board: emptyBoard(),
    shop,
    nextUid: 1,
    history: [],
  };
}

const fail = (error: RunError): { ok: false; error: RunError } => ({ ok: false, error });

/** Apply a shop-phase action. Never mutates `state`. */
export function applyShopAction(state: RunState, action: ShopAction, ctx: RunContext): ActionResult {
  if (state.phase !== 'shop') return fail('notShopPhase');
  const next = structuredClone(state);

  switch (action.type) {
    case 'buy': {
      const offer = next.shop[action.offer];
      if (!offer) return fail('noSuchOffer');
      if (next.gold < offer.cost) return fail('notEnoughGold');
      let slot = action.to;
      if (slot) {
        if (!isValidSlot(slot)) return fail('invalidSlot');
        if (getSlot(next.board, slot) !== null) return fail('slotOccupied');
      } else {
        slot = autoPlaceSlot(next.board, templateFor(ctx.content, offer.classId)) ?? undefined;
        if (!slot) return fail('boardFull');
      }
      setSlot(next.board, slot, { uid: next.nextUid, classId: offer.classId, name: offer.name });
      next.nextUid += 1;
      next.gold -= offer.cost;
      next.shop[action.offer] = null;
      return { ok: true, state: next };
    }
    case 'sell': {
      if (!isValidSlot(action.from)) return fail('invalidSlot');
      if (getSlot(next.board, action.from) === null) return fail('emptySlot');
      setSlot(next.board, action.from, null);
      next.gold += ctx.config.sellRefund;
      return { ok: true, state: next };
    }
    case 'move': {
      if (!isValidSlot(action.from) || !isValidSlot(action.to)) return fail('invalidSlot');
      const moving = getSlot(next.board, action.from) ?? null;
      if (moving === null) return fail('emptySlot');
      // Moving onto an occupied slot swaps the two units.
      setSlot(next.board, action.from, getSlot(next.board, action.to) ?? null);
      setSlot(next.board, action.to, moving);
      return { ok: true, state: next };
    }
    case 'reroll': {
      if (next.gold < ctx.config.rerollCost) return fail('notEnoughGold');
      next.gold -= ctx.config.rerollCost;
      const rng = new Rng(next.rngState);
      next.shop = rollShop(rng, ctx);
      next.rngState = rng.getState();
      return { ok: true, state: next };
    }
  }
}

/**
 * End the shop phase: fight this round's enemy, then settle lives, wins,
 * streaks and income. Draws count as neither a win nor a loss.
 */
export function fight(state: RunState, ctx: RunContext): FightResult {
  if (state.phase !== 'shop') return fail('notShopPhase');
  if (unitCount(state.board) === 0) return fail('emptyBoard');

  const next = structuredClone(state);
  const playerParty = boardToParty(next.board, ctx.content);
  const enemyParty = generateEnemy(next.seed, next.round, ctx.content);
  const combat = simulateCombat({
    player: playerParty,
    enemy: enemyParty,
    rng: new Rng(`${next.seed}:combat:${next.round}`),
  });

  if (combat.winner === 'player') {
    next.wins += 1;
    next.winStreak += 1;
    next.lossStreak = 0;
  } else if (combat.winner === 'enemy') {
    next.losses += 1;
    next.lives -= 1;
    next.lossStreak += 1;
    next.winStreak = 0;
  } else {
    next.draws += 1;
    next.winStreak = 0;
    next.lossStreak = 0;
  }

  const enemyIds = [...enemyParty.front, ...enemyParty.back].flatMap((u) => (u ? [u.classId] : []));
  let income = null;
  if (next.wins >= ctx.config.winsToComplete) {
    next.phase = 'complete';
  } else if (next.lives <= 0) {
    next.phase = 'defeated';
  } else {
    income = roundIncome(next.gold, next.winStreak, next.lossStreak, ctx.config);
    next.gold += income.total;
    next.round += 1;
    const rng = new Rng(next.rngState);
    next.shop = rollShop(rng, ctx);
    next.rngState = rng.getState();
  }
  next.history.push({ round: state.round, result: combat.winner, enemy: enemyIds, income });

  return { ok: true, state: next, combat, playerParty, enemyParty, income };
}

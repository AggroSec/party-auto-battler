import { simulateCombat } from '../combat.ts';
import { Rng } from '../rng.ts';
import { autoPlaceSlot, emptyBoard, getSlot, isValidSlot, setSlot, unitCount } from './board.ts';
import { boardUnits, classFor, effectiveClassId, newUnit, resolveBoard } from './build.ts';
import { roundIncome } from './economy.ts';
import { generateEnemy } from './enemies.ts';
import { allocatePoints, applyChoice, choiceOptions, grantXp, isMaxLevel, recommendedAllocation } from './progression.ts';
import { rollShop } from './shop.ts';
import type { ActionResult, FightResult, OwnedUnit, PendingChoice, RunContext, RunError, RunState, ShopAction } from './types.ts';

/** Start a run. Round 1 opens with starting gold and a free shop. */
export function createRun(seed: string, ctx: RunContext): RunState {
  const rng = new Rng(`${seed}:shop`);
  const board = emptyBoard();
  const shop = rollShop(rng, ctx, board);
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
    board,
    shop,
    pending: [],
    nextUid: 1,
    history: [],
  };
}

const fail = (error: RunError): { ok: false; error: RunError } => ({ ok: false, error });

/** Run `fn` with the state's shop RNG and store the advanced RNG position back. */
function withRng<T>(state: RunState, fn: (rng: Rng) => T): T {
  const rng = new Rng(state.rngState);
  const out = fn(rng);
  state.rngState = rng.getState();
  return out;
}

function findUnit(state: RunState, uid: number): OwnedUnit | undefined {
  return boardUnits(state.board).find((u) => u.uid === uid);
}

/** Give XP to a unit and queue any level-up choices. */
function addXp(state: RunState, unit: OwnedUnit, amount: number, ctx: RunContext): void {
  const choices = withRng(state, (rng) => grantXp(unit, amount, ctx.content, ctx.config.progression, rng));
  state.pending.push(...choices);
}

/** Apply a shop-phase action. Never mutates `state`. */
export function applyShopAction(state: RunState, action: ShopAction, ctx: RunContext): ActionResult {
  if (state.phase !== 'shop') return fail('notShopPhase');
  const next = structuredClone(state);
  const { progression } = ctx.config;

  switch (action.type) {
    case 'buy': {
      const offer = next.shop[action.offer];
      if (!offer) return fail('noSuchOffer');
      if (next.gold < offer.cost) return fail('notEnoughGold');
      if (action.to && !isValidSlot(action.to)) return fail('invalidSlot');

      if (offer.kind === 'unit') {
        let slot = action.to;
        if (slot) {
          if (getSlot(next.board, slot) !== null) return fail('slotOccupied');
        } else {
          slot = autoPlaceSlot(next.board, classFor(ctx.content, offer.classId)) ?? undefined;
          if (!slot) return fail('boardFull');
        }
        setSlot(next.board, slot, newUnit(next.nextUid, offer.classId, offer.name));
        next.nextUid += 1;
      } else {
        if (!action.to) return fail('needsTarget');
        const unit = getSlot(next.board, action.to);
        if (!unit) return fail('emptySlot');
        if (offer.kind === 'item') {
          if (unit.items.length >= progression.maxItemsPerUnit) return fail('itemSlotsFull');
          unit.items.push(offer.itemId);
        } else {
          if (unit.classId !== offer.classId) return fail('wrongClass');
          if (isMaxLevel(unit, progression)) return fail('maxLevel');
          addXp(next, unit, offer.xp, ctx);
        }
      }
      next.gold -= offer.cost;
      next.shop[action.offer] = null;
      return { ok: true, state: next };
    }
    case 'sell': {
      if (!isValidSlot(action.from)) return fail('invalidSlot');
      const unit = getSlot(next.board, action.from);
      if (!unit) return fail('emptySlot');
      setSlot(next.board, action.from, null);
      next.pending = next.pending.filter((p) => p.uid !== unit.uid);
      next.gold += ctx.config.sellRefund + unit.items.length * progression.itemSellRefund;
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
    case 'moveItem': {
      if (!isValidSlot(action.from) || !isValidSlot(action.to)) return fail('invalidSlot');
      const from = getSlot(next.board, action.from);
      const to = getSlot(next.board, action.to);
      if (!from || !to) return fail('emptySlot');
      const itemId = from.items[action.item];
      if (itemId === undefined) return fail('noSuchItem');
      if (from === to) return { ok: true, state: next };
      if (to.items.length >= progression.maxItemsPerUnit) return fail('itemSlotsFull');
      from.items.splice(action.item, 1);
      to.items.push(itemId);
      return { ok: true, state: next };
    }
    case 'sellItem': {
      if (!isValidSlot(action.from)) return fail('invalidSlot');
      const unit = getSlot(next.board, action.from);
      if (!unit) return fail('emptySlot');
      if (unit.items[action.item] === undefined) return fail('noSuchItem');
      unit.items.splice(action.item, 1);
      next.gold += progression.itemSellRefund;
      return { ok: true, state: next };
    }
    case 'reroll': {
      if (next.gold < ctx.config.rerollCost) return fail('notEnoughGold');
      next.gold -= ctx.config.rerollCost;
      next.shop = withRng(next, (rng) => rollShop(rng, ctx, next.board));
      return { ok: true, state: next };
    }
    case 'choose': {
      const choice = next.pending[0];
      if (!choice) return fail('noPendingChoice');
      const unit = findUnit(next, choice.uid);
      if (!unit || !applyChoice(unit, choice, action.option)) return fail('invalidChoice');
      next.pending.shift();
      if (choice.kind !== 'talent') {
        // Choices queued behind this class choice can roll their options now;
        // drop any whose pool turns out empty (null = still waiting on another class choice).
        const empty = new Set<PendingChoice>();
        for (const p of next.pending) {
          if (p.uid !== unit.uid || p.options.length > 0) continue;
          const options = withRng(next, (rng) => choiceOptions(unit, p, ctx.content, progression, rng));
          if (options === null) continue;
          if (options.length === 0) empty.add(p);
          p.options = options;
        }
        next.pending = next.pending.filter((p) => !empty.has(p));
      }
      return { ok: true, state: next };
    }
    case 'allocate': {
      if (!isValidSlot(action.at)) return fail('invalidSlot');
      const unit = getSlot(next.board, action.at);
      if (!unit) return fail('emptySlot');
      const total = Object.values(action.points).reduce((s, n) => s + (n ?? 0), 0);
      if (total > unit.statPoints) return fail('notEnoughPoints');
      if (!allocatePoints(unit, action.points, progression)) return fail('invalidAllocation');
      return { ok: true, state: next };
    }
  }
}

/** Spend every unit's leftover stat points on its recommended spread. */
export function autoAllocate(state: RunState, ctx: RunContext): void {
  const { progression } = ctx.config;
  for (const unit of boardUnits(state.board)) {
    if (unit.statPoints > 0) allocatePoints(unit, recommendedAllocation(unit, ctx.content, progression), progression);
  }
}

/**
 * End the shop phase: fight this round's enemy, then settle lives, wins,
 * streaks, XP and income. Draws count as neither a win nor a loss.
 */
export function fight(state: RunState, ctx: RunContext): FightResult {
  if (state.phase !== 'shop') return fail('notShopPhase');
  if (unitCount(state.board) === 0) return fail('emptyBoard');
  if (state.pending.length > 0) return fail('pendingChoice');

  const next = structuredClone(state);
  autoAllocate(next, ctx);
  const playerParty = resolveBoard(next.board, ctx.content);
  const enemy = generateEnemy(next.seed, next.round, ctx);
  const combat = simulateCombat({
    player: playerParty,
    enemy: enemy.party,
    rng: new Rng(`${next.seed}:combat:${next.round}`),
  });

  const { progression } = ctx.config;
  let xp: number;
  if (combat.winner === 'player') {
    next.wins += 1;
    next.winStreak += 1;
    next.lossStreak = 0;
    xp = progression.xpPerWin;
  } else if (combat.winner === 'enemy') {
    next.losses += 1;
    next.lives -= 1;
    next.lossStreak += 1;
    next.winStreak = 0;
    xp = progression.xpPerLoss;
  } else {
    next.draws += 1;
    next.winStreak = 0;
    next.lossStreak = 0;
    xp = progression.xpPerDraw;
  }

  const enemyIds = boardUnits(enemy.builds).map(effectiveClassId);
  let income = null;
  if (next.wins >= ctx.config.winsToComplete) {
    next.phase = 'complete';
  } else if (next.lives <= 0) {
    next.phase = 'defeated';
  } else {
    for (const unit of boardUnits(next.board)) addXp(next, unit, xp, ctx);
    income = roundIncome(next.gold, next.winStreak, next.lossStreak, ctx.config);
    next.gold += income.total;
    next.round += 1;
    next.shop = withRng(next, (rng) => rollShop(rng, ctx, next.board));
  }
  next.history.push({ round: state.round, result: combat.winner, enemy: enemyIds, income });

  return { ok: true, state: next, combat, playerParty, enemyParty: enemy.party, enemyBuilds: enemy.builds, income };
}

import { describe, expect, it } from 'vitest';
import { newUnit } from './build.ts';
import { applyShopAction, createRun, fight } from './run.ts';
import { ARCHETYPES, TEST_CONFIG, makeCtx } from './test-fixtures.ts';
import type { RunContext, RunState, ShopAction } from './types.ts';

/** Apply an action that must succeed. */
function act(state: RunState, action: ShopAction, ctx: RunContext): RunState {
  const r = applyShopAction(state, action, ctx);
  if (!r.ok) throw new Error(`Action ${action.type} failed: ${r.error}`);
  return r.state;
}

function mustFight(state: RunState, ctx: RunContext) {
  const r = fight(state, ctx);
  if (!r.ok) throw new Error(`fight failed: ${r.error}`);
  return r;
}

/** A run with one unit of `classId` already on the board. */
function runWith(classId: string, ctx: RunContext, seed = 'seed'): RunState {
  const s = createRun(seed, ctx);
  s.board.front[0] = newUnit(99, classId, 'Hero');
  s.gold = 7;
  return s;
}

describe('createRun', () => {
  it('starts in the shop with starting gold, lives and a full shop', () => {
    const ctx = makeCtx();
    const s = createRun('seed', ctx);
    expect(s).toMatchObject({ phase: 'shop', round: 1, gold: 10, lives: 3, wins: 0 });
    expect(s.shop).toHaveLength(4);
    expect(s.shop.every((o) => o?.kind === 'unit' && ['tank', 'archer'].includes(o.classId) && o.cost === 3)).toBe(true);
  });

  it('is deterministic per seed', () => {
    const ctx = makeCtx();
    expect(createRun('a', ctx)).toEqual(createRun('a', ctx));
    expect(createRun('a', ctx).shop).not.toEqual(createRun('b', ctx).shop);
  });
});

describe('shop actions', () => {
  const ctx = makeCtx({ shopPool: ['tank'] });
  const start = () => createRun('seed', ctx);

  it('buy spends gold, removes the offer and auto-places the unit', () => {
    const s = act(start(), { type: 'buy', offer: 2 }, ctx);
    expect(s.gold).toBe(7);
    expect(s.shop[2]).toBeNull();
    expect(s.board.front[0]).toMatchObject({ uid: 1, classId: 'tank' });
    expect(s.nextUid).toBe(2);
  });

  it('buy can target a specific empty slot', () => {
    const s = act(start(), { type: 'buy', offer: 0, to: { row: 'back', col: 1 } }, ctx);
    expect(s.board.back[1]?.classId).toBe('tank');
  });

  it('rejects invalid purchases', () => {
    let s = act(start(), { type: 'buy', offer: 0 }, ctx);
    expect(applyShopAction(s, { type: 'buy', offer: 0 }, ctx)).toEqual({ ok: false, error: 'noSuchOffer' });
    expect(applyShopAction(s, { type: 'buy', offer: 9 }, ctx)).toEqual({ ok: false, error: 'noSuchOffer' });
    expect(applyShopAction(s, { type: 'buy', offer: 1, to: { row: 'front', col: 0 } }, ctx)).toEqual({
      ok: false,
      error: 'slotOccupied',
    });
    expect(applyShopAction(s, { type: 'buy', offer: 1, to: { row: 'front', col: 5 } }, ctx)).toEqual({
      ok: false,
      error: 'invalidSlot',
    });
    s = act(s, { type: 'buy', offer: 1 }, ctx);
    s = act(s, { type: 'buy', offer: 2 }, ctx);
    expect(s.gold).toBe(1);
    expect(applyShopAction(s, { type: 'buy', offer: 3 }, ctx)).toEqual({ ok: false, error: 'notEnoughGold' });
  });

  it('rejects buying onto a full board', () => {
    const rich = makeCtx({ shopPool: ['tank'], config: { startingGold: 100, shop: { ...TEST_CONFIG.shop, unitSlots: 6 } } });
    let s = createRun('seed', rich);
    for (let i = 0; i < 5; i++) s = act(s, { type: 'buy', offer: i }, rich);
    expect(applyShopAction(s, { type: 'buy', offer: 5 }, rich)).toEqual({ ok: false, error: 'boardFull' });
  });

  it('sell refunds gold and frees the slot', () => {
    let s = act(start(), { type: 'buy', offer: 0 }, ctx);
    s = act(s, { type: 'sell', from: { row: 'front', col: 0 } }, ctx);
    expect(s.gold).toBe(8);
    expect(s.board.front[0]).toBeNull();
    expect(applyShopAction(s, { type: 'sell', from: { row: 'front', col: 0 } }, ctx)).toEqual({
      ok: false,
      error: 'emptySlot',
    });
  });

  it('move relocates to an empty slot or swaps with an occupied one', () => {
    let s = act(start(), { type: 'buy', offer: 0 }, ctx);
    s = act(s, { type: 'buy', offer: 1 }, ctx);
    s = act(s, { type: 'move', from: { row: 'front', col: 0 }, to: { row: 'back', col: 0 } }, ctx);
    expect(s.board.front[0]).toBeNull();
    expect(s.board.back[0]?.uid).toBe(1);
    s = act(s, { type: 'move', from: { row: 'back', col: 0 }, to: { row: 'front', col: 1 } }, ctx);
    expect(s.board.front[1]?.uid).toBe(1);
    expect(s.board.back[0]?.uid).toBe(2);
    expect(applyShopAction(s, { type: 'move', from: { row: 'front', col: 2 }, to: { row: 'back', col: 0 } }, ctx)).toEqual(
      { ok: false, error: 'emptySlot' },
    );
  });

  it('reroll costs gold and replaces the shop deterministically', () => {
    const c = makeCtx();
    const s1 = act(createRun('r', c), { type: 'reroll' }, c);
    const s2 = act(createRun('r', c), { type: 'reroll' }, c);
    expect(s1.gold).toBe(9);
    expect(s1.shop).toEqual(s2.shop);
    expect(s1.rngState).not.toBe(createRun('r', c).rngState);
    const broke = makeCtx({ config: { startingGold: 0 } });
    expect(applyShopAction(createRun('r', broke), { type: 'reroll' }, broke)).toEqual({
      ok: false,
      error: 'notEnoughGold',
    });
  });

  it('recruit names avoid the party and each other while names last', () => {
    const c = makeCtx({ content: { unitNames: ['Ann', 'Bo', 'Cy', 'Di', 'Ed'] } });
    const s = runWith('tank', c);
    s.board.front[0]!.name = 'Ann';
    for (let i = 0; i < 20; i++) {
      const shop = act({ ...s, gold: 10 }, { type: 'reroll' }, c).shop;
      const names = shop.flatMap((o) => (o?.kind === 'unit' ? [o.name] : []));
      expect(names).not.toContain('Ann');
      expect(new Set(names).size).toBe(names.length);
      s.rngState += 1;
    }
  });

  it('never mutates the input state', () => {
    const s = start();
    const before = structuredClone(s);
    act(s, { type: 'buy', offer: 0 }, ctx);
    act(s, { type: 'reroll' }, ctx);
    expect(s).toEqual(before);
  });
});

describe('fight', () => {
  it('refuses to fight with an empty board', () => {
    const ctx = makeCtx();
    expect(fight(createRun('s', ctx), ctx)).toEqual({ ok: false, error: 'emptyBoard' });
  });

  it('a win adds a win, extends the streak, pays income and opens the next round', () => {
    const ctx = makeCtx();
    const s = runWith('titan', ctx);
    const r = mustFight(s, ctx);
    expect(r.combat.winner).toBe('player');
    expect(r.state).toMatchObject({ wins: 1, lives: 3, winStreak: 1, round: 2, phase: 'shop' });
    // 7 unspent gold -> 1 interest; streak of 1 pays nothing.
    expect(r.income).toEqual({ base: 5, interest: 1, streak: 0, total: 6 });
    expect(r.state.gold).toBe(13);
    expect(r.state.shop.every((o) => o !== null)).toBe(true);
    expect(r.state.history[0]).toMatchObject({ round: 1, result: 'player', enemy: ['tank'] });
  });

  it('a loss costs a life and starts a loss streak', () => {
    const ctx = makeCtx({ enemies: [ARCHETYPES.titan!] });
    const r = mustFight(runWith('archer', ctx), ctx);
    expect(r.combat.winner).toBe('enemy');
    expect(r.state).toMatchObject({ wins: 0, losses: 1, lives: 2, lossStreak: 1, round: 2 });
  });

  it('a draw is neither a win nor a loss and resets streaks', () => {
    const ctx = makeCtx({ enemies: [ARCHETYPES.wall!] });
    const r = mustFight(runWith('wall', ctx), ctx);
    expect(r.combat.winner).toBe('draw');
    expect(r.state).toMatchObject({ wins: 0, losses: 0, draws: 1, lives: 3, winStreak: 0, lossStreak: 0, round: 2 });
  });

  it('completes the run at winsToComplete', () => {
    const ctx = makeCtx();
    let s = runWith('titan', ctx);
    for (let i = 0; i < 3; i++) s = mustFight(s, ctx).state;
    expect(s).toMatchObject({ phase: 'complete', wins: 3, round: 3 });
    expect(fight(s, ctx)).toEqual({ ok: false, error: 'notShopPhase' });
    expect(applyShopAction(s, { type: 'reroll' }, ctx)).toEqual({ ok: false, error: 'notShopPhase' });
  });

  it('ends the run at 0 lives', () => {
    const ctx = makeCtx({ enemies: [ARCHETYPES.titan!] });
    let s = runWith('archer', ctx);
    for (let i = 0; i < 3; i++) s = mustFight(s, ctx).state;
    expect(s).toMatchObject({ phase: 'defeated', lives: 0, losses: 3 });
    expect(s.history).toHaveLength(3);
    expect(s.history.at(-1)?.income).toBeNull();
  });

  it("rerolling doesn't change the enemy you face", () => {
    const ctx = makeCtx();
    const base = runWith('tank', ctx);
    const plain = mustFight(base, ctx);
    const rerolled = mustFight(act(base, { type: 'reroll' }, ctx), ctx);
    expect(rerolled.enemyParty).toEqual(plain.enemyParty);
  });
});

describe('stat points, level cap and full-party shop', () => {
  const ctx = makeCtx({ enemies: [ARCHETYPES.titan!] });
  const at = { row: 'front', col: 0 } as const;

  it('allocate spends points on the unit in a slot', () => {
    const s = runWith('archer', ctx);
    s.board.front[0]!.statPoints = 3;
    const next = act(s, { type: 'allocate', at, points: { atk: 2, spd: 1 } }, ctx);
    expect(next.board.front[0]).toMatchObject({ statPoints: 0, growth: { hp: 0, atk: 2, def: 0, spd: 1 } });
    expect(applyShopAction(s, { type: 'allocate', at, points: { atk: 4 } }, ctx)).toEqual({ ok: false, error: 'notEnoughPoints' });
    expect(applyShopAction(s, { type: 'allocate', at, points: { atk: -1 } }, ctx)).toEqual({ ok: false, error: 'invalidAllocation' });
    expect(applyShopAction(s, { type: 'allocate', at: { row: 'back', col: 0 }, points: { atk: 1 } }, ctx)).toEqual({ ok: false, error: 'emptySlot' });
  });

  it('fighting spends leftover points on the recommended spread', () => {
    const s = runWith('archer', ctx);
    s.board.front[0]!.statPoints = 4;
    const r = mustFight(s, ctx);
    expect(r.state.board.front[0]).toMatchObject({ statPoints: expect.any(Number), growth: { hp: 3, atk: 2, def: 0, spd: 1 } });
    expect(r.playerParty.front[0]?.stats.atk).toBe(TEST_CONFIG.progression.statPointValue.atk * 2 + 6);
  });

  it('max-level units refuse training, and the shop stops offering it for them', () => {
    const c = makeCtx({ config: { shop: { unitSlots: 0, extraSlots: 30, trainingChance: 1, fullPartyUnitSlots: 0 } } });
    const s = runWith('archer', c);
    s.board.front[0]!.level = 5;
    s.shop = [{ kind: 'training', classId: 'archer', xp: 2, cost: 3 }];
    expect(applyShopAction(s, { type: 'buy', offer: 0, to: at }, c)).toEqual({ ok: false, error: 'maxLevel' });
    expect(act(s, { type: 'reroll' }, c).shop.every((o) => o?.kind === 'item')).toBe(true);
  });

  it('a full board gets fewer recruit offers and more items', () => {
    const c = makeCtx({ config: { shop: { unitSlots: 4, extraSlots: 2, trainingChance: 0, fullPartyUnitSlots: 2 } } });
    let s = createRun('full', c);
    for (const [row, col] of [['front', 0], ['front', 1], ['front', 2], ['back', 0], ['back', 1]] as const) s.board[row][col] = newUnit(10 + col + (row === 'back' ? 3 : 0), 'tank', `U${row}${col}`);
    s = act(s, { type: 'reroll' }, c);
    expect(s.shop.map((o) => o?.kind)).toEqual(['unit', 'unit', 'item', 'item', 'item', 'item']);
  });
});

describe('determinism and saves', () => {
  const ctx = makeCtx({ config: { startingGold: 20 } });
  const script = (s: RunState): RunState => {
    s = act(s, { type: 'buy', offer: 0 }, ctx);
    s = act(s, { type: 'reroll' }, ctx);
    s = act(s, { type: 'buy', offer: 1 }, ctx);
    s = mustFight(s, ctx).state;
    while (s.pending.length > 0) s = act(s, { type: 'choose', option: 0 }, ctx);
    s = act(s, { type: 'reroll' }, ctx);
    return mustFight(s, ctx).state;
  };

  it('same seed and actions produce the same run', () => {
    expect(script(createRun('d', ctx))).toEqual(script(createRun('d', ctx)));
  });

  it('a JSON round-trip mid-run resumes identically', () => {
    let s = createRun('d', ctx);
    s = act(s, { type: 'buy', offer: 0 }, ctx);
    const saved: RunState = JSON.parse(JSON.stringify(s));
    expect(saved).toEqual(s);
    expect(mustFight(saved, ctx).state).toEqual(mustFight(s, ctx).state);
  });
});

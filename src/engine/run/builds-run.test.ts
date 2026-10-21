// Run-loop behaviour for M3 systems: items, training, level-up choices, XP.
import { describe, expect, it } from 'vitest';
import { newUnit } from './build.ts';
import { generateEnemy } from './enemies.ts';
import { applyShopAction, createRun, fight } from './run.ts';
import { ARCHETYPES, TEMPLATES, TEST_CONFIG, makeCtx } from './test-fixtures.ts';
import type { RunContext, RunState, ShopAction, ShopOffer } from './types.ts';

function act(state: RunState, action: ShopAction, ctx: RunContext): RunState {
  const r = applyShopAction(state, action, ctx);
  if (!r.ok) throw new Error(`Action ${action.type} failed: ${r.error}`);
  return r.state;
}

const ctx = makeCtx({ config: { startingGold: 50 } });
const front0 = { row: 'front', col: 0 } as const;
const front1 = { row: 'front', col: 1 } as const;

/** A run with a tank in front 0 and the given shop offers. */
function setup(offers: ShopOffer[]): RunState {
  const s = createRun('b', ctx);
  s.board.front[0] = newUnit(1, 'tank', 'T');
  s.shop = offers;
  return s;
}

describe('shop extras', () => {
  it('rolls training only for classes on the board, items otherwise', () => {
    const c = makeCtx({ config: { shop: { unitSlots: 0, extraSlots: 30, trainingChance: 0.5, fullPartyUnitSlots: 0 } } });
    expect(createRun('x', c).shop.every((o) => o?.kind === 'item')).toBe(true);
    let s = createRun('x', c);
    s.board.back[0] = newUnit(1, 'archer', 'A');
    s = act(s, { type: 'reroll' }, c);
    const kinds = new Set(s.shop.map((o) => o?.kind));
    expect(kinds).toEqual(new Set(['item', 'training']));
    expect(s.shop.every((o) => o?.kind !== 'training' || o.classId === 'archer')).toBe(true);
  });

  it('buying an item needs a target unit with a free item slot', () => {
    const sword: ShopOffer = { kind: 'item', itemId: 'sword', cost: 3 };
    const s = setup([sword, sword, sword]);
    expect(applyShopAction(s, { type: 'buy', offer: 0 }, ctx)).toEqual({ ok: false, error: 'needsTarget' });
    expect(applyShopAction(s, { type: 'buy', offer: 0, to: front1 }, ctx)).toEqual({ ok: false, error: 'emptySlot' });
    let t = act(s, { type: 'buy', offer: 0, to: front0 }, ctx);
    t = act(t, { type: 'buy', offer: 1, to: front0 }, ctx);
    expect(t.board.front[0]?.items).toEqual(['sword', 'sword']);
    expect(t.gold).toBe(44);
    expect(applyShopAction(t, { type: 'buy', offer: 2, to: front0 }, ctx)).toEqual({ ok: false, error: 'itemSlotsFull' });
  });

  it('training gives XP to a unit of the matching class and can queue level-ups', () => {
    const s = setup([
      { kind: 'training', classId: 'archer', xp: 2, cost: 3 },
      { kind: 'training', classId: 'tank', xp: 2, cost: 3 },
    ]);
    expect(applyShopAction(s, { type: 'buy', offer: 0, to: front0 }, ctx)).toEqual({ ok: false, error: 'wrongClass' });
    const t = act(s, { type: 'buy', offer: 1, to: front0 }, ctx);
    expect(t.board.front[0]).toMatchObject({ xp: 2, level: 2 });
    expect(t.pending).toEqual([expect.objectContaining({ uid: 1, level: 2, kind: 'talent' })]);
  });

  it('moveItem moves an item between units, respecting slots', () => {
    let s = setup([]);
    s.board.front[0]!.items = ['sword', 'boots'];
    s.board.front[1] = newUnit(2, 'archer', 'A');
    s = act(s, { type: 'moveItem', from: front0, item: 1, to: front1 }, ctx);
    expect(s.board.front[0]?.items).toEqual(['sword']);
    expect(s.board.front[1]?.items).toEqual(['boots']);
    expect(applyShopAction(s, { type: 'moveItem', from: front0, item: 5, to: front1 }, ctx)).toEqual({
      ok: false,
      error: 'noSuchItem',
    });
  });

  it('sellItem frees the slot for the item refund', () => {
    let s = setup([]);
    s.board.front[0]!.items = ['sword', 'boots'];
    const gold = s.gold;
    s = act(s, { type: 'sellItem', from: front0, item: 0 }, ctx);
    expect(s.board.front[0]?.items).toEqual(['boots']);
    expect(s.gold).toBe(gold + ctx.config.progression.itemSellRefund);
    expect(applyShopAction(s, { type: 'sellItem', from: front0, item: 3 }, ctx)).toEqual({ ok: false, error: 'noSuchItem' });
    expect(applyShopAction(s, { type: 'sellItem', from: front1, item: 0 }, ctx)).toEqual({ ok: false, error: 'emptySlot' });
  });

  it('selling refunds equipped items and drops the unit’s pending choices', () => {
    let s = setup([{ kind: 'training', classId: 'tank', xp: 2, cost: 3 }]);
    s.board.front[0]!.items = ['sword', 'boots'];
    s = act(s, { type: 'buy', offer: 0, to: front0 }, ctx);
    expect(s.pending).toHaveLength(1);
    const gold = s.gold;
    s = act(s, { type: 'sell', from: front0 }, ctx);
    expect(s.gold).toBe(gold + 1 + 2);
    expect(s.pending).toEqual([]);
  });
});

describe('level-up choices', () => {
  const leveled = () => act(setup([{ kind: 'training', classId: 'tank', xp: 5, cost: 3 }]), { type: 'buy', offer: 0, to: front0 }, ctx);

  it('pending choices block the next fight until resolved, in order', () => {
    let s = leveled();
    expect(s.pending.map((p) => p.kind)).toEqual(['talent', 'advance']);
    expect(fight(s, ctx)).toEqual({ ok: false, error: 'pendingChoice' });
    const talent = s.pending[0]!.options[1]!;
    s = act(s, { type: 'choose', option: 1 }, ctx);
    expect(s.board.front[0]?.talents).toEqual([talent]);
    s = act(s, { type: 'choose', option: 0 }, ctx);
    expect(s.board.front[0]?.advancedClassId).toBe('paladin');
    expect(fight(s, ctx).ok).toBe(true);
  });

  it('rejects bad choices', () => {
    expect(applyShopAction(createRun('c', ctx), { type: 'choose', option: 0 }, ctx)).toEqual({ ok: false, error: 'noPendingChoice' });
    expect(applyShopAction(leveled(), { type: 'choose', option: 7 }, ctx)).toEqual({ ok: false, error: 'invalidChoice' });
  });

  it('rolls deferred post-advance talent options once the advanced class is picked', () => {
    let s = act(setup([{ kind: 'training', classId: 'tank', xp: 9, cost: 3 }]), { type: 'buy', offer: 0, to: front0 }, ctx);
    expect(s.pending.map((p) => [p.kind, p.options.length])).toEqual([
      ['talent', 3],
      ['advance', 2],
      ['talent', 0],
    ]);
    s = act(s, { type: 'choose', option: 0 }, ctx);
    const taken = s.board.front[0]!.talents[0]!;
    s = act(s, { type: 'choose', option: 0 }, ctx); // paladin
    // The paladin's two talents, topped up with an unpicked tank talent.
    const options = s.pending[0]!.options;
    expect(options.slice(0, 2).sort()).toEqual(['holy1', 'holy2']);
    expect(['tough', 'strong', 'quick', 'sturdy'].filter((t) => t !== taken)).toContain(options[2]);
  });

  it('drops a deferred choice when no talents are left anywhere', () => {
    const bare = makeCtx({ content: { classes: { ...TEMPLATES, tank: { ...TEMPLATES.tank, talents: [] } } } });
    const s = applyShopAction(setup([{ kind: 'training', classId: 'tank', xp: 9, cost: 3 }]), { type: 'buy', offer: 0, to: front0 }, bare);
    if (!s.ok) throw new Error(s.error);
    expect(s.state.pending.map((p) => p.kind)).toEqual(['advance', 'talent']);
    const r = applyShopAction(s.state, { type: 'choose', option: 1 }, bare); // brute: no talents either
    expect(r.ok && r.state.pending).toEqual([]);
  });
});

describe('XP from combat', () => {
  it('every unit on the board earns XP by result', () => {
    const titanCtx = makeCtx({ content: { synergies: [] } });
    const s = createRun('x', titanCtx);
    s.board.front[0] = newUnit(1, 'titan', 'T');
    s.board.back[0] = newUnit(2, 'archer', 'A');
    const r = fight(s, titanCtx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.board.front[0]?.xp).toBe(TEST_CONFIG.progression.xpPerWin);
    expect(r.state.board.back[0]?.xp).toBe(TEST_CONFIG.progression.xpPerWin);

    const lossCtx = makeCtx({ enemies: [ARCHETYPES.titan!] });
    const l = createRun('x', lossCtx);
    l.board.back[0] = newUnit(2, 'archer', 'A');
    const lr = fight(l, lossCtx);
    if (!lr.ok) throw new Error(lr.error);
    expect(lr.state.board.back[0]?.xp).toBe(TEST_CONFIG.progression.xpPerLoss);
  });
});

describe('enemy development', () => {
  it('levels enemies by round with advanced classes, talents and items', () => {
    const c = makeCtx({
      enemies: [ARCHETYPES.grunt!],
      content: { enemyProgression: { levelByRound: [1, 5], itemsByRound: [0, 2] } },
    });
    const early = generateEnemy('e', 1, c).builds.front[0]!;
    expect(early).toMatchObject({ level: 1, advancedClassId: null, talents: [], items: [] });
    const late = generateEnemy('e', 2, c).builds.front[0]!;
    expect(late.level).toBe(5);
    expect(['paladin', 'brute']).toContain(late.advancedClassId);
    expect(late.talents.length).toBeGreaterThanOrEqual(1);
    expect(late.items).toHaveLength(2);
    expect(generateEnemy('e', 2, c)).toEqual(generateEnemy('e', 2, c));
  });
});

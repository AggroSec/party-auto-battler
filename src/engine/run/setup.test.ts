import { describe, expect, it } from 'vitest';
import { NEVER_CAST } from '../test-helpers.ts';
import { activeSynergies, boardUnits, newUnit, resolveUnit } from './build.ts';
import type { BossDef, ItemDef, LadderTier, PerkDef, SynergyDef } from './content-types.ts';
import { generateEnemy } from './enemies.ts';
import { applyShopAction, createRun, fight, rerollCost } from './run.ts';
import { defaultSetup, mergeRunModifiers, recruitCost, runContext } from './setup.ts';
import { makeCtx } from './test-fixtures.ts';
import type { RunContext, RunSetup, RunState, ShopAction } from './types.ts';

const LADDER: LadderTier[] = [
  { tier: 1, description: 'stronger', modifier: { enemyStats: 0.5 } },
  { tier: 2, description: 'poorer', modifier: { startingGold: -4, startingLives: -1 } },
  { tier: 3, description: 'elites', modifier: { elitesFrom: 1 } },
  { tier: 4, description: 'bosses', modifier: { bossRounds: [2], empoweredBosses: true } },
];
const PERKS: Record<string, PerkDef> = {
  rich: { id: 'rich', name: 'Rich', description: '+3 gold', modifier: { startingGold: 3 } },
  bargain: { id: 'bargain', name: 'Bargain', description: 'free reroll', modifier: { freeReroll: true } },
  vet: { id: 'vet', name: 'Vet', description: 'level 2', modifier: { veteranRecruit: true } },
  wind: { id: 'wind', name: 'Wind', description: 'free loss', modifier: { secondWind: true } },
  armory: { id: 'armory', name: 'Armory', description: 'free item', modifier: { freeItem: true } },
  cheap: { id: 'cheap', name: 'Cheap', description: 'cheap recruits', modifier: { earlyRecruitCost: { rounds: 2, cost: 1 } } },
};
const BOSS: BossDef = {
  id: 'king',
  name: 'The King',
  classId: 'tank',
  minRound: 1,
  statMultiplier: { hp: 2 },
  passive: { name: 'Crown', description: '+5 DEF' },
  modifier: { stats: { def: 5 } },
  ability: { ...NEVER_CAST, id: 'decree', name: 'Decree', cooldown: 4 },
};
const SIGNATURE: ItemDef = { id: 'halo', name: 'Halo', description: '+5 HP', cost: 7, modifier: { stats: { hp: 5 } }, tertiaryClassId: 'templar' };
const COIN: ItemDef = { id: 'coin', name: 'Coin', description: '+1 gold per win', cost: 4, modifier: {}, goldPerWin: 1 };

function ctxWith(): RunContext {
  const base = makeCtx();
  return makeCtx({
    content: {
      ladder: LADDER,
      perks: PERKS,
      bosses: [BOSS],
      items: { ...base.content.items, halo: SIGNATURE, coin: COIN },
      itemPool: ['sword', 'boots', 'coin'],
    },
  });
}
const setup = (ctx: RunContext, over: Partial<RunSetup> = {}): RunSetup => ({ ...defaultSetup(ctx), ...over });

function act(state: RunState, action: ShopAction, ctx: RunContext): RunState {
  const r = applyShopAction(state, action, ctx);
  if (!r.ok) throw new Error(`Action ${action.type} failed: ${r.error}`);
  return r.state;
}

describe('run setup', () => {
  it('stacks ladder tiers up to the chosen one, plus perks', () => {
    const ctx = ctxWith();
    const eff = runContext(setup(ctx, { tier: 2, perks: ['rich'] }), ctx);
    expect(eff.config.startingGold).toBe(10 - 4 + 3);
    expect(eff.config.startingLives).toBe(2);
    expect(eff.run?.enemyStats).toBe(0.5);
    expect(eff.run?.elitesFrom).toBeUndefined();
    expect(createRun('s', ctx, setup(ctx, { tier: 2, perks: ['rich'] }))).toMatchObject({ gold: 9, lives: 2 });
  });

  it('is idempotent and narrows content to the setup', () => {
    const ctx = ctxWith();
    const s = setup(ctx, { classes: ['tank'], items: ['sword', 'halo'], synergies: ['guards'] });
    const eff = runContext(s, ctx);
    expect(runContext(s, eff)).toBe(eff);
    expect(eff.content.shopPool).toEqual(['tank']);
    expect(eff.content.itemPool).toEqual(['sword']);
    expect(eff.content.synergies.map((x) => x.id)).toEqual(['guards']);
    expect(eff.content.enemies.every((a) => a.classId === 'tank')).toBe(true);
  });

  it('merges modifiers: numbers add, flags combine, boss rounds union', () => {
    expect(mergeRunModifiers([{ startingGold: 2, bossRounds: [5] }, { startingGold: -1, freeReroll: true, bossRounds: [10, 5] }])).toEqual({
      startingGold: 1,
      freeReroll: true,
      bossRounds: [5, 10],
    });
  });
});

describe('perks in a run', () => {
  it('Bargain Hunter: the first reroll each round is free', () => {
    const ctx = ctxWith();
    let s = createRun('s', ctx, setup(ctx, { perks: ['bargain'] }));
    expect(rerollCost(s, ctx)).toBe(0);
    s = act(s, { type: 'reroll' }, ctx);
    expect(s.gold).toBe(10);
    expect(rerollCost(s, ctx)).toBe(1);
    s = act(s, { type: 'reroll' }, ctx);
    expect(s.gold).toBe(9);
  });

  it('Veteran: the first recruit starts at level 2', () => {
    const ctx = ctxWith();
    let s = createRun('s', ctx, setup(ctx, { perks: ['vet'] }));
    s = act(s, { type: 'buy', offer: 0 }, ctx);
    s = act(s, { type: 'buy', offer: 1 }, ctx);
    const levels = Object.fromEntries(boardUnits(s.board).map((u) => [u.uid, u.level]));
    expect(levels).toEqual({ 1: 2, 2: 1 });
    expect(s.pending).toHaveLength(1);
  });

  it('Second Wind: the first loss costs no life', () => {
    const ctx = makeCtx({ enemies: [{ id: 't', name: 'Titan', classId: 'titan', minRound: 1 }], content: { perks: PERKS } });
    const s = createRun('s', ctx, setup(ctx, { perks: ['wind'] }));
    s.board.front[0] = newUnit(1, 'tank', 'Hero');
    let r = fight(s, ctx);
    if (!r.ok) throw new Error();
    expect(r.state).toMatchObject({ lives: 3, losses: 1, secondWindUsed: true });
    r = fight(r.state, ctx);
    if (!r.ok) throw new Error();
    expect(r.state.lives).toBe(2);
  });

  it('Armory: a free item in the first shop that survives rerolls', () => {
    const ctx = ctxWith();
    let s = createRun('s', ctx, setup(ctx, { perks: ['armory'] }));
    expect(s.shop.at(-1)).toMatchObject({ kind: 'item', cost: 0 });
    s = act(s, { type: 'reroll' }, ctx);
    expect(s.shop.at(-1)).toMatchObject({ kind: 'item', cost: 0 });
  });

  it('early recruit discounts apply for the first rounds only', () => {
    const ctx = ctxWith();
    const eff = runContext(setup(ctx, { perks: ['cheap'] }), ctx);
    expect([1, 2, 3].map((r) => recruitCost(r, eff))).toEqual([1, 1, 3]);
    expect(createRun('s', ctx, setup(ctx, { perks: ['cheap'] })).shop.every((o) => o?.cost === 1)).toBe(true);
  });
});

describe('items with run effects', () => {
  it("Gambler's Coin pays out after won fights", () => {
    const ctx = makeCtx({ enemies: [{ id: 'w', name: 'Wall', classId: 'wall', minRound: 1 }], content: { items: { coin: COIN } } });
    const s = createRun('s', ctx);
    s.board.front[0] = { ...newUnit(1, 'titan', 'Hero'), items: ['coin'] };
    const r = fight(s, ctx);
    if (!r.ok) throw new Error();
    expect(r.income).toMatchObject({ items: 1 });
  });

  it('signature items: only their tertiary class can hold one, one per unit, offered while wanted', () => {
    const ctx = makeCtx({ config: { shop: { unitSlots: 0, extraSlots: 30, trainingChance: 0, fullPartyUnitSlots: 0 } }, content: { items: { ...makeCtx().content.items, halo: SIGNATURE } } });
    const s = createRun('s', ctx);
    s.board.front[0] = { ...newUnit(1, 'tank', 'Templar'), advancedClassId: 'paladin', tertiaryClassId: 'templar' };
    s.board.front[1] = newUnit(2, 'tank', 'Plain');
    s.shop = [{ kind: 'item', itemId: 'halo', cost: 7 }, { kind: 'item', itemId: 'halo', cost: 7 }];
    s.gold = 20;
    expect(applyShopAction(s, { type: 'buy', offer: 0, to: { row: 'front', col: 1 } }, ctx)).toEqual({ ok: false, error: 'wrongClass' });
    const bought = act(s, { type: 'buy', offer: 0, to: { row: 'front', col: 0 } }, ctx);
    expect(applyShopAction(bought, { type: 'buy', offer: 1, to: { row: 'front', col: 0 } }, ctx)).toEqual({ ok: false, error: 'alreadyEquipped' });
    // The shop offers it only while a templar lacks it.
    const rolled = act({ ...s, gold: 20 }, { type: 'reroll' }, ctx);
    expect(rolled.shop.some((o) => o?.kind === 'item' && o.itemId === 'halo')).toBe(true);
    const after = act({ ...bought, gold: 20 }, { type: 'reroll' }, ctx);
    expect(after.shop.some((o) => o?.kind === 'item' && o.itemId === 'halo')).toBe(false);
  });
});

describe('ladder enemies', () => {
  it('scales enemies, adds an Elite and a boss on boss rounds', () => {
    const ctx = ctxWith();
    const plain = generateEnemy('s', 2, runContext(setup(ctx), ctx));
    const hard = generateEnemy('s', 2, runContext(setup(ctx, { tier: 4 }), ctx));
    const units = [...hard.builds.front, ...hard.builds.back].filter((u) => u !== null);
    const boss = units.find((u) => u.bossId === 'king');
    expect(boss).toMatchObject({ name: 'The King', empowered: true });
    expect(units.some((u) => u.elite && u.name.startsWith('Elite '))).toBe(true);
    const bossSetup = resolveUnit(boss!, ctx.content);
    expect(bossSetup.extraAbilities?.map((a) => a.id)).toEqual(['decree']);
    const hpOf = (p: typeof plain) => [...p.party.front, ...p.party.back].reduce((s, u) => s + (u?.stats.hp ?? 0), 0);
    expect(hpOf(hard)).toBeGreaterThan(hpOf(plain) * 1.5);
    // Round 1 isn't a boss round.
    const r1 = generateEnemy('s', 1, runContext(setup(ctx, { tier: 4 }), ctx));
    expect([...r1.builds.front, ...r1.builds.back].some((u) => u?.bossId)).toBe(false);
  });
});

describe('filter synergies', () => {
  const SYN: SynergyDef[] = [
    {
      id: 'trio',
      name: 'Trio',
      tiers: [
        {
          requires: [{ kind: 'party', slots: [{ tags: ['guard'] }, { classIds: ['archer'] }, { tags: ['guard'] }], label: 'two guards and an archer' }],
          description: '+1 ATK',
          modifier: { stats: { atk: 1 } },
          appliesTo: { filter: { classIds: ['archer'] } },
        },
      ],
    },
  ];
  const ctx = makeCtx({ content: { synergies: SYN } });

  it('party requirements need a different unit per slot', () => {
    const tank = (uid: number) => newUnit(uid, 'tank', `T${uid}`);
    expect(activeSynergies([tank(1), newUnit(2, 'archer', 'A')], ctx.content)).toHaveLength(0);
    const active = activeSynergies([tank(1), tank(3), newUnit(2, 'archer', 'A')], ctx.content);
    expect(active.map((a) => a.synergy.id)).toEqual(['trio']);
  });
});

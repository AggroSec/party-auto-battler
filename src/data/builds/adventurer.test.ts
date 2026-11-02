// The Adventurer: Jack, one per party, built entirely from other classes.
import { describe, expect, it } from 'vitest';
import { Rng, simulateCombat, type CombatEvent } from '../../engine/index.ts';
import {
  applyShopAction,
  borrowOptions,
  createRun,
  defaultSetup,
  ensureFavored,
  generateEnemy,
  grantXp,
  newUnit,
  resolveUnit,
  rollShop,
  runContext,
  talentOptions,
  unitTags,
  applyChoice,
  type OwnedUnit,
  type RunContext,
} from '../../engine/run/index.ts';
import { buildRunContext } from '../content.ts';
import { ADVANCED_CLASSES, TALENTS, TERTIARY_CLASSES } from './index.ts';

const ctx = buildRunContext();
const { content, config } = ctx;
const cfg = config.progression;
const jack = (over: Partial<OwnedUnit> = {}): OwnedUnit => ({ ...newUnit(1, 'adventurer', 'Jack'), ...over });
const onlyClasses = (classes: string[]): RunContext => runContext({ ...defaultSetup(ctx), classes }, ctx);

describe('Adventurer pools', () => {
  it('draws from other classes only, and every pool entry is a real talent', () => {
    const tiers = [content.classes.adventurer!, ADVANCED_CLASSES.journeyman!, ADVANCED_CLASSES['hedge-wizard']!, ...Object.values(TERTIARY_CLASSES).filter((t) => t.baseClassId === 'adventurer')];
    for (const tier of tiers) {
      expect(tier.talents.length).toBeGreaterThan(0);
      for (const id of tier.talents) {
        expect(TALENTS[id]?.sourceClassId, id).toBeDefined();
        expect(TALENTS[id]?.sourceClassId).not.toBe('adventurer');
      }
    }
  });

  it('leaves out talents that name another class\'s ability', () => {
    const pool = [...content.classes.adventurer!.talents, ...ADVANCED_CLASSES.journeyman!.talents, ...ADVANCED_CLASSES['hedge-wizard']!.talents];
    expect(pool).not.toContain('warrior/intimidate');
    expect(pool).not.toContain('ranger/rapid-fire');
    expect(pool).not.toContain('duelist/flourish');
    expect(pool).toContain('warrior/second-wind');
  });

  it('every borrowed ability has its own id', () => {
    const ids = Object.values(TALENTS).filter((t) => t.id.startsWith('borrow/')).map((t) => t.grantAbility!.id);
    expect(ids.length).toBeGreaterThanOrEqual(84);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only offers talents and abilities from unlocked classes', () => {
    const limited = onlyClasses(['warrior', 'rogue', 'adventurer']);
    const allowed = new Set(['warrior', 'rogue']);
    for (let seed = 0; seed < 20; seed++) {
      const rng = new Rng(seed);
      for (const id of talentOptions(jack({ level: 1 }), 2, limited.content, cfg, rng) ?? []) expect(allowed).toContain(TALENTS[id]!.sourceClassId);
      for (const id of borrowOptions(jack({ advancedClassId: 'journeyman' }), 3, limited.content, cfg, rng) ?? []) expect(allowed).toContain(TALENTS[id]!.sourceClassId);
    }
  });
});

describe('Adventurer level-ups', () => {
  it('borrows an ability at level 3 after choosing an advanced class', () => {
    const unit = jack();
    const queue = grantXp(unit, cfg.xpForLevel[2]!, content, cfg, new Rng(1));
    expect(queue.map((c) => c.kind)).toEqual(['talent', 'advance', 'borrow']);
    expect(queue[2]!.options).toEqual([]);
    unit.advancedClassId = 'journeyman';
    const options = borrowOptions(unit, 3, content, cfg, new Rng(2))!;
    expect(options).toHaveLength(cfg.talentChoices);
    expect(TALENTS[options[0]!]?.grantAbility).toBeDefined();
  });

  it('a third ability comes only to the Master of None', () => {
    const at10 = (tertiaryClassId: string) =>
      grantXp(jack({ level: 9, xp: cfg.xpForLevel[8]!, advancedClassId: 'journeyman', tertiaryClassId }), 1e6, content, cfg, new Rng(1)).map((c) => c.kind);
    expect(at10('master-of-none')).toEqual(['talent', 'borrow']);
    expect(at10('master-of-one')).toEqual(['talent']);
  });

  it('Master of One waits for its borrowed ability, then only offers that class\'s talents', () => {
    const unit = jack({ level: 7, advancedClassId: 'journeyman', tertiaryClassId: 'master-of-one' });
    expect(talentOptions(unit, 8, content, cfg, new Rng(1))).toBeNull();
    const pick = borrowOptions(unit, 7, content, cfg, new Rng(1))![0]!;
    expect(applyChoice(unit, { uid: 1, level: 7, kind: 'borrow', options: [pick] }, 0)).toBe(true);
    const options = talentOptions(unit, 8, content, cfg, new Rng(3))!;
    expect(options.length).toBeGreaterThan(0);
    for (const id of options) expect(TALENTS[id]!.sourceClassId).toBe(TALENTS[pick]!.sourceClassId);
  });

  it('Polymath gets one more talent option', () => {
    const unit = jack({ level: 7, advancedClassId: 'hedge-wizard', tertiaryClassId: 'polymath' });
    expect(talentOptions(unit, 8, content, cfg, new Rng(1))).toHaveLength(cfg.talentChoices + 1);
  });

  it('a borrowed ability is cast and brings its class\'s tags', () => {
    const unit = jack({ level: 3, advancedClassId: 'journeyman', talents: ['borrow/holy-bulwark'] });
    expect(resolveUnit(unit, content).extraAbilities?.map((a) => a.id)).toEqual(['holy-bulwark']);
    expect(unitTags(unit, content)).toEqual(expect.arrayContaining(['martial', 'guardian', 'divine']));
    expect(unitTags(jack({ level: 3, advancedClassId: 'journeyman' }), content)).toEqual(['martial']);
  });
});

describe('Adventurer Runes', () => {
  const runicDetonation = (u: OwnedUnit) => resolveUnit(u, content).triggers.filter((t) => t.label === 'Runic Detonation' || t.label === 'Carve').length;

  it('gets the Runeblade passive once from anything that uses Runes, and not otherwise', () => {
    expect(runicDetonation(jack())).toBe(0);
    expect(runicDetonation(jack({ talents: ['warrior/second-wind'] }))).toBe(0);
    // Deep Carving carves; Volatile Runes reacts to detonations; Elemental Edge is an ability.
    expect(runicDetonation(jack({ talents: ['runeblade/deep-carving'] }))).toBe(2);
    expect(runicDetonation(jack({ talents: ['runeblade/volatile-runes'] }))).toBe(2);
    expect(runicDetonation(jack({ talents: ['borrow/elemental-edge'] }))).toBe(2);
    expect(runicDetonation(jack({ talents: ['runeblade/deep-carving', 'borrow/elemental-edge'] }))).toBe(2);
  });

  it('doesn\'t double the passive on a real Runeblade', () => {
    const blade = { ...newUnit(1, 'runeblade', 'R'), talents: ['runeblade/deep-carving'] };
    expect(runicDetonation(blade)).toBe(2);
  });

  it('his Runes actually detonate in a fight', () => {
    const setup = resolveUnit(jack({ talents: ['runeblade/deep-carving'] }), content);
    const dummy = { ...resolveUnit(newUnit(2, 'warrior', 'D'), content), stats: { hp: 400, atk: 4, def: 0, spd: 8 } };
    const r = simulateCombat({ player: { front: [setup], back: [] }, enemy: { front: [dummy], back: [] }, rng: new Rng(1), tickCap: 200 });
    const onBurst = (e: CombatEvent) => e.type === 'trigger' && e.on === 'onBurst' && e.label === 'Runic Detonation';
    expect(r.events.some(onBurst)).toBe(true);
  });
});

describe('One Jack per party', () => {
  const onlyJackPool = (): RunContext => onlyClasses(['warrior', 'adventurer']);
  const shopUnits = (c: RunContext, board: ReturnType<typeof createRun>['board'], seed: number) =>
    rollShop(new Rng(seed), c, board).flatMap((o) => (o.kind === 'unit' ? [o] : []));

  it('is always named Jack, and a shop never offers two', () => {
    const c = onlyJackPool();
    const empty = createRun('x', ctx).board;
    let seen = 0;
    for (let seed = 0; seed < 50; seed++) {
      const jacks = shopUnits(c, empty, seed).filter((o) => o.classId === 'adventurer');
      expect(jacks.length).toBeLessThanOrEqual(1);
      for (const o of jacks) expect(o.name).toBe('Jack');
      seen += jacks.length;
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('stops being offered once you have him, and comes back after selling', () => {
    const c = onlyJackPool();
    const board = createRun('x', ctx).board;
    board.front[0] = jack();
    for (let seed = 0; seed < 50; seed++) expect(shopUnits(c, board, seed).some((o) => o.classId === 'adventurer')).toBe(false);
    board.front[0] = null;
    expect(Array.from({ length: 50 }, (_, s) => shopUnits(c, board, s)).flat().some((o) => o.classId === 'adventurer')).toBe(true);
  });

  it('can\'t be recruited twice, even from a leftover offer', () => {
    const state = createRun('x', ctx);
    state.gold = 99;
    state.board.front[0] = jack();
    state.shop[0] = { kind: 'unit', classId: 'adventurer', name: 'Jack', cost: 1 };
    expect(applyShopAction(state, { type: 'buy', offer: 0 }, ctx)).toEqual({ ok: false, error: 'uniqueClass' });
  });

  it('a favored Jack is guaranteed until you have him, and a favored class never takes his offer', () => {
    const setup = { favored: 'adventurer' };
    const offer = { kind: 'unit', classId: 'warrior', name: 'Hale', cost: 3 } as const;
    expect(ensureFavored([offer], [], setup, 1, ctx)[0]).toMatchObject({ classId: 'adventurer', name: 'Jack' });
    const board = createRun('x', ctx).board;
    board.front[0] = jack();
    expect(ensureFavored([offer], [], setup, 1, ctx, board)[0]).toMatchObject({ classId: 'warrior', name: 'Hale' });
    const jackOffer = { kind: 'unit', classId: 'adventurer', name: 'Jack', cost: 3 } as const;
    expect(ensureFavored([jackOffer], [], { favored: 'warrior' }, 1, ctx)[0]).toEqual(jackOffer);
  });

  it('enemy parties have at most one Jack too', () => {
    const c = onlyClasses(['warrior', 'adventurer']);
    let seen = 0;
    for (let seed = 0; seed < 30; seed++) {
      const { builds } = generateEnemy(`s${seed}`, 12, c);
      const jacks = [...builds.front, ...builds.back].filter((u) => u?.classId === 'adventurer');
      expect(jacks.length).toBeLessThanOrEqual(1);
      for (const u of jacks) expect(u!.name).toBe('Jack');
      seen += jacks.length;
    }
    expect(seen).toBeGreaterThan(0);
  });
});

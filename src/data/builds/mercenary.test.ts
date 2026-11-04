// The Mercenary: Broken Limbs, weapon slots, Hazard Pay, and the unlock.
import { describe, expect, it } from 'vitest';
import { recordFight } from '../../engine/meta/index.ts';
import { newProfile } from '../../engine/meta/index.ts';
import {
  applyShopAction,
  createRun,
  defaultSetup,
  equipError,
  fight,
  generateEnemy,
  newUnit,
  resolveUnit,
  runContext,
  type OwnedUnit,
  type RunState,
} from '../../engine/run/index.ts';
import { buildRunContext } from '../content.ts';
import { META_CATALOG } from '../meta/catalog.ts';

const ctx = buildRunContext();
const { content } = ctx;
const merc = (over: Partial<OwnedUnit> = {}): OwnedUnit => ({ ...newUnit(1, 'mercenary', 'Hired'), ...over });
const oathsworn = () => merc({ level: 7, advancedClassId: 'man-at-arms', tertiaryClassId: 'oathsworn' });
const armory = () => merc({ level: 7, advancedClassId: 'man-at-arms', tertiaryClassId: 'walking-armory' });
const weapons = Object.values(content.items).filter((i) => i.weapon && !i.tertiaryClassId).map((i) => i.id);

describe('Mercenary weapon slots', () => {
  it('the usual 2 slots, for anything', () => {
    const u = merc({ items: ['chainmail', 'iron-sword'] });
    expect(equipError(u, 'halberd', ctx)).toBe('itemSlotsFull');
    expect(equipError(merc({ items: ['chainmail'] }), 'giants-belt', ctx)).toBeNull();
  });

  it('Oathsworn: a third slot, for a weapon', () => {
    const u = { ...oathsworn(), items: ['chainmail', 'giants-belt'] };
    expect(equipError(u, 'swift-boots', ctx)).toBe('weaponsOnly');
    expect(equipError(u, 'iron-sword', ctx)).toBeNull();
    expect(equipError({ ...u, items: [...u.items, 'iron-sword'] }, 'halberd', ctx)).toBe('itemSlotsFull');
  });

  it('Oathsworn: the first weapon counts twice', () => {
    const plain = resolveUnit({ ...oathsworn(), items: ['chainmail'] }, content);
    const sworn = resolveUnit({ ...oathsworn(), items: ['chainmail', 'iron-sword'] }, content);
    expect(sworn.stats.atk - plain.stats.atk).toBe(6);
    expect(sworn.critChance).toBeCloseTo(0.15);
    expect(sworn.weapons).toBe(1);
  });

  it('Walking Armory: four slots, weapons only; items it already had stay', () => {
    const u = armory();
    expect(equipError(u, 'chainmail', ctx)).toBe('weaponsOnly');
    const full = { ...u, items: weapons.slice(0, 4) };
    expect(full.items).toHaveLength(4);
    expect(equipError({ ...u, items: weapons.slice(0, 3) }, weapons[3]!, ctx)).toBeNull();
    expect(equipError(full, weapons[4]!, ctx)).toBe('itemSlotsFull');
    expect(resolveUnit({ ...u, items: ['chainmail'] }, content).stats.def).toBeGreaterThan(resolveUnit(u, content).stats.def);
  });

  it('buying into a weapon-only slot is refused with a reason', () => {
    const s = createRun('w', ctx);
    s.board.front[0] = armory();
    s.shop = [{ kind: 'item', itemId: 'chainmail', cost: 3 }];
    expect(applyShopAction(s, { type: 'buy', offer: 0, to: { row: 'front', col: 0 } }, ctx)).toEqual({ ok: false, error: 'weaponsOnly' });
  });

  it('enemy Walking Armories only carry weapons', () => {
    const mercsOnly = runContext({ ...defaultSetup(ctx), classes: ['mercenary'] }, ctx);
    let seen = 0;
    for (let seed = 0; seed < 60; seed++) {
      const { builds } = generateEnemy(`wa${seed}`, 18, mercsOnly);
      for (const u of [...builds.front, ...builds.back]) {
        if (u?.tertiaryClassId !== 'walking-armory') continue;
        seen++;
        expect(u.items.every((id) => content.items[id]?.weapon)).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('Mercenary', () => {
  it('Hazard Pay: +1 gold for each Mercenary after a won fight', () => {
    const play = (classId: string) => {
      const s = createRun('pay', ctx);
      s.board.front[0] = { ...newUnit(1, classId, 'Big'), growth: { hp: 300, atk: 60, def: 20, spd: 0 } };
      const r = fight(s, ctx);
      if (!r.ok) throw new Error(r.error);
      expect(r.combat.winner).toBe('player');
      return r.income!.items;
    };
    expect(play('mercenary') - play('warrior')).toBe(1);
  });

  it('every tertiary has a signature item it can equip', () => {
    for (const t of ['headsman', 'maimer', 'oathsworn', 'walking-armory']) {
      const item = Object.values(content.items).find((i) => i.tertiaryClassId === t)!;
      const u = merc({ level: 7, advancedClassId: t === 'headsman' || t === 'maimer' ? 'brute' : 'man-at-arms', tertiaryClassId: t });
      expect(equipError(u, item.id, ctx), t).toBeNull();
    }
  });

  it('Arms Race: 4 weapons across the party unlocks the Mercenary and three weapons', () => {
    const s: RunState = createRun('arms', ctx);
    s.board.front[0] = { ...newUnit(1, 'warrior', 'A'), items: ['iron-sword', 'long-spear'] };
    s.board.front[1] = { ...newUnit(2, 'rogue', 'B'), items: ['assassins-dagger', 'chainmail'] };
    const three = fight(s, ctx);
    if (!three.ok) throw new Error(three.error);
    const earned = (before: RunState, r: typeof three) => recordFight(newProfile(), { before, after: r.state, combat: r.combat }, ctx, META_CATALOG).earned.map((a) => a.id);
    expect(earned(s, three)).not.toContain('arms-race');
    s.board.front[1]!.items = ['assassins-dagger', 'hunting-bow'];
    const four = fight(s, ctx);
    if (!four.ok) throw new Error(four.error);
    expect(earned(s, four)).toContain('arms-race');
    const reward = META_CATALOG.achievements.find((a) => a.id === 'arms-race')!.reward;
    expect(reward.classes).toEqual(['mercenary']);
    for (const id of reward.items ?? []) expect(content.items[id]?.weapon).toBe(true);
  });
});

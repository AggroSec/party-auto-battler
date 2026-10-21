import { describe, expect, it } from 'vitest';
import { applyShopAction, createRun, fight, newUnit, resolveUnit } from '../engine/run/index.ts';
import { ADVANCED_CLASSES, TALENTS } from './builds/index.ts';
import { CLASSES, CLASS_IDS } from './classes.ts';
import { buildRunContent, buildRunContext } from './content.ts';
import { ENEMY_ARCHETYPES } from './enemies.ts';
import { ITEMS } from './items.ts';
import { SYNERGIES } from './synergies.ts';

describe('run content', () => {
  it('keeps locked classes out of the shop until unlocked', () => {
    expect(buildRunContent().shopPool).not.toContain('necromancer');
    expect(buildRunContent(['necromancer']).shopPool).toContain('necromancer');
    expect(buildRunContent(['warrior']).shopPool.filter((id) => id === 'warrior')).toHaveLength(1);
  });

  it('only references classes that exist', () => {
    for (const a of ENEMY_ARCHETYPES) expect(CLASSES).toHaveProperty(a.classId);
  });

  it('has an enemy available from round 1 and unique archetype ids', () => {
    expect(ENEMY_ARCHETYPES.some((a) => a.minRound === 1)).toBe(true);
    expect(new Set(ENEMY_ARCHETYPES.map((a) => a.id)).size).toBe(ENEMY_ARCHETYPES.length);
  });
});

describe('build content integrity', () => {
  it('every class has 4 base talents and 2 advanced classes that point back to it', () => {
    for (const id of CLASS_IDS) {
      const c = CLASSES[id];
      expect(c.talents).toHaveLength(4);
      for (const t of c.talents) expect(TALENTS).toHaveProperty([t]);
      expect(c.advancedClasses).toHaveLength(2);
      for (const a of c.advancedClasses) {
        expect(ADVANCED_CLASSES[a]?.baseClassId).toBe(id);
        expect(ADVANCED_CLASSES[a]?.talents).toHaveLength(4);
      }
    }
    expect(Object.keys(ADVANCED_CLASSES)).toHaveLength(22);
  });

  it('every talent belongs to exactly one pool', () => {
    const pools = [...CLASS_IDS.map((id) => CLASSES[id].talents), ...Object.values(ADVANCED_CLASSES).map((a) => a.talents)].flat();
    expect(pools).toHaveLength(132);
    expect(new Set(pools).size).toBe(132);
    expect(Object.keys(TALENTS).sort()).toEqual([...pools].sort());
  });

  it('recommended stat spreads are valid and lean toward class identity', () => {
    const spreads = [...CLASS_IDS.map((id) => CLASSES[id].statWeights), ...Object.values(ADVANCED_CLASSES).flatMap((a) => (a.statWeights ? [a.statWeights] : []))];
    for (const w of spreads) {
      expect(Object.values(w).every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
      expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    }
    expect(CLASSES.rogue.statWeights.spd).toBeGreaterThan(CLASSES.warrior.statWeights.spd);
    expect(CLASSES.warrior.statWeights.hp).toBeGreaterThan(CLASSES.rogue.statWeights.hp);
  });

  it('item class bonuses name real classes', () => {
    const known = new Set([...CLASS_IDS, ...Object.keys(ADVANCED_CLASSES)]);
    for (const item of Object.values(ITEMS)) {
      for (const c of item.classBonus?.classIds ?? []) expect(known).toContain(c);
      expect(item.cost).toBeGreaterThan(0);
    }
  });

  it('every synergy tag can be reached by at least two kinds of unit', () => {
    const tagged = (tag: string) =>
      [...CLASS_IDS.map((id) => CLASSES[id].tags), ...Object.values(ADVANCED_CLASSES).map((a) => a.tags)].filter((t) => t.includes(tag)).length;
    for (const s of SYNERGIES) {
      for (const tier of s.tiers) {
        for (const req of tier.requires) if (req.kind === 'tag') expect(tagged(req.tag)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('every class passive has rules text named after its trigger', () => {
    for (const c of Object.values(CLASSES)) {
      expect(Boolean(c.passive), c.id).toBe(c.triggers.length > 0);
      if (c.passive) expect(c.triggers.map((t) => t.label), c.id).toContain(c.passive.name);
    }
    for (const adv of Object.values(ADVANCED_CLASSES)) {
      const m = adv.modifier;
      expect(Boolean(adv.passive), adv.id).toBe(Boolean(m.triggers?.length || m.reach || m.lifesteal || m.abilityPower || m.abilityCooldown));
      if (adv.passive && m.triggers?.length) expect(m.triggers.map((t) => t.label), adv.id).toContain(adv.passive.name);
    }
  });

  it('every advanced class and every talent resolves into a valid unit', () => {
    const content = buildRunContent();
    for (const adv of Object.values(ADVANCED_CLASSES)) {
      const u = newUnit(1, adv.baseClassId, 'X');
      u.advancedClassId = adv.id;
      u.talents = [...CLASSES[adv.baseClassId as keyof typeof CLASSES].talents.slice(0, 1), ...adv.talents.slice(0, 2)];
      u.items = Object.keys(ITEMS).slice(0, 2);
      const setup = resolveUnit(u, content);
      expect(setup.stats.hp).toBeGreaterThan(0);
      expect(setup.stats.spd).toBeGreaterThan(0);
      expect(setup.ability.cooldown).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('real content end to end', () => {
  it('plays a round, levels up and resolves choices', () => {
    const ctx = buildRunContext();
    let s = createRun('smoke', ctx);
    s.board.front[0] = newUnit(1, 'warrior', 'Test');
    for (let round = 0; round < 3 && s.phase === 'shop'; round++) {
      const r = fight(s, ctx);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
      while (s.pending.length > 0) {
        const next = applyShopAction(s, { type: 'choose', option: 0 }, ctx);
        if (!next.ok) throw new Error(next.error);
        s = next.state;
      }
    }
    expect(s.history).toHaveLength(3);
    expect(s.board.front[0]!.level).toBeGreaterThanOrEqual(2);
    expect(s.board.front[0]!.talents.length).toBeGreaterThanOrEqual(1);
  });
});

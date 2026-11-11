// Milestone 13: rules-mode clean-up. Bosses resist executions, every Empowered
// talent does something, items fit the mode, and every tertiary class has a
// signature item.
import { describe, expect, it } from 'vitest';
import { newProfile, runSetupFor, unlockedContent } from '../../engine/meta/index.ts';
import { boardUnits, generateEnemy, newUnit, resolveBoard, resolveUnit, runContext, type OwnedUnit } from '../../engine/run/index.ts';
import type { Effect } from '../../engine/types.ts';
import { ADVANCED_CLASSES, TERTIARY_CLASSES } from '../builds/index.ts';
import { CLASSES } from '../classes.ts';
import { buildRunContext } from '../content.ts';
import { META_CATALOG } from '../meta/catalog.ts';
import { RULES_ADVANCED, RULES_CLASSES, RULES_TALENTS, RULES_TERTIARY } from './index.ts';
import { RULES_SIGNATURES } from './signatures.ts';

const ctx = buildRunContext();
const unlocked = unlockedContent({ ...newProfile(), unlockAll: true }, META_CATALOG);
const rules = (tier = 0) => runContext(runSetupFor(unlocked, tier, [], [], 'rules'), ctx);
const classic = runContext(runSetupFor(unlocked, 0, []), ctx);
const allSkills = [...Object.values(RULES_CLASSES), ...Object.values(RULES_ADVANCED), ...Object.values(RULES_TERTIARY)].flatMap((t) => t.skills ?? []);

/** Effects +power makes bigger: damage, heals, shields, summons and damage over time. */
const scales = (e: Effect): boolean =>
  e.kind === 'damage' || e.kind === 'heal' || e.kind === 'shield' || e.kind === 'summon' || (e.kind === 'status' && e.status.dot !== undefined);

describe('rules-mode clean-up (Milestone 13)', () => {
  it('rules-mode class ids never shadow classic ones', () => {
    const pairs: [object, object][] = [
      [CLASSES, RULES_CLASSES],
      [ADVANCED_CLASSES, RULES_ADVANCED],
      [TERTIARY_CLASSES, RULES_TERTIARY],
    ];
    for (const [a, b] of pairs) expect(Object.keys(b).filter((id) => id in a)).toEqual([]);
  });

  it('bosses resolve as bosses, so executions only wound them', () => {
    const enemy = generateEnemy('boss', 5, rules(8));
    const boss = boardUnits(enemy.builds).find((u) => u.bossId);
    expect(boss).toBeDefined();
    expect(resolveUnit(boss!, ctx.content).boss).toBe(true);
    expect(resolveBoard(enemy.builds, ctx.content).front.concat(resolveBoard(enemy.builds, ctx.content).back).filter((u) => u?.boss)).toHaveLength(1);
  });

  it('every Empowered talent changes its skill: more power where it scales, an upgrade where it doesn’t', () => {
    for (const s of allSkills) {
      const talent = RULES_TALENTS[`aug:${s.id}:power`]!;
      if (s.effects.some(scales)) expect(talent.skillPower?.[s.id]).toBe(0.35);
      else {
        expect(s.empowered, s.name).toBeDefined();
        expect(talent.skillUpgrade).toEqual([s.id]);
      }
    }
  });

  it('an Empowered upgrade replaces the skill’s effects and text', () => {
    const plain = newUnit(1, 'r-warrior', 'W');
    const empowered: OwnedUnit = { ...plain, talents: ['aug:provoke:power'] };
    const provoke = (u: OwnedUnit) => resolveUnit(u, ctx.content).skills!.find((s) => s.id === 'provoke')!;
    expect(provoke(plain).effects).toEqual([{ kind: 'taunt', target: 'self', turns: 2 }]);
    expect(provoke(empowered).effects).toEqual([{ kind: 'taunt', target: 'self', turns: 3 }]);
    expect(provoke(empowered).description).toContain('3 turns');
  });

  it('rules mode drops items whose class bonus is for classes it doesn’t have; classic keeps them', () => {
    const pool = rules().content.itemPool;
    for (const gone of ['hunting-bow', 'skull-totem', 'prayer-beads', 'enchanted-lute', 'oak-heart', 'cursed-tome', 'gearbox', 'war-hammer', 'throwing-axes', 'halberd']) {
      expect(pool).not.toContain(gone);
      expect(classic.content.itemPool).toContain(gone);
    }
    for (const kept of ['long-spear', 'tower-shield', 'smoke-cloak', 'spellbook', 'holy-symbol', 'rage-gauntlets', 'assassins-dagger', 'time-shard', 'iron-sword']) {
      expect(pool).toContain(kept);
    }
  });

  it('class items give their bonus to the rules-mode versions of their class (via look), and Rage Gauntlets to the rules Berserker', () => {
    const atk = (classId: string, adv: string | null = null) => resolveUnit({ ...newUnit(1, classId, 'U'), advancedClassId: adv, items: ['long-spear'] }, ctx.content).stats.atk;
    const base = (classId: string) => resolveUnit(newUnit(1, classId, 'U'), ctx.content).stats.atk;
    expect(atk('r-warrior') - base('r-warrior')).toBe(3);
    expect(atk('r-mage') - base('r-mage')).toBe(1);
    const rage = (adv: string) => resolveUnit({ ...newUnit(1, 'r-warrior', 'U'), advancedClassId: adv, items: ['rage-gauntlets'] }, ctx.content).lifesteal;
    expect(rage('r-berserker')).toBe(0.15);
    expect(rage('guardian')).toBeUndefined();
  });

  it('every rules-mode tertiary class has one signature item, with a unique id', () => {
    for (const id of Object.keys(RULES_TERTIARY)) expect(RULES_SIGNATURES.filter((i) => i.tertiaryClassId === id), id).toHaveLength(1);
    for (const item of RULES_SIGNATURES) expect(ctx.content.items[item.id]).toBe(item);
  });

  it('the Soulreaver’s totem lets Sever Soul execute a Bound target', () => {
    const reaver: OwnedUnit = { ...newUnit(1, 'shaman', 'S'), advancedClassId: 'spiritbinder', tertiaryClassId: 'soulreaver', items: ['soulshackle-totem'] };
    expect(resolveUnit(reaver, ctx.content).executeWith).toEqual(['bind']);
  });
});

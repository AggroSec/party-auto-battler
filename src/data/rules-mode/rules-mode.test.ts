import { describe, expect, it } from 'vitest';
import { META_CATALOG } from '../meta/catalog.ts';
import { newProfile, recordFight, runSetupFor, unlockedContent } from '../../engine/meta/index.ts';
import {
  applyShopAction,
  boardUnits,
  createRun,
  defaultRules,
  fight,
  generateEnemy,
  newUnit,
  resolveUnit,
  runContext,
  unitSkills,
  validRules,
  type OwnedUnit,
} from '../../engine/run/index.ts';
import { buildRunContext } from '../content.ts';
import { RULES_ADVANCED, RULES_CLASS_IDS, RULES_CLASSES, RULES_TERTIARY } from './index.ts';

const ctx = buildRunContext();
const unlocked = { ...unlockedContent({ ...newProfile(), unlockAll: true }, META_CATALOG) };
const setup = runSetupFor(unlocked, 0, [], [], 'rules');

/** Every unit build a rules class can reach: base, each advanced, each tertiary. */
function builds(): OwnedUnit[] {
  return RULES_CLASS_IDS.flatMap((id) => {
    const base = newUnit(1, id, 'U');
    return [
      base,
      ...RULES_CLASSES[id]!.advancedClasses.flatMap((adv) => [
        { ...base, advancedClassId: adv },
        ...(RULES_ADVANCED[adv]!.tertiaryClasses ?? []).map((t) => ({ ...base, advancedClassId: adv, tertiaryClassId: t })),
      ]),
    ];
  });
}

describe('rules-mode content', () => {
  it('has six classes, each with two advanced classes that each have two tertiary classes', () => {
    expect(RULES_CLASS_IDS).toEqual(['r-warrior', 'r-cleric', 'r-rogue', 'r-mage', 'r-runeblade', 'shaman']);
    expect(Object.keys(RULES_ADVANCED)).toHaveLength(12);
    expect(Object.keys(RULES_TERTIARY)).toHaveLength(24);
  });

  it('every build’s default rules are valid for its kit, and every skill id is unique', () => {
    for (const u of builds()) expect(validRules(defaultRules(u, ctx.content), unitSkills(u, ctx.content))).toBe(true);
    const ids = [...Object.values(RULES_CLASSES), ...Object.values(RULES_ADVANCED), ...Object.values(RULES_TERTIARY)].flatMap((t) => (t.skills ?? []).map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every skill that aims hits its focus, and every talent is a real skill augment', () => {
    for (const u of builds()) {
      for (const s of unitSkills(u, ctx.content)) {
        if (s.aim) expect(s.effects.some((e) => 'target' in e && e.target === 'focus')).toBe(true);
      }
    }
    for (const t of Object.values(RULES_CLASSES).flatMap((c) => c.talents)) expect(ctx.content.talents[t]).toBeDefined();
  });

  it('resolves units with skills and rules', () => {
    const setupU = resolveUnit({ ...newUnit(1, 'shaman', 'S'), advancedClassId: 'spiritbinder' }, ctx.content);
    expect(setupU.skills?.map((s) => s.id)).toEqual(['frost-hex', 'wither', 'spirit-lash', 'hush', 'sever-soul']);
    expect(setupU.rules?.[0]?.skill).toBe('sever-soul');
  });
});

describe('a rules-mode run', () => {
  it('recruits only rules classes and fights rules-mode enemies', () => {
    const s = createRun('r', ctx, setup);
    const units = s.shop.filter((o) => o?.kind === 'unit');
    expect(units.every((o) => o?.kind === 'unit' && RULES_CLASS_IDS.includes(o.classId))).toBe(true);
    const enemy = generateEnemy('r', 3, runContext(setup, ctx));
    expect(boardUnits(enemy.builds).every((u) => RULES_CLASS_IDS.includes(u.classId))).toBe(true);
  });

  it('plays fights, and lets the player rewrite and reset a unit’s rules', () => {
    let s = createRun('r', ctx, setup);
    s.board.front[0] = newUnit(1, 'r-warrior', 'W');
    s.board.back[0] = newUnit(2, 'shaman', 'S');
    const at = { row: 'back' as const, col: 0 };
    const custom = [{ skill: 'spirit-lash', target: 'lowestHp' as const, when: { kind: 'targetAfflictions' as const, atLeast: 2 } }, { skill: 'frost-hex' }];
    let r = applyShopAction(s, { type: 'setRules', at, rules: custom }, ctx);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    expect(s.board.back[0]?.rules).toEqual(custom);
    expect(applyShopAction(s, { type: 'setRules', at, rules: [{ skill: 'cleave' }] }, ctx)).toEqual({ ok: false, error: 'invalidRules' });
    expect(applyShopAction(s, { type: 'setRules', at, rules: [{ skill: 'frost-hex', target: 'self' }] }, ctx)).toEqual({ ok: false, error: 'invalidRules' });
    for (let i = 0; i < 3; i++) {
      const f = fight(s, ctx);
      if (!f.ok) throw new Error(f.error);
      expect(f.combat.events.some((e) => e.type === 'ability' && e.source === 'p3')).toBe(true);
      // The per-rule breakdown accounts for everything each unit did.
      for (const u of f.combat.summary) {
        const sum = (k: 'damage' | 'healing' | 'shielding' | 'kills') => (u.actions ?? []).reduce((n, a) => n + a[k], 0);
        expect([sum('damage'), sum('healing'), sum('shielding'), sum('kills')]).toEqual([u.damageDealt, u.healingDone, u.shieldingDone, u.kills]);
      }
      s = f.state;
      if (s.phase !== 'shop') break;
      s.pending = [];
    }
    r = applyShopAction(s, { type: 'setRules', at, rules: null }, ctx);
    expect(r.ok && r.state.board.back[0]?.rules).toBeUndefined();
  });

  it('a custom list picks up the new skills when the unit advances', () => {
    let s = createRun('r', ctx, setup);
    s.board.back[0] = { ...newUnit(1, 'shaman', 'S'), rules: [{ skill: 'wither' }] };
    s.pending = [{ uid: 1, level: 3, kind: 'advance', options: ['hexcaller', 'spiritbinder'] }];
    const r = applyShopAction(s, { type: 'choose', option: 0 }, ctx);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    expect(s.board.back[0]?.rules?.map((x) => x.skill)).toEqual(['soul-rend', 'brittle-curse', 'wither']);
  });

  it('the Shaman unlocks by reaching round 4 in rules mode, not in classic runs', () => {
    expect(unlockedContent(newProfile(), META_CATALOG).rulesClasses).not.toContain('shaman');
    const play = (mode?: 'rules') => {
      const before = createRun('a', ctx, runSetupFor(unlockedContent(newProfile(), META_CATALOG), 0, [], [], mode));
      before.board.front[0] = newUnit(1, mode ? 'r-warrior' : 'warrior', 'W');
      before.round = 4;
      const f = fight(before, ctx);
      if (!f.ok) throw new Error(f.error);
      return recordFight(newProfile(), { before, after: f.state, combat: f.combat }, ctx, META_CATALOG).earned.map((a) => a.id);
    };
    expect(play()).not.toContain('rulebreaker');
    expect(play('rules')).toContain('rulebreaker');
  });
});

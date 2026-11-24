// The Black Covenant (Milestone 15): its data, its heroes (no locked classes),
// Reign of Dread, and what finishing it unlocks.
import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import { META_CATALOG } from '../../data/meta/catalog.ts';
import { BLACK_COVENANT, STORIES, storySetup } from '../../data/stories/index.ts';
import { DREAD_AURA } from '../../data/synergies.ts';
import { newProfile, recordStoryEnd, unlockedContent } from '../meta/index.ts';
import { activeSynergies, boardUnits, fight, newUnit, resolveBoard, runContext, type OwnedUnit, type RunState } from '../run/index.ts';
import { createStoryRun } from './story.ts';

const base = buildRunContext();
// No synergies unlocked: the story brings its own.
const setup = storySetup('black-covenant', 0, { items: [...base.content.itemPool] }, []);
const start = () => createStoryRun('covenant', base, setup);

function rigAtBoss(state: RunState): RunState {
  const next = structuredClone(state);
  const node = next.story!.map.find((n) => n.kind === 'boss')!;
  Object.assign(next.story!, { at: node.id, toFight: true, scene: null });
  for (const u of boardUnits(next.board)) {
    u.growth = { hp: 5000, atk: 500, def: 50, spd: 30 };
    u.statPoints = 0;
  }
  next.pending = [];
  return next;
}

describe('The Black Covenant', () => {
  it('every story’s missions name real heroes, events, enemy classes and bosses', () => {
    for (const story of Object.values(STORIES)) {
      const heroes = new Set(story.heroes.map((h) => h.id));
      expect(story.missions.flatMap((m) => m.joins).sort()).toEqual([...heroes].sort());
      for (const m of story.missions) {
        for (const e of m.events) expect(story.events[e], `${story.id}: ${e}`).toBeDefined();
        for (const a of m.enemies) expect(base.content.classes[a.classId], `${story.id}: ${a.classId}`).toBeDefined();
        expect(base.content.classes[m.boss.classId], m.boss.id).toBeDefined();
      }
      for (const h of story.heroes) expect(base.content.classes[h.classId], h.id).toBeDefined();
    }
  });

  it('its heroes are its villains, none locked to an advanced class', () => {
    expect(BLACK_COVENANT.heroes.map((h) => h.classId)).toEqual(['dark-knight', 'marauder', 'cultist', 'warlock', 'apostate']);
    expect(BLACK_COVENANT.heroes.every((h) => h.lockedAdvanced === undefined)).toBe(true);
    expect(boardUnits(start().board).map((u) => u.name)).toEqual(['Vaskar', 'Brakka']);
  });

  it('Reign of Dread is always on in it, and needs 3, 4 or 5 different villain classes', () => {
    expect(setup.synergies).toEqual(['reign-of-dread']);
    const content = runContext(setup, base).content;
    const dread = (units: OwnedUnit[]) => activeSynergies(units, content).find((a) => a.synergy.id === 'reign-of-dread');
    const u = (classId: string, adv: string | null = null): OwnedUnit => ({ ...newUnit(1, classId, classId), advancedClassId: adv });
    expect(dread([u('dark-knight'), u('marauder'), u('warrior')])).toBeUndefined();
    expect(dread([u('dark-knight'), u('marauder'), u('cultist', 'hemomancer')])?.tier).toBe(0);
    expect(dread([u('dark-knight'), u('marauder'), u('marauder'), u('cultist')])?.tier).toBe(0);
    expect(dread([u('dark-knight'), u('marauder'), u('cultist'), u('warlock')])?.tier).toBe(1);
    const all = [u('dark-knight'), u('marauder'), u('cultist'), u('warlock'), u('apostate', 'blasphemer')];
    expect(dread(all)?.tier).toBe(2);
    const board = { front: [all[0]!, all[1]!, all[2]!], back: [all[3]!, all[4]!] };
    expect(resolveBoard(board, content).front[0]?.dreadAura).toEqual(DREAD_AURA[5]);
  });

  it('Corvin joins in his confessor’s mail, tough enough for the front line', () => {
    let s = start();
    for (let m = 0; m < 2; m++) {
      const r = fight(rigAtBoss(s), base);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    const corvin = boardUnits(s.board).find((u) => u.storyHero === 'corvin')!;
    expect(corvin.growth).toMatchObject({ hp: 14, def: 1 });
  });

  it('plays through to the end, and finishing it unlocks the Apostate, the Marauder (both modes) and Reign of Dread', () => {
    let s = start();
    for (let m = 0; m < BLACK_COVENANT.missions.length; m++) {
      const r = fight(rigAtBoss(s), base);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.phase).toBe('complete');
    expect(boardUnits(s.board).map((u) => u.name).sort()).toEqual(['Brakka', 'Corvin', 'Sefin', 'Vaskar', 'Ysolde']);

    const profile = newProfile();
    const before = unlockedContent(profile, META_CATALOG);
    expect(before.classes).not.toContain('apostate');
    expect(before.rulesClasses).not.toContain('r-marauder');
    const r = recordStoryEnd(profile, s, BLACK_COVENANT.tiers.length, META_CATALOG);
    expect(r.earned.map((a) => a.id)).toEqual(['crown-of-hollows']);
    const after = unlockedContent(r.profile, META_CATALOG);
    expect(after.classes).toEqual(expect.arrayContaining(['apostate', 'marauder']));
    expect(after.rulesClasses).toEqual(expect.arrayContaining(['r-apostate', 'r-marauder']));
    expect(after.synergies).toContain('reign-of-dread');
  });

  it('finishing The Hollowing now also unlocks the rules-mode Sylvan', () => {
    const spirits = META_CATALOG.achievements.find((a) => a.id === 'spirits-restored')!;
    const profile = { ...newProfile(), achievements: [spirits.id] };
    expect(unlockedContent(profile, META_CATALOG).rulesClasses).toContain('r-sylvan');
    expect(unlockedContent(newProfile(), META_CATALOG).rulesClasses).not.toContain('r-sylvan');
  });
});

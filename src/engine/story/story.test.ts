// Story mode (Milestone 14): maps, moving between stops, events and camps,
// fights and rewards, restarts, mission changes and the story's own ladder.
import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import { META_CATALOG } from '../../data/meta/catalog.ts';
import { HOLLOWING, storySetup } from '../../data/stories/index.ts';
import { SYNERGIES } from '../../data/synergies.ts';
import { newProfile, recordStoryEnd, storyMaxTier, unlockedContent } from '../meta/index.ts';
import { activeSynergies, applyShopAction, boardUnits, fight, grantXp, newUnit, runContext, setupModifiers, type OwnedUnit, type RunState } from '../run/index.ts';
import { Rng } from '../rng.ts';
import { BOSS_LAYER, generateMap, LAYERS, reachable } from './map.ts';
import { campOptions, createStoryRun, currentNode, STORY_GOLD } from './story.ts';

const base = buildRunContext();
const setup = (tier = 0) => storySetup('hollowing', tier, { items: [...base.content.itemPool] }, SYNERGIES.map((s) => s.id));
const start = (seed = 'story', tier = 0) => createStoryRun(seed, base, setup(tier));

function act(state: RunState, action: Parameters<typeof applyShopAction>[1]): RunState {
  const r = applyShopAction(state, action, base);
  if (!r.ok) throw new Error(`${action.type}: ${r.error}`);
  return r.state;
}

/** Put the party at a stop with its fight waiting (skipping the walk there). */
function at(state: RunState, kind: 'fight' | 'boss'): RunState {
  const next = structuredClone(state);
  const node = next.story!.map.find((n) => n.kind === kind)!;
  next.story!.at = node.id;
  next.story!.toFight = true;
  next.story!.scene = null;
  return next;
}

/** Make every hero hopeless (or unbeatable). */
function rig(state: RunState, strong: boolean): RunState {
  const next = structuredClone(state);
  for (const u of boardUnits(next.board)) u.growth = strong ? { hp: 5000, atk: 500, def: 50, spd: 30 } : { hp: -1000, atk: -100, def: -50, spd: 0 };
  next.pending = [];
  for (const u of boardUnits(next.board)) u.statPoints = 0;
  return next;
}

describe('story maps', () => {
  const map = generateMap('seed', 0, ['a', 'b', 'c']);
  const layer = (l: number) => map.filter((n) => n.layer === l).sort((a, b) => a.col - b.col);

  it('opens with fights, has a camp before the boss and one boss at the end', () => {
    expect(layer(0).every((n) => n.kind === 'fight')).toBe(true);
    expect(layer(BOSS_LAYER - 1).every((n) => n.kind === 'rest')).toBe(true);
    expect(layer(BOSS_LAYER).map((n) => n.kind)).toEqual(['boss']);
    expect(layer(3).some((n) => n.kind === 'shop')).toBe(true);
    expect(map.filter((n) => n.layer < 2).some((n) => n.kind === 'elite')).toBe(false);
  });

  it('every stop leads on and can be reached, and paths never cross', () => {
    for (let l = 0; l < BOSS_LAYER; l++) {
      for (const n of layer(l)) expect(n.next.length, n.id).toBeGreaterThan(0);
      const targets = new Set(layer(l).flatMap((n) => n.next));
      for (const n of layer(l + 1)) expect(targets.has(n.id), n.id).toBe(true);
      const cols = layer(l).map((n) => n.next.map((id) => map.find((m) => m.id === id)!.col));
      for (let i = 1; i < cols.length; i++) expect(Math.min(...cols[i]!)).toBeGreaterThanOrEqual(Math.max(...cols[i - 1]!));
    }
    expect(new Set(map.map((n) => n.layer)).size).toBe(LAYERS);
  });

  it('is the same for the same seed, and gives each event stop an event', () => {
    expect(generateMap('seed', 0, ['a', 'b', 'c'])).toEqual(map);
    for (const n of map.filter((n) => n.kind === 'event')) expect(['a', 'b', 'c']).toContain(n.eventId);
  });
});

describe('story runs', () => {
  it('start with the first mission’s heroes, its intro and a checkpoint', () => {
    const s = start();
    const heroes = boardUnits(s.board);
    expect(heroes.map((u) => [u.name, u.classId, u.level, u.storyHero])).toEqual([
      ['Korrin', 'warrior', 2, 'korrin'],
      ['Ama', 'c-shaman', 2, 'ama'],
    ]);
    expect(heroes[0]!.lockedAdvanced).toBe('berserker');
    expect(s.story!.scene).toBe('intro');
    expect(s.story!.checkpoint?.story?.checkpoint).toBeNull();
    expect(s.lives).toBe(HOLLOWING.lives);
    expect(s.shop).toEqual([]);
  });

  it('can’t move on until the story text is read, and a fight must be fought before moving again', () => {
    let s = start();
    const first = reachable(s.story!.map, null)[0]!;
    expect(applyShopAction(s, { type: 'travel', node: first.id }, base)).toEqual({ ok: false, error: 'busy' });
    s = act(s, { type: 'scene' });
    expect(applyShopAction(s, { type: 'travel', node: 'nowhere' }, base)).toEqual({ ok: false, error: 'unreachable' });
    s = act(s, { type: 'travel', node: first.id });
    expect(s.story!.toFight).toBe(true);
    const onward = reachable(s.story!.map, s.story!.at)[0]!;
    expect(applyShopAction(s, { type: 'travel', node: onward.id }, base)).toEqual({ ok: false, error: 'busy' });
  });

  it('a won fight pays gold and XP and frees the party to move on', () => {
    const s = rig(at(start(), 'fight'), true);
    const r = fight(s, base);
    if (!r.ok) throw new Error(r.error);
    expect(r.combat.winner).toBe('player');
    expect(r.state.gold).toBe(s.gold + STORY_GOLD.fight);
    expect(r.state.story!.toFight).toBe(false);
    expect(r.state.wins).toBe(1);
  });

  it('heroes can’t be sold, and there are no locks or rerolls outside a shop', () => {
    const s = act(start(), { type: 'scene' });
    expect(applyShopAction(s, { type: 'sell', from: { row: 'front', col: 0 } }, base)).toEqual({ ok: false, error: 'storyHero' });
    expect(applyShopAction(s, { type: 'reroll' }, base)).toEqual({ ok: false, error: 'notHere' });
    expect(applyShopAction(s, { type: 'lock', offer: 0 }, base)).toEqual({ ok: false, error: 'notHere' });
  });

  it('a shop stop sells items, training and a consumable, never recruits, and allows rerolls', () => {
    let s = act(start(), { type: 'scene' });
    const shop = s.story!.map.find((n) => n.kind === 'shop')!;
    s.story!.at = s.story!.map.find((n) => n.next.includes(shop.id))!.id;
    s = act(s, { type: 'travel', node: shop.id });
    expect(s.shop.length).toBeGreaterThan(0);
    expect(s.shop.some((o) => o?.kind === 'unit')).toBe(false);
    s.gold = 10;
    expect(applyShopAction(s, { type: 'reroll' }, base).ok).toBe(true);
  });

  it('a story hero advances only into its story class; others choose freely', () => {
    const ctx = runContext(setup(), base);
    const levelTo3 = (unit: OwnedUnit) => grantXp(unit, ctx.config.progression.xpForLevel[2]!, ctx.content, ctx.config.progression, new Rng(1));
    const korrin: OwnedUnit = { ...newUnit(1, 'warrior', 'Korrin'), lockedAdvanced: 'berserker' };
    expect(levelTo3(korrin).find((c) => c.kind === 'advance')?.options).toEqual(['berserker']);
    expect(levelTo3(newUnit(2, 'warrior', 'Free')).find((c) => c.kind === 'advance')?.options).toEqual(['knight', 'berserker']);
  });

  it('events apply their outcomes once and remember what was picked', () => {
    let s = act(start(), { type: 'scene' });
    s.story!.prompt = { id: 'war-drums' };
    const atk = boardUnits(s.board).find((u) => u.storyHero === 'korrin')!.growth.atk;
    s = act(s, { type: 'storyChoice', option: 0 });
    expect(boardUnits(s.board).find((u) => u.storyHero === 'korrin')!.growth.atk).toBe(atk + 2);
    expect(s.story!.eliteNext).toBe(true);
    expect(s.story!.prompt?.chosen?.label).toContain('Korrin answers');
    expect(applyShopAction(s, { type: 'storyChoice', option: 0 }, base)).toEqual({ ok: false, error: 'noPendingChoice' });
  });

  it('a camp offers rest only when a life is missing', () => {
    const ctx = runContext(setup(), base);
    const s = start();
    expect(campOptions(s, ctx).some((o) => o.outcomes.some((x) => x.kind === 'life'))).toBe(false);
    s.lives -= 1;
    expect(campOptions(s, ctx)[0]!.outcomes).toEqual([{ kind: 'life', amount: 1 }]);
  });

  it('running out of lives restarts the mission from its checkpoint, with full lives', () => {
    let s = act(start(), { type: 'scene' });
    s = act(s, { type: 'travel', node: reachable(s.story!.map, null)[0]!.id });
    s = rig(s, false);
    s.lives = 1;
    const r = fight(s, base);
    if (!r.ok) throw new Error(r.error);
    expect(r.combat.winner).toBe('enemy');
    const after = r.state;
    expect(after.story!.restarts).toBe(1);
    expect(after.story!.restarted).toBe(true);
    expect(after.story!.at).toBeNull();
    expect(after.story!.scene).toBe('intro');
    expect(after.lives).toBe(HOLLOWING.lives);
    expect(after.losses).toBe(1);
    expect(boardUnits(after.board).every((u) => u.growth.hp === 0)).toBe(true);
    // The checkpoint survives for the next restart.
    expect(after.story!.checkpoint?.story?.path).toEqual([]);
  });

  it('a lost boss fight waits for another try', () => {
    const s = rig(at(start(), 'boss'), false);
    const r = fight(s, base);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.story!.toFight).toBe(true);
    expect(r.state.lives).toBe(s.lives - 1);
  });

  it('beating a mission’s boss opens the next mission: its map, its heroes, full lives and the boss’s spoils', () => {
    const s = rig(at(start(), 'boss'), true);
    s.lives = 1;
    const r = fight(s, base);
    if (!r.ok) throw new Error(r.error);
    const next = r.state;
    expect(next.story!.mission).toBe(1);
    expect(next.story!.scene).toBe('outro');
    expect(next.story!.at).toBeNull();
    expect(next.lives).toBe(HOLLOWING.lives);
    expect(boardUnits(next.board).map((u) => u.storyHero)).toEqual(expect.arrayContaining(['korrin', 'ama', 'thessa', 'bram']));
    expect(next.shop.filter((o) => o?.cost === 0)).toHaveLength(2);
    expect(next.story!.checkpoint?.story?.mission).toBe(1);
    // Read the outro, then the next intro.
    const read = act(act(next, { type: 'scene' }), { type: 'scene' });
    expect(read.story!.scene).toBeNull();
  });

  it('beating the last boss finishes the story', () => {
    let s = start();
    for (let m = 0; m < HOLLOWING.missions.length; m++) {
      const r = fight(rig(at(s, 'boss'), true), base);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.phase).toBe('complete');
    expect(boardUnits(s.board)).toHaveLength(5);
    expect(currentNode(s)?.kind).toBe('boss');
  });
});

describe('story heroes and the Tribe', () => {
  const content = runContext(setup(), base).content;
  const tribe = (units: OwnedUnit[]) => activeSynergies(units, content).find((a) => a.synergy.id === 'strength-of-the-tribe');
  const u = (classId: string, adv: string | null = null): OwnedUnit => ({ ...newUnit(1, classId, classId), advancedClassId: adv });

  it('Strength of the Tribe counts different Tribe classes: 3, 4 or 5, and doubles don’t count', () => {
    expect(tribe([u('warrior', 'berserker'), u('druid'), u('ranger', 'knight')])).toBeUndefined();
    expect(tribe([u('warrior', 'berserker'), u('druid'), u('c-shaman')])?.tier).toBe(0);
    expect(tribe([u('warrior', 'berserker'), u('druid'), u('c-shaman'), u('c-shaman')])?.tier).toBe(0);
    expect(tribe([u('warrior', 'berserker'), u('druid'), u('c-shaman'), u('sylvan')])?.tier).toBe(1);
    expect(tribe([u('warrior', 'berserker'), u('druid'), u('c-shaman'), u('sylvan'), u('ranger', 'beastmaster')])?.tier).toBe(2);
  });

  it('the story’s own ladder replaces the run ladder', () => {
    const mods = setupModifiers(setup(3), base.content);
    expect(mods).toContainEqual(HOLLOWING.tiers[2]!.modifier);
    expect(mods).toContainEqual({ noRecruits: true });
    expect(mods).not.toContainEqual(base.content.ladder[0]!.modifier);
  });
});

describe('story records', () => {
  it('finishing a story opens its next tier and unlocks the Shaman, the Sylvan and Strength of the Tribe', () => {
    const profile = newProfile();
    expect(unlockedContent(profile, META_CATALOG).classes).not.toContain('sylvan');
    expect(unlockedContent(profile, META_CATALOG).synergies).not.toContain('strength-of-the-tribe');
    const done = { ...start(), phase: 'complete' as const };
    const r = recordStoryEnd(profile, done, HOLLOWING.tiers.length, META_CATALOG);
    expect(r.earned.map((a) => a.id)).toEqual(['spirits-restored']);
    expect(storyMaxTier(r.profile, 'hollowing', HOLLOWING.tiers.length)).toBe(1);
    expect(r.profile.stories?.hollowing?.completions).toBe(1);
    const unlocked = unlockedContent(r.profile, META_CATALOG);
    expect(unlocked.classes).toEqual(expect.arrayContaining(['c-shaman', 'sylvan']));
    expect(unlocked.synergies).toContain('strength-of-the-tribe');
    // Story runs don't count as runs.
    expect(r.profile.stats.runs).toBe(0);
  });

  it('an unfinished story records nothing', () => {
    const profile = newProfile();
    expect(recordStoryEnd(profile, start(), HOLLOWING.tiers.length, META_CATALOG).profile).toBe(profile);
  });
});

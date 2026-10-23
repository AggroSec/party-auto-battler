import { describe, expect, it } from 'vitest';
import type { CombatResult } from '../events.ts';
import { createRun, defaultSetup, newUnit } from '../run/index.ts';
import { makeCtx } from '../run/test-fixtures.ts';
import type { RunState } from '../run/types.ts';
import { recordDiscovery, recordFight, recordRunEnd } from './achievements.ts';
import { dailyRun, newProfile, perkOffer, runSetupFor, unlockedContent } from './profile.ts';
import type { MetaCatalog } from './types.ts';

const CATALOG: MetaCatalog = {
  starter: { classes: ['tank'], items: ['sword'], synergies: ['guards'], perks: ['a', 'b', 'c'], perkSlots: 1 },
  achievements: [
    { id: 'win', name: 'Win', description: 'Win a run', condition: { kind: 'completeRun' }, reward: { classes: ['archer'], items: ['boots'] } },
    { id: 'streak', name: 'Streak', description: '2 in a row', condition: { kind: 'winStreak', count: 2 }, reward: { perks: ['d'] } },
    { id: 'perk', name: 'Perkception', description: 'Tier 1', condition: { kind: 'completeRun', minTier: 1 }, reward: { perkSlots: 1 } },
    { id: 'thread', name: 'Thread', description: '1 life', condition: { kind: 'completeRun', maxLives: 1 }, reward: { synergies: ['mixed'] } },
    { id: 'disc', name: 'Disc', description: 'Discover 1', condition: { kind: 'tertiaryDiscovered', count: 1 }, reward: { perks: ['e'] } },
    { id: 'lose', name: 'Lose', description: 'Lose a run', condition: { kind: 'loseRun' }, reward: {} },
  ],
  all: { classes: ['tank', 'archer'], items: ['sword', 'boots'], synergies: ['guards', 'mixed'], perks: ['a', 'b', 'c', 'd', 'e'] },
  maxTier: 3,
  maxPerkSlots: 3,
  perkChoiceExtra: 2,
};

const ctx = makeCtx();
const combat = (winner: CombatResult['winner']): CombatResult => ({ winner, ticks: 30, events: [], summary: [] });
function ended(phase: RunState['phase'], over: Partial<RunState> = {}): RunState {
  return { ...createRun('s', ctx), phase, ...over };
}

describe('unlocks', () => {
  it('starts with the starter set and adds achievement rewards', () => {
    const p = newProfile();
    expect(unlockedContent(p, CATALOG)).toEqual({ classes: ['tank'], items: ['sword'], synergies: ['guards'], perks: ['a', 'b', 'c'], perkSlots: 1, maxTier: 0 });
    const earned = unlockedContent({ ...p, achievements: ['win', 'perk'], maxTier: 2 }, CATALOG);
    expect(earned).toMatchObject({ classes: ['tank', 'archer'], items: ['sword', 'boots'], perkSlots: 2, maxTier: 2 });
  });

  it('unlock-all opens everything', () => {
    expect(unlockedContent({ ...newProfile(), unlockAll: true }, CATALOG)).toEqual({
      classes: ['tank', 'archer'],
      items: ['sword', 'boots'],
      synergies: ['guards', 'mixed'],
      perks: ['a', 'b', 'c', 'd', 'e'],
      perkSlots: 3,
      maxTier: 3,
    });
  });

  it('builds a run setup, clamping tier and perks to what is unlocked', () => {
    const u = unlockedContent(newProfile(), CATALOG);
    expect(runSetupFor(u, 5, ['a', 'b', 'zzz'])).toEqual({ tier: 0, perks: ['a'], classes: ['tank'], items: ['sword'], synergies: ['guards'] });
  });

  it('offers kept + 2 perks, deterministically per seed', () => {
    const offer = perkOffer('seed', CATALOG.all.perks, 1, CATALOG);
    expect(offer).toHaveLength(3);
    expect(new Set(offer).size).toBe(3);
    expect(perkOffer('seed', CATALOG.all.perks, 1, CATALOG)).toEqual(offer);
    expect(perkOffer('seed', CATALOG.all.perks, 3, CATALOG)).toHaveLength(5);
  });

  it('daily runs are the same for a date and use everything', () => {
    const a = dailyRun('2026-10-23', CATALOG);
    expect(dailyRun('2026-10-23', CATALOG)).toEqual(a);
    expect(a.seed).toBe('daily-2026-10-23');
    expect(a.setup).toMatchObject({ daily: '2026-10-23', classes: ['tank', 'archer'] });
    expect([2, 3, 4, 5, 6]).toContain(a.setup.tier);
    expect(a.perkOffer).toHaveLength(3);
  });
});

describe('achievements', () => {
  it('a won fight counts toward lifetime stats and fight achievements', () => {
    const before = createRun('s', ctx);
    const after = { ...before, winStreak: 2 };
    const r = recordFight(newProfile(), { before, after, combat: combat('player') }, ctx, CATALOG);
    expect(r.profile.stats.fightsWon).toBe(1);
    expect(r.earned.map((a) => a.id)).toEqual(['streak']);
    // Already earned: not again.
    expect(recordFight(r.profile, { before, after, combat: combat('player') }, ctx, CATALOG).earned).toEqual([]);
  });

  it('winning a run unlocks the next tier and run achievements', () => {
    const r = recordRunEnd(newProfile(), ended('complete', { lives: 1 }), CATALOG);
    expect(r.profile).toMatchObject({ maxTier: 1, stats: { runs: 1, completed: 1 } });
    expect(r.earned.map((a) => a.id).sort()).toEqual(['thread', 'win']);
    const tier1 = recordRunEnd(r.profile, ended('complete', { lives: 3, setup: { ...defaultSetup(ctx), tier: 1 } }), CATALOG);
    expect(tier1.profile.maxTier).toBe(2);
    expect(tier1.earned.map((a) => a.id)).toEqual(['perk']);
    // Winning a lower tier again doesn't move the ladder.
    expect(recordRunEnd(tier1.profile, ended('complete'), CATALOG).profile.maxTier).toBe(2);
  });

  it('a lost run and a daily run', () => {
    expect(recordRunEnd(newProfile(), ended('defeated'), CATALOG).earned.map((a) => a.id)).toEqual(['lose']);
    const daily = recordRunEnd(newProfile(), ended('complete', { wins: 15, setup: { ...defaultSetup(ctx), daily: '2026-10-23' } }), CATALOG);
    expect(daily.profile.daily).toMatchObject({ date: '2026-10-23', completed: true, done: true, wins: 15 });
    expect(daily.profile.maxTier).toBe(0);
  });

  it('discovering a tertiary class mid-shop', () => {
    const s = createRun('s', ctx);
    s.board.front[0] = { ...newUnit(1, 'tank', 'T'), advancedClassId: 'paladin', tertiaryClassId: 'templar' };
    const r = recordDiscovery(newProfile(), s, CATALOG);
    expect(r.profile.discovered).toEqual(['templar']);
    expect(r.earned.map((a) => a.id)).toEqual(['disc']);
  });
});

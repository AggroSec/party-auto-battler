import { describe, expect, it } from 'vitest';
import { CLASS_IDS } from '../../data/classes.ts';
import { partyOf } from '../../data/units.ts';
import { Rng, simulateCombat, type CombatResult } from '../../engine/index.ts';
import { aliveOn, buildTimeline } from './playback.ts';

function randomFight(seed: number): CombatResult {
  const rng = new Rng(seed);
  const pick = () => rng.pick(CLASS_IDS);
  return simulateCombat({
    player: partyOf([pick(), pick(), pick()], [pick(), pick()]),
    enemy: partyOf([pick(), pick(), pick()], [pick(), pick()]),
    rng: new Rng(`fight${seed}`),
  });
}

describe('combat playback timeline', () => {
  it('starts from the line-up and ends on the winner', () => {
    const r = randomFight(1);
    const frames = buildTimeline(r);
    expect(frames[0]?.kind).toBe('start');
    expect(Object.values(frames[0]!.units).every((u) => u.alive && u.hp === u.maxHp)).toBe(true);
    expect(frames.at(-1)).toMatchObject({ kind: 'end', winner: r.winner });
  });

  it('has one frame per turn and replays every event exactly once', () => {
    for (let seed = 0; seed < 20; seed++) {
      const r = randomFight(seed);
      const frames = buildTimeline(r);
      expect(frames.filter((f) => f.kind === 'turn')).toHaveLength(r.events.filter((e) => e.type === 'turn').length);
      expect(frames.reduce((n, f) => n + f.events.length, 0)).toBe(r.events.length - 1);
    }
  });

  it('final HP and survival match the engine result', () => {
    for (let seed = 0; seed < 20; seed++) {
      const r = randomFight(seed);
      const last = buildTimeline(r).at(-1)!;
      for (const s of r.summary) expect(last.units[s.id]?.alive).toBe(s.survived);
      const lastHp = new Map<string, number>();
      for (const e of r.events) if (e.type === 'damage' || e.type === 'heal') lastHp.set(e.target, e.hpAfter);
      for (const [id, hp] of lastHp) expect(last.units[id]?.hp).toBe(hp);
      if (r.winner !== 'draw') expect(aliveOn(last, r.winner === 'player' ? 'enemy' : 'player')).toHaveLength(0);
    }
  });

  it('shows the actor with a full gauge and fills, never drains, the others', () => {
    for (let seed = 0; seed < 10; seed++) {
      const frames = buildTimeline(randomFight(seed));
      for (const [i, f] of frames.entries()) {
        if (f.kind === 'turn') expect(f.units[f.actor!]!.gauge).toBeGreaterThanOrEqual(100);
        expect(f.gap).toBe(i === 0 ? 0 : f.tick - frames[i - 1]!.tick);
        for (const u of Object.values(f.units)) expect(u.gaugeFrom).toBeLessThanOrEqual(u.gauge);
      }
    }
  });

  it('does not mutate earlier frames', () => {
    const frames = buildTimeline(randomFight(3));
    expect(Object.values(frames[0]!.units).every((u) => u.hp === u.maxHp)).toBe(true);
  });

  it('returns nothing for a log without a start event', () => {
    expect(buildTimeline({ winner: 'draw', ticks: 0, events: [], summary: [] })).toEqual([]);
  });
});

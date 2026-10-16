import { describe, expect, it } from 'vitest';
import { DEFAULT_TICK_CAP, Rng, simulateCombat, type Party } from '../engine/index.ts';
import { CLASSES, CLASS_IDS, STARTER_CLASS_IDS, type ClassId } from './classes.ts';
import { createUnit, partyOf } from './units.ts';

describe('class data', () => {
  it('has five starter classes and one unlockable', () => {
    expect(STARTER_CLASS_IDS).toEqual(['warrior', 'rogue', 'mage', 'cleric', 'ranger']);
    expect(CLASS_IDS.filter((id) => CLASSES[id].unlockable)).toEqual(['necromancer']);
  });

  it.each(CLASS_IDS)('%s has sane stats and ability', (id) => {
    const c = CLASSES[id];
    expect(c.id).toBe(id);
    expect(c.baseStats.hp).toBeGreaterThan(0);
    expect(c.baseStats.atk).toBeGreaterThan(0);
    expect(c.baseStats.def).toBeGreaterThanOrEqual(0);
    expect(c.baseStats.spd).toBeGreaterThan(0);
    expect(c.ability.cooldown).toBeGreaterThanOrEqual(1);
    expect(c.ability.effects.length).toBeGreaterThan(0);
  });

  it('createUnit applies stat bonuses without mutating class data', () => {
    const u = createUnit('warrior', { name: 'Brom', statBonus: { atk: 2 } });
    expect(u).toMatchObject({ name: 'Brom', classId: 'warrior', stats: { atk: 7, hp: 40 } });
    expect(CLASSES.warrior.baseStats.atk).toBe(5);
  });
});

describe('full fights with real classes', () => {
  const randomParty = (rng: Rng): Party => {
    const pick = (): ClassId | null => (rng.chance(0.15) ? null : rng.pick(CLASS_IDS));
    return partyOf([pick(), pick(), pick()], [pick(), pick()]);
  };

  it('replays identically from the same seed', () => {
    const p = partyOf(['warrior', 'rogue', 'ranger'], ['mage', 'cleric']);
    const e = partyOf(['warrior', 'necromancer', 'rogue'], ['ranger', 'mage']);
    const a = simulateCombat({ player: p, enemy: e, rng: new Rng('replay') });
    const b = simulateCombat({ player: p, enemy: e, rng: new Rng('replay') });
    expect(a.events).toEqual(b.events);
  });

  it('always terminates within the tick cap across many random matchups', () => {
    const rng = new Rng('fuzz');
    for (let i = 0; i < 500; i++) {
      const r = simulateCombat({ player: randomParty(rng), enemy: randomParty(rng), rng: rng.fork() });
      expect(r.ticks).toBeLessThanOrEqual(DEFAULT_TICK_CAP);
      expect(r.events.at(-1)?.type).toBe('combatEnd');
      expect(r.events.filter((e) => e.type === 'combatEnd')).toHaveLength(1);
    }
  });
});

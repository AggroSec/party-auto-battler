import { describe, expect, it } from 'vitest';
import { selectTargets } from './targeting.ts';
import { byId, makeState, party, unit } from './test-helpers.ts';

const ids = (units: { id: string }[]) => units.map((u) => u.id);

describe('nearest targeting', () => {
  it('hits the front row, preferring the same column', () => {
    const s = makeState(party([unit(), unit(), unit()]), party([unit(), unit(), unit()], [unit(), unit()]));
    expect(ids(selectTargets(s, byId(s, 'p0'), 'nearest'))).toEqual(['e0']);
    expect(ids(selectTargets(s, byId(s, 'p1'), 'nearest'))).toEqual(['e1']);
    expect(ids(selectTargets(s, byId(s, 'p2'), 'nearest'))).toEqual(['e2']);
  });

  it('picks the closest living front-row unit when its lane is empty', () => {
    const s = makeState(party([null, null, unit()]), party([unit(), null, null], [unit()]));
    expect(ids(selectTargets(s, byId(s, 'p2'), 'nearest'))).toEqual(['e0']);
  });

  it('only reaches the back row once the front row is dead', () => {
    const s = makeState(party([unit()]), party([unit()], [unit(), unit()]));
    expect(ids(selectTargets(s, byId(s, 'p0'), 'nearest'))).toEqual(['e0']);
    byId(s, 'e0').alive = false;
    expect(ids(selectTargets(s, byId(s, 'p0'), 'nearest'))).toEqual(['e3']);
  });

  it('breaks lane ties toward the lower column (back-row attacker)', () => {
    // Back col 0 sits at x=0.5: equidistant from front 0 and front 1.
    const s = makeState(party([], [unit()]), party([unit(), unit(), unit()]));
    expect(ids(selectTargets(s, byId(s, 'p3'), 'nearest'))).toEqual(['e0']);
  });
});

describe('other enemy selectors', () => {
  it('backlineFirst picks the weakest back-row enemy, else falls back to nearest', () => {
    const s = makeState(party([unit()]), party([unit()], [unit(), unit()]));
    byId(s, 'e4').hp = 3;
    expect(ids(selectTargets(s, byId(s, 'p0'), 'backlineFirst'))).toEqual(['e4']);
    byId(s, 'e3').alive = false;
    byId(s, 'e4').alive = false;
    expect(ids(selectTargets(s, byId(s, 'p0'), 'backlineFirst'))).toEqual(['e0']);
  });

  it('lowestHp ignores rows and breaks ties by board order', () => {
    const s = makeState(party([unit()]), party([unit(), unit()], [unit()]));
    expect(ids(selectTargets(s, byId(s, 'p0'), 'lowestHp'))).toEqual(['e0']);
    byId(s, 'e3').hp = 1;
    expect(ids(selectTargets(s, byId(s, 'p0'), 'lowestHp'))).toEqual(['e3']);
  });

  it('highestAtk picks the hardest hitter', () => {
    const s = makeState(party([unit()]), party([unit(), unit({ stats: { atk: 9 } })]));
    expect(ids(selectTargets(s, byId(s, 'p0'), 'highestAtk'))).toEqual(['e1']);
  });

  it('enemyFrontRow hits the whole frontmost row', () => {
    const s = makeState(party([unit()]), party([unit(), null, unit()], [unit()]));
    expect(ids(selectTargets(s, byId(s, 'p0'), 'enemyFrontRow'))).toEqual(['e0', 'e2']);
    byId(s, 'e0').alive = false;
    byId(s, 'e2').alive = false;
    expect(ids(selectTargets(s, byId(s, 'p0'), 'enemyFrontRow'))).toEqual(['e3']);
  });

  it('randomEnemy is deterministic for a given seed', () => {
    const pick = (seed: number) => {
      const s = makeState(party([unit()]), party([unit(), unit(), unit()], [unit(), unit()]), seed);
      return Array.from({ length: 10 }, () => selectTargets(s, byId(s, 'p0'), 'randomEnemy')[0]!.id);
    };
    expect(pick(11)).toEqual(pick(11));
  });

  it('returns nothing when no enemies are alive', () => {
    const s = makeState(party([unit()]), party([unit()]));
    byId(s, 'e0').alive = false;
    expect(selectTargets(s, byId(s, 'p0'), 'nearest')).toEqual([]);
    expect(selectTargets(s, byId(s, 'p0'), 'randomEnemy')).toEqual([]);
  });
});

describe('ally and context selectors', () => {
  it('lowestHpAlly uses HP ratio, including self', () => {
    const s = makeState(party([unit({ stats: { hp: 40 } }), unit({ stats: { hp: 10 } })]), party([unit()]));
    byId(s, 'p0').hp = 30; // 75%
    byId(s, 'p1').hp = 8; // 80%
    expect(ids(selectTargets(s, byId(s, 'p1'), 'lowestHpAlly'))).toEqual(['p0']);
  });

  it('allAllies and allEnemies return living units in board order', () => {
    const s = makeState(party([unit(), unit()], [unit()]), party([unit()], [unit()]));
    byId(s, 'p1').alive = false;
    expect(ids(selectTargets(s, byId(s, 'p0'), 'allAllies'))).toEqual(['p0', 'p3']);
    expect(ids(selectTargets(s, byId(s, 'p0'), 'allEnemies'))).toEqual(['e0', 'e3']);
  });

  it('trigger selectors only return living context units', () => {
    const s = makeState(party([unit()]), party([unit()]));
    const p0 = byId(s, 'p0');
    const e0 = byId(s, 'e0');
    expect(ids(selectTargets(s, p0, 'triggerSource', { triggerSource: e0 }))).toEqual(['e0']);
    expect(selectTargets(s, p0, 'triggerTarget')).toEqual([]);
    e0.alive = false;
    expect(selectTargets(s, p0, 'triggerSource', { triggerSource: e0 })).toEqual([]);
  });
});

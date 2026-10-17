import { describe, expect, it } from 'vitest';
import { enemyCount, generateEnemy, roundScaling } from './enemies.ts';
import { ARCHETYPES, makeCtx } from './test-fixtures.ts';

const units = (p: ReturnType<typeof generateEnemy>) => [...p.front, ...p.back].filter((u) => u !== null);

describe('enemy generation', () => {
  const { content } = makeCtx();

  it('sizes parties from the table, reusing the last entry for later rounds', () => {
    expect([1, 2, 3, 4, 9].map((r) => enemyCount(r, content))).toEqual([1, 2, 3, 3, 3]);
    expect(units(generateEnemy('s', 2, content))).toHaveLength(2);
  });

  it('never exceeds the board size', () => {
    const big = makeCtx({ content: { enemyScaling: { unitsByRound: [9], baseMultiplier: 1, hpGrowthPerRound: 0, atkGrowthPerRound: 0 } } });
    expect(enemyCount(1, big.content)).toBe(5);
  });

  it('only uses archetypes unlocked by the round', () => {
    for (let seed = 0; seed < 20; seed++) {
      expect(units(generateEnemy(`s${seed}`, 2, content)).every((u) => u.classId === 'tank')).toBe(true);
    }
    const late = new Set(
      Array.from({ length: 20 }, (_, i) => units(generateEnemy(`s${i}`, 5, content)).map((u) => u.classId)).flat(),
    );
    expect(late).toEqual(new Set(['tank', 'archer']));
  });

  it('scales HP and ATK with the round', () => {
    expect(roundScaling(1, content)).toEqual({ hp: 1, atk: 1 });
    const r1 = units(generateEnemy('s', 1, content))[0]!;
    const r3 = units(generateEnemy('s', 3, content)).find((u) => u.classId === 'tank')!;
    expect(r1.stats.hp).toBe(30);
    expect(r3.stats.hp).toBe(36);
    expect(r3.stats.atk).toBe(6);
  });

  it('applies archetype multipliers', () => {
    const beefy = makeCtx({ enemies: [{ ...ARCHETYPES.grunt!, statMultiplier: { hp: 2 } }] });
    expect(units(generateEnemy('s', 1, beefy.content))[0]!.stats.hp).toBe(60);
  });

  it('places frontliners in front and backliners behind', () => {
    const mixed = makeCtx({ enemies: [ARCHETYPES.grunt!, { ...ARCHETYPES.sniper!, minRound: 1 }] });
    for (let i = 0; i < 20; i++) {
      const p = generateEnemy(`p${i}`, 3, mixed.content);
      for (const u of p.back) if (u) expect(u.classId).toBe('archer');
    }
  });

  it('is deterministic per seed and round', () => {
    expect(generateEnemy('x', 3, content)).toEqual(generateEnemy('x', 3, content));
  });
});

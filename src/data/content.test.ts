import { describe, expect, it } from 'vitest';
import { createRun, fight } from '../engine/run/index.ts';
import { CLASSES } from './classes.ts';
import { buildRunContent, buildRunContext } from './content.ts';
import { ENEMY_ARCHETYPES } from './enemies.ts';

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

  it('plays a real round end to end', () => {
    const ctx = buildRunContext();
    let s = createRun('smoke', ctx);
    s.board.front[0] = { uid: 1, classId: 'warrior', name: 'Test' };
    const r = fight(s, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) s = r.state;
    expect(s.history).toHaveLength(1);
  });
});

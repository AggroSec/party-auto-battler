import type { RunContent, RunContext } from '../engine/run/types.ts';
import { CLASSES, STARTER_CLASS_IDS, type ClassId } from './classes.ts';
import { RUN_CONFIG } from './economy.ts';
import { ENEMY_ARCHETYPES, ENEMY_SCALING } from './enemies.ts';
import { UNIT_NAMES } from './names.ts';

/**
 * Assemble the content a run needs. `unlocked` adds meta-progression classes
 * (e.g. the Necromancer) to the shop; enemies may use any class regardless.
 */
export function buildRunContent(unlocked: readonly ClassId[] = []): RunContent {
  return {
    classes: CLASSES,
    shopPool: [...STARTER_CLASS_IDS, ...unlocked.filter((id) => !STARTER_CLASS_IDS.includes(id))],
    enemies: ENEMY_ARCHETYPES,
    enemyScaling: ENEMY_SCALING,
    unitNames: UNIT_NAMES,
  };
}

export function buildRunContext(unlocked: readonly ClassId[] = []): RunContext {
  return { config: RUN_CONFIG, content: buildRunContent(unlocked) };
}

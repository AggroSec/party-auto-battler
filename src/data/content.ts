import type { RunContent, RunContext } from '../engine/run/types.ts';
import { CLASSES, STARTER_CLASS_IDS, type ClassId } from './classes.ts';
import { RUN_CONFIG } from './economy.ts';
import { ADVANCED_CLASSES, TALENTS, TERTIARY_CLASSES } from './builds/index.ts';
import { ENEMY_ARCHETYPES, ENEMY_PROGRESSION, ENEMY_SCALING } from './enemies.ts';
import { ITEMS, ITEM_IDS } from './items.ts';
import { UNIT_NAMES } from './names.ts';
import { SYNERGIES } from './synergies.ts';

/**
 * Assemble the content a run needs. `unlocked` adds meta-progression classes
 * (e.g. the Necromancer) to the shop; enemies may use any class regardless.
 */
export function buildRunContent(unlocked: readonly ClassId[] = []): RunContent {
  return {
    classes: CLASSES,
    advancedClasses: ADVANCED_CLASSES,
    tertiaryClasses: TERTIARY_CLASSES,
    talents: TALENTS,
    items: ITEMS,
    synergies: SYNERGIES,
    shopPool: [...STARTER_CLASS_IDS, ...unlocked.filter((id) => !STARTER_CLASS_IDS.includes(id))],
    itemPool: ITEM_IDS,
    enemies: ENEMY_ARCHETYPES,
    enemyScaling: ENEMY_SCALING,
    enemyProgression: ENEMY_PROGRESSION,
    unitNames: UNIT_NAMES,
  };
}

export function buildRunContext(unlocked: readonly ClassId[] = []): RunContext {
  return { config: RUN_CONFIG, content: buildRunContent(unlocked) };
}

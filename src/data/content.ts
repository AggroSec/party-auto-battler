import type { RunContent, RunContext } from '../engine/run/types.ts';
import { CLASSES, CLASS_IDS } from './classes.ts';
import { RUN_CONFIG } from './economy.ts';
import { ADVANCED_CLASSES, TALENTS, TERTIARY_CLASSES } from './builds/index.ts';
import { ENEMY_ARCHETYPES, ENEMY_PROGRESSION, ENEMY_SCALING } from './enemies.ts';
import { ITEMS, ITEM_IDS } from './items.ts';
import { BOSSES } from './meta/bosses.ts';
import { ELITE, LADDER } from './meta/ladder.ts';
import { PERKS } from './meta/perks.ts';
import { UNIT_NAMES } from './names.ts';
import { SYNERGIES } from './synergies.ts';

/**
 * Assemble everything a run can use. A run's setup (M7) narrows this to what
 * the player has unlocked; with the default setup (the simulator's) every
 * class, item and synergy is in play.
 */
export function buildRunContent(): RunContent {
  return {
    classes: CLASSES,
    advancedClasses: ADVANCED_CLASSES,
    tertiaryClasses: TERTIARY_CLASSES,
    talents: TALENTS,
    items: ITEMS,
    synergies: SYNERGIES,
    shopPool: CLASS_IDS,
    itemPool: ITEM_IDS,
    enemies: ENEMY_ARCHETYPES,
    enemyScaling: ENEMY_SCALING,
    enemyProgression: ENEMY_PROGRESSION,
    unitNames: UNIT_NAMES,
    ladder: LADDER,
    perks: PERKS,
    bosses: BOSSES,
    elite: ELITE,
  };
}

export function buildRunContext(): RunContext {
  return { config: RUN_CONFIG, content: buildRunContent() };
}

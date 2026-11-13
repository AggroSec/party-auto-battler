import type { RunContent, RunContext } from '../engine/run/types.ts';
import { CLASSES, CLASS_IDS } from './classes.ts';
import { RUN_CONFIG } from './economy.ts';
import { ADVANCED_CLASSES, TALENTS, TERTIARY_CLASSES } from './builds/index.ts';
import { ENEMY_ARCHETYPES, ENEMY_PROGRESSION, ENEMY_SCALING } from './enemies.ts';
import { CONSUMABLE_IDS } from './consumables.ts';
import { ITEMS, ITEM_IDS } from './items.ts';
import { BOSS_CLASSES, BOSSES } from './meta/bosses.ts';
import { ELITE, LADDER } from './meta/ladder.ts';
import { PERKS } from './meta/perks.ts';
import { UNIT_NAMES } from './names.ts';
import { RULES_ADVANCED, RULES_CLASSES, RULES_ENEMIES, RULES_MODE_MODIFIER, RULES_STATUSES, RULES_TALENTS, RULES_TERTIARY } from './rules-mode/index.ts';
import { HOLLOWING_BOSS_CLASSES } from './stories/hollowing-bosses.ts';
import { STORIES, STORY_MODE_MODIFIER } from './stories/index.ts';
import { SYNERGIES } from './synergies.ts';

/**
 * Assemble everything a run can use. A run's setup (M7) narrows this to what
 * the player has unlocked; with the default setup (the simulator's) every
 * class, item and synergy is in play.
 */
export function buildRunContent(): RunContent {
  return {
    // Unique bosses fight as their own classes, which never reach the shop.
    // Rules-mode classes (post-1.0) live alongside; a run's setup picks which it can recruit.
    classes: { ...CLASSES, ...BOSS_CLASSES, ...HOLLOWING_BOSS_CLASSES, ...RULES_CLASSES },
    advancedClasses: { ...ADVANCED_CLASSES, ...RULES_ADVANCED },
    tertiaryClasses: { ...TERTIARY_CLASSES, ...RULES_TERTIARY },
    talents: { ...TALENTS, ...RULES_TALENTS },
    statuses: RULES_STATUSES,
    items: ITEMS,
    synergies: SYNERGIES,
    shopPool: CLASS_IDS,
    itemPool: ITEM_IDS,
    consumablePool: CONSUMABLE_IDS,
    enemies: [...ENEMY_ARCHETYPES, ...RULES_ENEMIES],
    enemyScaling: ENEMY_SCALING,
    enemyProgression: ENEMY_PROGRESSION,
    unitNames: UNIT_NAMES,
    ladder: LADDER,
    modes: { rules: RULES_MODE_MODIFIER, story: STORY_MODE_MODIFIER },
    stories: STORIES,
    perks: PERKS,
    bosses: BOSSES,
    elite: ELITE,
  };
}

export function buildRunContext(): RunContext {
  return { config: RUN_CONFIG, content: buildRunContent() };
}

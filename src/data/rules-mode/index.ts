// Rules mode (post-1.0): its classes, assembled for the run content.
import type { AdvancedClassDef, ClassTemplate, TalentDef, TertiaryClassDef } from '../../engine/run/content-types.ts';
import type { EnemyArchetype, RunModifier } from '../../engine/run/types.ts';
import { APOSTATE_TREE } from './apostate.ts';
import { CLERIC_TREE } from './cleric.ts';
import type { Built } from './dsl.ts';
import { MAGE_TREE } from './mage.ts';
import { MARAUDER_TREE } from './marauder.ts';
import { ROGUE_TREE } from './rogue.ts';
import { RUNEBLADE_TREE } from './runeblade.ts';
import { SHAMAN_TREE } from './shaman.ts';
import { SYLVAN_TREE } from './sylvan.ts';
import { WARRIOR_TREE } from './warrior.ts';

export { RULES_STATUSES } from './statuses.ts';

const TREES = [WARRIOR_TREE, CLERIC_TREE, ROGUE_TREE, MAGE_TREE, RUNEBLADE_TREE, SHAMAN_TREE, SYLVAN_TREE, APOSTATE_TREE, MARAUDER_TREE];

const record = <T extends { id: string }>(items: Built<T>[]) => Object.fromEntries(items.map((b) => [b.cls.id, b.cls]));

export const RULES_CLASSES: Record<string, ClassTemplate> = record(TREES.map((t) => t[0] as Built<ClassTemplate>));
export const RULES_ADVANCED: Record<string, AdvancedClassDef> = record(TREES.flatMap((t) => t.slice(1, 3) as Built<AdvancedClassDef>[]));
export const RULES_TERTIARY: Record<string, TertiaryClassDef> = record(TREES.flatMap((t) => t.slice(3) as Built<TertiaryClassDef>[]));
export const RULES_TALENTS: Record<string, TalentDef> = Object.fromEntries(TREES.flat().flatMap((b) => b.talents).map((t) => [t.id, t]));

/**
 * Rules-mode classes in display order. Achievements unlock the Shaman, and
 * the story classes (Milestone 15: Sylvan, Apostate, Marauder) come with
 * finishing their story.
 */
export const RULES_CLASS_IDS = Object.keys(RULES_CLASSES);
const LOCKED_RULES_CLASSES = ['shaman', 'r-sylvan', 'r-apostate', 'r-marauder'];
export const RULES_STARTER_IDS = RULES_CLASS_IDS.filter((id) => !LOCKED_RULES_CLASSES.includes(id));

/**
 * Rules mode's own tuning: enemies fight by tuned default rules every time,
 * so they're a little weaker than in classic runs (simulator, post-1.0).
 */
export const RULES_MODE_MODIFIER: RunModifier = { enemyStats: -0.12 };

/** Rules-mode enemies: they fight by their classes' default rules. */
export const RULES_ENEMIES: EnemyArchetype[] = [
  { id: 'iron-legionnaire', name: 'Iron Legionnaire', classId: 'r-warrior', minRound: 1 },
  { id: 'temple-healer', name: 'Temple Healer', classId: 'r-cleric', minRound: 1 },
  { id: 'shadow-cutpurse', name: 'Shadow Cutpurse', classId: 'r-rogue', minRound: 1 },
  { id: 'battlemage', name: 'Battlemage', classId: 'r-mage', minRound: 1 },
  { id: 'runic-sellsword', name: 'Runic Sellsword', classId: 'r-runeblade', minRound: 2 },
  { id: 'tribal-shaman', name: 'Tribal Shaman', classId: 'shaman', minRound: 3 },
  // Milestone 15: the story classes, once their stories unlock them.
  { id: 'grove-sylvan', name: 'Grove Sylvan', classId: 'r-sylvan', minRound: 3 },
  { id: 'heretic-priest', name: 'Heretic Priest', classId: 'r-apostate', minRound: 3 },
  { id: 'pit-brute', name: 'Pit Brute', classId: 'r-marauder', minRound: 2 },
];

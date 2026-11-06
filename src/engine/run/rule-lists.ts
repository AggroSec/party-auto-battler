// Rules mode (post-1.0): a unit's skills and priority list, from its class
// tiers and the player's edits.
import { MAX_RULES } from '../tactics.ts';
import { BASIC_ATTACK, type AbilityDef, type Rule, type RuleCondition, type TargetSelector } from '../types.ts';
import { classFor, classTiers } from './build.ts';
import type { OwnedUnit, RunContent } from './types.ts';

/** Is this a rules-mode unit (its class has skills)? */
export function isRulesUnit(unit: OwnedUnit, content: RunContent): boolean {
  return classFor(content, unit.classId).skills !== undefined;
}

/** The unit's skills from its class tiers, base first (granted abilities are added when resolving). */
export function unitSkills(unit: OwnedUnit, content: RunContent): AbilityDef[] {
  const { adv, tert } = classTiers(unit, content);
  return [...(classFor(content, unit.classId).skills ?? []), ...(adv?.skills ?? []), ...(tert?.skills ?? [])];
}

/** The class defaults: the newest tier's rules first, then the earlier tiers'. */
export function defaultRules(unit: OwnedUnit, content: RunContent): Rule[] {
  const { adv, tert } = classTiers(unit, content);
  return [...(tert?.rules ?? []), ...(adv?.rules ?? []), ...(classFor(content, unit.classId).rules ?? [])].slice(0, MAX_RULES);
}

/** The rules the unit fights by: the player's list, or its class defaults. */
export function unitRules(unit: OwnedUnit, content: RunContent): Rule[] {
  return unit.rules ?? defaultRules(unit, content);
}

/** Targets a rule can pick, by what the skill aims at. */
export const ENEMY_TARGETS: readonly TargetSelector[] = ['nearest', 'mostAfflicted', 'lowestHp', 'highestAtk', 'backlineFirst', 'randomEnemy'];
export const ALLY_TARGETS: readonly TargetSelector[] = ['lowestHpAlly', 'mostAfflictedAlly', 'self'];

/**
 * The targets a rule for this skill may choose. Basic attacks aim at enemies;
 * a skill that doesn't aim uses its rule's target only for conditions, so any.
 */
export function targetsFor(skill: AbilityDef | undefined): readonly TargetSelector[] {
  if (!skill) return ENEMY_TARGETS;
  if (!skill.aim) return [...ENEMY_TARGETS, ...ALLY_TARGETS];
  return skill.aim === 'ally' ? ALLY_TARGETS : ENEMY_TARGETS;
}

const inRange = (n: unknown, lo: number, hi: number) => typeof n === 'number' && Number.isInteger(n) && n >= lo && n <= hi;

function validCondition(c: RuleCondition): boolean {
  switch (c.kind) {
    case 'targetAfflictions':
      return inRange(c.atLeast, 1, 20);
    case 'targetStacks':
      return typeof c.status === 'string' && inRange(c.atLeast, 1, 20);
    case 'targetLacks':
    case 'targetHas':
    case 'selfLacks':
      return typeof c.status === 'string' && c.status.length > 0;
    case 'targetHpBelow':
    case 'selfHpBelow':
    case 'allyHpBelow':
      return inRange(c.percent, 1, 100);
    case 'enemiesAtLeast':
      return inRange(c.count, 1, 5);
    default:
      return false;
  }
}

/** Is this a list the unit may use: known skills, fitting targets, sane conditions, at most MAX_RULES? */
export function validRules(rules: readonly Rule[], skills: readonly AbilityDef[]): boolean {
  if (!Array.isArray(rules) || rules.length > MAX_RULES) return false;
  return rules.every((r) => {
    const skill = skills.find((s) => s.id === r.skill);
    if (r.skill !== BASIC_ATTACK && !skill) return false;
    if (r.target !== undefined && !targetsFor(skill).includes(r.target)) return false;
    return r.when === undefined || validCondition(r.when);
  });
}

/** After a class choice adds skills: the new tier's default rules go on top of a custom list. */
export function withNewTierRules(rules: readonly Rule[], added: readonly Rule[]): Rule[] {
  return [...added, ...rules].slice(0, MAX_RULES);
}

/** A skill's display name, looked up across every class tier. */
export function skillName(content: RunContent, id: string): string {
  if (id === BASIC_ATTACK) return 'Attack';
  for (const tier of [...Object.values(content.classes), ...Object.values(content.advancedClasses), ...Object.values(content.tertiaryClasses)]) {
    const s = tier.skills?.find((k) => k.id === id);
    if (s) return s.name;
  }
  return Object.values(content.talents).find((t) => t.grantAbility?.id === id)?.grantAbility?.name ?? id;
}

/** Display names of targets. */
export const TARGET_LABEL: Readonly<Partial<Record<TargetSelector, string>>> = {
  nearest: 'nearest enemy',
  mostAfflicted: 'most afflicted enemy',
  lowestHp: 'weakest enemy',
  highestAtk: 'strongest enemy',
  backlineFirst: 'back row',
  randomEnemy: 'random enemy',
  lowestHpAlly: 'most wounded ally',
  mostAfflictedAlly: 'most afflicted ally',
  self: 'self',
};

/** "if the target has 3+ afflictions" and the like. */
export function conditionText(c: RuleCondition, content: RunContent): string {
  const st = (id: string) => content.statuses?.[id]?.name ?? id;
  switch (c.kind) {
    case 'targetAfflictions':
      return `target has ${c.atLeast}+ afflictions`;
    case 'targetStacks':
      return `target has ${c.atLeast}+ ${st(c.status)}`;
    case 'targetLacks':
      return `target lacks ${st(c.status)}`;
    case 'targetHas':
      return `target has ${st(c.status)}`;
    case 'targetHpBelow':
      return `target below ${c.percent}% HP`;
    case 'selfHpBelow':
      return `self below ${c.percent}% HP`;
    case 'allyHpBelow':
      return `an ally below ${c.percent}% HP`;
    case 'enemiesAtLeast':
      return `${c.count}+ enemies standing`;
    case 'selfLacks':
      return `self lacks ${st(c.status)}`;
  }
}

/** One rule as text: "Spirit Lash → most afflicted enemy, if target has 4+ afflictions". */
export function ruleLabel(rule: Rule, content: RunContent): string {
  const target = rule.target ? ` → ${TARGET_LABEL[rule.target] ?? rule.target}` : '';
  return `${skillName(content, rule.skill)}${target}${rule.when ? `, if ${conditionText(rule.when, content)}` : ''}`;
}

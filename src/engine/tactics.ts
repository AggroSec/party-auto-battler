// Rules mode: a unit with skills acts by its priority list. Each turn it walks
// its rules top to bottom and uses the first one whose skill is ready and
// whose condition holds for the rule's target; with none, it basic-attacks.
import type { RulePass } from './events.ts';
import { living, opponent, type CombatState, type CombatUnit } from './state.ts';
import { afflictionCount, selectTargets } from './targeting.ts';
import { BASIC_ATTACK, type AbilityDef, type Rule, type RuleCondition, type TargetSelector } from './types.ts';

/** Most rules a unit's list can hold. */
export const MAX_RULES = 8;

/** Where a rule aims when it doesn't say: the nearest enemy, or the most wounded ally. */
export function defaultTarget(skill: AbilityDef | undefined): TargetSelector {
  return skill?.aim === 'ally' ? 'lowestHpAlly' : 'nearest';
}

/** True while a status keeps the unit from using abilities and skills. */
export function isSilenced(unit: CombatUnit): boolean {
  for (const s of unit.statuses.values()) if (s.def.silence) return true;
  return false;
}

/** The stun status that costs the unit this turn, if any. */
export function stunOf(unit: CombatUnit): string | undefined {
  for (const s of unit.statuses.values()) if (s.def.stun) return s.def.name;
  return undefined;
}

/** Does `when` hold for `unit` aiming at `target`? Target conditions fail without a target. */
export function conditionHolds(state: CombatState, unit: CombatUnit, when: RuleCondition | undefined, target: CombatUnit | undefined): boolean {
  if (!when) return true;
  const pct = (u: CombatUnit) => (u.hp / u.maxHp) * 100;
  switch (when.kind) {
    case 'targetAfflictions':
      return !!target && afflictionCount(target) >= when.atLeast;
    case 'targetLacks':
      return !!target && !target.statuses.has(when.status);
    case 'targetHas':
      return !!target && target.statuses.has(when.status);
    case 'targetStacks':
      return !!target && (target.statuses.get(when.status)?.stacks ?? 0) >= when.atLeast;
    case 'targetHpBelow':
      return !!target && pct(target) < when.percent;
    case 'selfHpBelow':
      return pct(unit) < when.percent;
    case 'allyHpBelow':
      return living(state, unit.side).some((u) => pct(u) < when.percent);
    case 'enemiesAtLeast':
      return living(state, opponent(unit.side)).length >= when.count;
    case 'selfLacks':
      return !unit.statuses.has(when.status);
  }
}

/**
 * What the unit does this turn: a ready skill and its focus, or a basic
 * attack at a target (or nothing). `rule` is the rule that fired (none for
 * the fallback attack); `passed` says why each rule above it didn't.
 */
export type RuleChoice = (
  | { kind: 'skill'; index: number; skill: AbilityDef; focus: CombatUnit | undefined }
  | { kind: 'attack'; target: CombatUnit | undefined }
) & { rule?: number; passed: RulePass[] };

/**
 * Pick this turn's action from the unit's rules. A silenced unit skips skill
 * rules. A rule for a skill on cooldown, a missing skill, or an aimed skill
 * with no target is passed over.
 */
export function chooseRule(state: CombatState, unit: CombatUnit): RuleChoice {
  const skills = unit.setup.skills ?? [];
  const silenced = isSilenced(unit);
  const passed: RulePass[] = [];
  for (const [i, rule] of (unit.setup.rules ?? []).entries()) {
    const choice = tryRule(state, unit, rule, skills, silenced);
    if (typeof choice !== 'string') return { ...choice, rule: i, passed };
    passed.push(choice);
  }
  return { kind: 'attack', target: selectTargets(state, unit, unit.setup.attackTarget)[0], passed };
}

type Pick = { kind: 'skill'; index: number; skill: AbilityDef; focus: CombatUnit | undefined } | { kind: 'attack'; target: CombatUnit | undefined };

/** The rule's action, or why it was passed over. */
function tryRule(state: CombatState, unit: CombatUnit, rule: Rule, skills: readonly AbilityDef[], silenced: boolean): Pick | RulePass {
  if (rule.skill === BASIC_ATTACK) {
    const [target] = selectTargets(state, unit, rule.target ?? unit.setup.attackTarget);
    return target && conditionHolds(state, unit, rule.when, target) ? { kind: 'attack', target } : 'unmet';
  }
  if (silenced) return 'silenced';
  const index = skills.findIndex((s) => s.id === rule.skill);
  const skill = skills[index];
  if (!skill) return 'unmet';
  if ((unit.cooldowns[index] ?? 0) > 0) return 'cooldown';
  const [focus] = selectTargets(state, unit, rule.target ?? defaultTarget(skill));
  if (skill.aim && !focus) return 'unmet';
  return conditionHolds(state, unit, rule.when, focus) ? { kind: 'skill', index, skill, focus: skill.aim ? focus : undefined } : 'unmet';
}

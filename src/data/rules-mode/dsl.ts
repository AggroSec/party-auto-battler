// Small constructors for rules-mode classes: skills, rules, and class tiers
// with their skill-augment talents generated from their skills.
import type { AdvancedClassDef, ClassTemplate, StatWeights, TalentDef, TertiaryClassDef, UnitModifier } from '../../engine/run/content-types.ts';
import type { AbilityDef, Effect, Range, Rule, RuleCondition, Stats, StatusDef, TargetSelector } from '../../engine/types.ts';

/** A skill. `aim` set = rules pick its target and its effects hit 'focus'. */
export function skill(
  id: string,
  name: string,
  cooldown: number,
  aim: AbilityDef['aim'] | null,
  description: string,
  effects: Effect[],
  empowered?: AbilityDef['empowered'],
): AbilityDef {
  return { id, name, description, cooldown, effects, ...(aim ? { aim } : {}), ...(empowered ? { empowered } : {}) };
}

export const hit = (atk: number, extra: Partial<Extract<Effect, { kind: 'damage' }>> = {}): Effect => ({ kind: 'damage', target: 'focus', amount: { atk }, ...extra });
export const afflict = (status: StatusDef, stacks = 1, target: TargetSelector = 'focus'): Effect => ({ kind: 'status', target, status, stacks });
export const selfStatus = (status: StatusDef): Effect => ({ kind: 'status', target: 'self', status, stacks: 1 });

export function rule(skillId: string, when?: RuleCondition, target?: TargetSelector): Rule {
  return { skill: skillId, ...(target ? { target } : {}), ...(when ? { when } : {}) };
}
export const lacks = (s: StatusDef): RuleCondition => ({ kind: 'targetLacks', status: s.id });
export const selfLacks = (s: StatusDef): RuleCondition => ({ kind: 'selfLacks', status: s.id });
export const afflictions = (atLeast: number): RuleCondition => ({ kind: 'targetAfflictions', atLeast });
export const selfBelow = (percent: number): RuleCondition => ({ kind: 'selfHpBelow', percent });
export const allyBelow = (percent: number): RuleCondition => ({ kind: 'allyHpBelow', percent });

/**
 * Skill augments: every skill offers an Empowered version (+35% power, or its
 * `empowered` upgrade when power has nothing to scale), and skills with a
 * cooldown of 3+ a Quickened one.
 */
export function augments(skills: readonly AbilityDef[]): TalentDef[] {
  return skills.flatMap((s) => [
    s.empowered
      ? { id: `aug:${s.id}:power`, name: `Empowered ${s.name}`, description: s.empowered.talent, skillUpgrade: [s.id] }
      : { id: `aug:${s.id}:power`, name: `Empowered ${s.name}`, description: `${s.name} has +35% power.`, skillPower: { [s.id]: 0.35 } },
    ...(s.cooldown >= 3 ? [{ id: `aug:${s.id}:haste`, name: `Quickened ${s.name}`, description: `${s.name}'s cooldown is 1 turn shorter.`, skillCooldown: { [s.id]: -1 } }] : []),
  ]);
}

interface TierInput {
  id: string;
  name: string;
  description: string;
  tags: readonly string[];
  skills: AbilityDef[];
  rules: Rule[];
  statWeights: StatWeights;
  modifier?: UnitModifier;
  passive?: { name: string; description: string };
}

export interface Built<T> {
  cls: T;
  talents: TalentDef[];
}

export function baseClass(
  input: TierInput & { baseStats: Stats; range: Range; placement: number; role: string; look: string; advancedClasses: string[] },
): Built<ClassTemplate> {
  const talents = augments(input.skills);
  // A base class's stats are its base stats; it has no modifier.
  const rest: Omit<typeof input, 'modifier'> = { ...input };
  delete (rest as Partial<typeof input>).modifier;
  return {
    cls: { ...rest, attackTarget: 'nearest', ability: input.skills[0]!, triggers: [], talents: talents.map((t) => t.id) },
    talents,
  };
}

export function advancedTier(input: TierInput & { baseClassId: string; tertiaryClasses: string[] }): Built<AdvancedClassDef> {
  const talents = augments(input.skills);
  return { cls: { ...input, ability: input.skills[0]!, modifier: input.modifier ?? {}, talents: talents.map((t) => t.id) }, talents };
}

export function tertiaryTier(input: TierInput & { baseClassId: string; advancedClassId: string }): Built<TertiaryClassDef> {
  const talents = augments(input.skills);
  return { cls: { ...input, ability: input.skills[0]!, modifier: input.modifier ?? {}, talents: talents.map((t) => t.id) }, talents };
}

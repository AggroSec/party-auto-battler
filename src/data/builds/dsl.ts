// Small constructors so build content reads like a design doc, not boilerplate.
import type { AdvancedClassDef, TalentDef, TertiaryClassDef, UnitModifier } from '../../engine/run/content-types.ts';
import type { AbilityDef, Effect, TriggerEvent, TriggeredEffect } from '../../engine/types.ts';

export function talent(id: string, name: string, description: string, mod: UnitModifier): TalentDef {
  return { id, name, description, ...mod };
}

export function on(
  event: TriggerEvent,
  label: string,
  effects: Effect[],
  opts: { chance?: number; limit?: number } = {},
): TriggeredEffect {
  return { label, on: event, effects, ...opts };
}

/** Shorthand for a one-trigger modifier. */
export function trig(...triggers: TriggeredEffect[]): UnitModifier {
  return { triggers };
}

export type AdvancedClassInput = Omit<AdvancedClassDef, 'talents'> & { talents: TalentDef[] };

/** Define an advanced class together with its talent pool. */
export function advanced(input: AdvancedClassInput): { cls: AdvancedClassDef; talents: TalentDef[] } {
  return { cls: { ...input, talents: input.talents.map((t) => t.id) }, talents: input.talents };
}

export type TertiaryClassInput = Omit<TertiaryClassDef, 'talents'> & { talents: TalentDef[] };

/** Define a tertiary class (level 7) together with its talent pool. */
export function tertiary(input: TertiaryClassInput): { cls: TertiaryClassDef; talents: TalentDef[] } {
  return { cls: { ...input, talents: input.talents.map((t) => t.id) }, talents: input.talents };
}

/** A talent that grants a second ability; its description is written from the ability's. */
export function abilityTalent(id: string, ability: AbilityDef, extra: UnitModifier = {}): TalentDef {
  return talent(id, ability.name, `New ability. ${ability.description}`, { ...extra, grantAbility: ability });
}

export const talentIds = (talents: readonly TalentDef[]) => talents.map((t) => t.id);

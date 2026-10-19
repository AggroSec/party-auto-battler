// Small constructors so build content reads like a design doc, not boilerplate.
import type { AdvancedClassDef, TalentDef, UnitModifier } from '../../engine/run/content-types.ts';
import type { Effect, TriggerEvent, TriggeredEffect } from '../../engine/types.ts';

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

export const talentIds = (talents: readonly TalentDef[]) => talents.map((t) => t.id);

// Resolve a unit's build (class + growth + advanced class + talents + items +
// synergies) into the UnitSetup the combat engine consumes.
import type { Party, Stats, TriggeredEffect, UnitSetup } from '../types.ts';
import type { ClassTemplate, SynergyDef, SynergyTier, UnitModifier } from './content-types.ts';
import type { Board, OwnedUnit, RunContent } from './types.ts';

export const ZERO_STATS: Stats = { hp: 0, atk: 0, def: 0, spd: 0 };

export function classFor(content: RunContent, classId: string): ClassTemplate {
  const c = content.classes[classId];
  if (!c) throw new Error(`Unknown class id: ${classId}`);
  return c;
}

/** The class id a unit fights as: its advanced class if it has one. */
export function effectiveClassId(unit: OwnedUnit): string {
  return unit.advancedClassId ?? unit.classId;
}

export function unitTags(unit: OwnedUnit, content: RunContent): readonly string[] {
  const adv = unit.advancedClassId ? content.advancedClasses[unit.advancedClassId] : undefined;
  return adv?.tags ?? classFor(content, unit.classId).tags;
}

/** Modifiers from the unit's own build: advanced class, talents and items. */
export function buildModifiers(unit: OwnedUnit, content: RunContent): UnitModifier[] {
  const mods: UnitModifier[] = [];
  const adv = unit.advancedClassId ? content.advancedClasses[unit.advancedClassId] : undefined;
  if (adv) mods.push(adv.modifier);
  for (const id of unit.talents) {
    const t = content.talents[id];
    if (t) mods.push(t);
  }
  for (const id of unit.items) {
    const item = content.items[id];
    if (!item) continue;
    mods.push(item.modifier);
    if (item.classBonus?.classIds.some((c) => c === unit.classId || c === unit.advancedClassId)) {
      mods.push(item.classBonus.modifier);
    }
  }
  return mods;
}

export interface ActiveSynergy {
  synergy: SynergyDef;
  /** Index into synergy.tiers. */
  tier: number;
}

function meets(tier: SynergyTier, units: OwnedUnit[], content: RunContent): boolean {
  return tier.requires.every((req) => {
    if (req.kind === 'distinctClasses') return new Set(units.map((u) => u.classId)).size >= req.count;
    return units.filter((u) => unitTags(u, content).includes(req.tag)).length >= req.count;
  });
}

/** The highest satisfied tier of each synergy. */
export function activeSynergies(units: OwnedUnit[], content: RunContent): ActiveSynergy[] {
  const active: ActiveSynergy[] = [];
  for (const synergy of content.synergies) {
    for (let i = synergy.tiers.length - 1; i >= 0; i--) {
      if (meets(synergy.tiers[i]!, units, content)) {
        active.push({ synergy, tier: i });
        break;
      }
    }
  }
  return active;
}

export function synergyModifiersFor(unit: OwnedUnit, active: ActiveSynergy[], content: RunContent): UnitModifier[] {
  return active.flatMap(({ synergy, tier }) => {
    const t = synergy.tiers[tier]!;
    const applies = t.appliesTo === 'all' || unitTags(unit, content).includes(t.appliesTo.tag);
    return applies ? [t.modifier] : [];
  });
}

/** Resolve one unit, given any extra modifiers (synergies). */
export function resolveUnit(unit: OwnedUnit, content: RunContent, extra: UnitModifier[] = []): UnitSetup {
  const base = classFor(content, unit.classId);
  const adv = unit.advancedClassId ? content.advancedClasses[unit.advancedClassId] : undefined;
  const mods = [...buildModifiers(unit, content), ...extra];

  const stat = (k: keyof Stats) =>
    Math.max(k === 'hp' || k === 'spd' ? 1 : 0, base.baseStats[k] + unit.growth[k] + mods.reduce((s, m) => s + (m.stats?.[k] ?? 0), 0));
  const triggers: TriggeredEffect[] = [...base.triggers, ...mods.flatMap((m) => m.triggers ?? [])];
  const ability = adv?.ability ?? base.ability;
  const cdDelta = mods.reduce((s, m) => s + (m.abilityCooldown ?? 0), 0);
  const lifesteal = mods.reduce((s, m) => s + (m.lifesteal ?? 0), 0);
  const abilityPower = 1 + mods.reduce((s, m) => s + (m.abilityPower ?? 0), 0);

  const setup: UnitSetup = {
    name: unit.name,
    classId: effectiveClassId(unit),
    stats: { hp: stat('hp'), atk: stat('atk'), def: stat('def'), spd: stat('spd') },
    range: base.range,
    attackTarget: adv?.attackTarget ?? base.attackTarget,
    ability:
      cdDelta === 0
        ? ability
        : {
            ...ability,
            cooldown: Math.max(1, ability.cooldown + cdDelta),
            ...(ability.initialCooldown !== undefined
              ? { initialCooldown: Math.max(1, ability.initialCooldown + cdDelta) }
              : {}),
          },
    triggers,
  };
  if (mods.some((m) => m.reach)) setup.reach = true;
  if (lifesteal > 0) setup.lifesteal = lifesteal;
  if (abilityPower !== 1) setup.abilityPower = Math.max(0, abilityPower);
  return setup;
}

export function boardUnits(board: Board): OwnedUnit[] {
  return [...board.front, ...board.back].filter((u): u is OwnedUnit => u !== null);
}

/** Resolve a whole board into a combat Party, applying its synergies. */
export function resolveBoard(board: Board, content: RunContent): Party {
  const active = activeSynergies(boardUnits(board), content);
  const resolve = (u: OwnedUnit | null) => (u ? resolveUnit(u, content, synergyModifiersFor(u, active, content)) : null);
  return { front: board.front.map(resolve), back: board.back.map(resolve) };
}

/** A fresh level-1 unit. */
export function newUnit(uid: number, classId: string, name: string): OwnedUnit {
  return { uid, classId, name, level: 1, xp: 0, advancedClassId: null, talents: [], items: [], growth: { ...ZERO_STATS } };
}

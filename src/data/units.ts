import type { Party, Stats, UnitSetup } from '../engine/types.ts';
import { CLASSES, type ClassId } from './classes.ts';

/**
 * Build an engine-ready UnitSetup from class data. M2/M3 extend this with
 * level, talents and items; the engine only ever sees the resolved setup.
 */
export function createUnit(
  classId: ClassId,
  opts: { name?: string; statBonus?: Partial<Stats> } = {},
): UnitSetup {
  const def = CLASSES[classId];
  const bonus = opts.statBonus ?? {};
  return {
    name: opts.name ?? def.name,
    classId,
    stats: {
      hp: def.baseStats.hp + (bonus.hp ?? 0),
      atk: def.baseStats.atk + (bonus.atk ?? 0),
      def: def.baseStats.def + (bonus.def ?? 0),
      spd: def.baseStats.spd + (bonus.spd ?? 0),
    },
    attackTarget: def.attackTarget,
    ability: def.ability,
    triggers: def.triggers,
  };
}

/** Shorthand for building a party from class ids. `null` leaves a slot empty. */
export function partyOf(
  front: readonly (ClassId | null)[],
  back: readonly (ClassId | null)[] = [],
): Party {
  const make = (id: ClassId | null) => (id ? createUnit(id) : null);
  return { front: front.map(make), back: back.map(make) };
}

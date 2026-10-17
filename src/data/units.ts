import { instantiate } from '../engine/run/board.ts';
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
  return instantiate(CLASSES[classId], opts);
}

/** Shorthand for building a party from class ids. `null` leaves a slot empty. */
export function partyOf(
  front: readonly (ClassId | null)[],
  back: readonly (ClassId | null)[] = [],
): Party {
  const make = (id: ClassId | null) => (id ? createUnit(id) : null);
  return { front: front.map(make), back: back.map(make) };
}

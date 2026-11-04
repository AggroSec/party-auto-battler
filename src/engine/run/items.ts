// Who can carry what (M7 signature items; Mercenary weapon slots).
import { classTiers } from './build.ts';
import type { ItemRules } from './content-types.ts';
import type { OwnedUnit, RunContent, RunContext, RunError } from './types.ts';

/** The unit's item rules: its tertiary or advanced class's, else `slots` plain slots. */
export function itemRules(unit: OwnedUnit, content: RunContent, slots: number): ItemRules {
  const { adv, tert } = classTiers(unit, content);
  return tert?.items ?? adv?.items ?? { slots };
}

/** How many weapons the unit carries. */
export function weaponCount(unit: OwnedUnit, content: RunContent): number {
  return unit.items.filter((id) => content.items[id]?.weapon).length;
}

/**
 * Why `unit` can't take `itemId`, or null: signature items belong to one
 * tertiary class (one per unit), slots can be full, and some classes carry
 * only weapons in some of them.
 */
export function equipError(unit: OwnedUnit, itemId: string, ctx: RunContext): RunError | null {
  const item = ctx.content.items[itemId];
  if (item?.tertiaryClassId) {
    if (unit.tertiaryClassId !== item.tertiaryClassId) return 'wrongClass';
    if (unit.items.includes(itemId)) return 'alreadyEquipped';
  }
  const rules = itemRules(unit, ctx.content, ctx.config.progression.maxItemsPerUnit);
  if (unit.items.length >= rules.slots) return 'itemSlotsFull';
  if (!item?.weapon && rules.maxNonWeapons !== undefined && unit.items.length - weaponCount(unit, ctx.content) >= rules.maxNonWeapons) {
    return 'weaponsOnly';
  }
  return null;
}

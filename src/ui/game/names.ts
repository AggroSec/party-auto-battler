import { spentPoints, STATS, type OwnedUnit, type RunContent, type RunContext, type ShopOffer } from '../../engine/run/index.ts';

/** Display name for a base, advanced or tertiary class id (summons show as "Summon"). */
export function className(content: RunContent, id: string): string {
  return content.classes[id]?.name ?? content.advancedClasses[id]?.name ?? content.tertiaryClasses[id]?.name ?? 'Summon';
}

export function offerLabel(content: RunContent, offer: ShopOffer): { title: string; detail: string } {
  switch (offer.kind) {
    case 'unit':
      return { title: `${offer.name} the ${className(content, offer.classId)}`, detail: content.classes[offer.classId]?.ability.name ?? '' };
    case 'item': {
      const item = content.items[offer.itemId];
      if (!item) return { title: offer.itemId, detail: '' };
      return { title: item.name, detail: [item.description, item.classBonus?.description].filter(Boolean).join(' ') };
    }
    case 'training':
      return { title: `${className(content, offer.classId)} Training`, detail: `+${offer.xp} XP to one ${className(content, offer.classId)}.` };
  }
}

/** "HP 4 · ATK 6 · SPD 3": points spent so far, for the inspector. */
export function spentSummary(unit: OwnedUnit, ctx: RunContext): string {
  const spent = spentPoints(unit, ctx.config.progression);
  return STATS.filter((k) => spent[k] > 0)
    .map((k) => `${k.toUpperCase()} ${spent[k]}`)
    .join(' · ');
}

import type { RunContent, ShopOffer } from '../../engine/run/index.ts';

/** Display name for a base or advanced class id. */
export function className(content: RunContent, id: string): string {
  return content.classes[id]?.name ?? content.advancedClasses[id]?.name ?? id;
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

import type { MetaCatalog } from '../../engine/meta/types.ts';
import { CLASS_IDS, STARTER_CLASS_IDS } from '../classes.ts';
import { ITEM_IDS } from '../items.ts';
import { SYNERGIES } from '../synergies.ts';
import { ACHIEVEMENTS } from './achievements.ts';
import { LADDER } from './ladder.ts';
import { PERK_IDS } from './perks.ts';

/** Items a new player starts with: plain and effect items, and the starter classes' class items. */
const STARTER_ITEMS = [
  'iron-sword',
  'chainmail',
  'swift-boots',
  'giants-belt',
  'featherweight-charm',
  'adrenaline-vial',
  'thorned-mail',
  'healing-charm',
  'long-spear',
  'tower-shield',
  'smoke-cloak',
  'spellbook',
  'holy-symbol',
  'hunting-bow',
  'rage-gauntlets',
  'assassins-dagger',
  'time-shard',
];

/** Synergies locked behind achievements; every other synergy is available from the start. */
const LOCKED_SYNERGIES = ['light', 'dark', 'twilight', 'rivals', 'sacred-and-profane'];

/**
 * Brandon (M7): new players start with the original five classes and a
 * smaller item pool; achievements unlock the rest. Signature items need no
 * unlock (they come with reaching their tertiary class).
 */
export const META_CATALOG: MetaCatalog = {
  starter: {
    classes: STARTER_CLASS_IDS,
    items: STARTER_ITEMS,
    synergies: SYNERGIES.map((s) => s.id).filter((id) => !LOCKED_SYNERGIES.includes(id)),
    perks: ['deep-pockets', 'armory', 'bargain-hunter'],
    perkSlots: 1,
    favoredSlots: 1,
  },
  achievements: ACHIEVEMENTS,
  all: { classes: CLASS_IDS, items: ITEM_IDS, synergies: SYNERGIES.map((s) => s.id), perks: PERK_IDS },
  maxTier: LADDER.length,
  maxPerkSlots: 3,
  maxFavoredSlots: 2,
  perkChoiceExtra: 2,
};

import type { ItemDef } from '../engine/run/content-types.ts';
import { on } from './builds/dsl.ts';
import { SIGNATURE_ITEMS } from './signature-items/index.ts';

const WARRIORS = ['warrior', 'knight', 'berserker'];
const ROGUES = ['rogue', 'assassin', 'duelist'];
const MAGES = ['mage', 'pyromancer', 'chronomancer'];
const CLERICS = ['cleric', 'priest', 'inquisitor'];
const RANGERS = ['ranger', 'sharpshooter', 'beastmaster'];
const NECROS = ['necromancer', 'lich', 'plaguelord'];
const MONKS = ['monk', 'windwalker', 'iron-fist'];
const BARDS = ['bard', 'skald', 'trickster'];
const DRUIDS = ['druid', 'shapeshifter', 'grove-warden'];
const WARLOCKS = ['warlock', 'hexer', 'demonologist'];
const ENGINEERS = ['engineer', 'machinist', 'demolitionist'];

/**
 * Up to 2 per unit. Anyone can equip anything; class-tied items give their
 * tied classes an extra effect, which is where build-defining combos live.
 */
const ITEM_LIST: ItemDef[] = [
  // Plain stat items.
  { id: 'iron-sword', name: 'Iron Sword', description: '+3 ATK.', cost: 3, modifier: { stats: { atk: 3 } } },
  { id: 'chainmail', name: 'Chainmail', description: '+2 DEF, +4 HP.', cost: 3, modifier: { stats: { def: 2, hp: 4 } } },
  { id: 'swift-boots', name: 'Swift Boots', description: '+2 SPD.', cost: 3, modifier: { stats: { spd: 2 } } },
  { id: 'giants-belt', name: "Giant's Belt", description: '+12 HP.', cost: 3, modifier: { stats: { hp: 12 } } },

  // Speed items (issue #9: give SPD builds more room before touching class SPD).
  {
    id: 'quicksilver-rapier',
    name: 'Quicksilver Rapier',
    description: '+2 ATK, +2 SPD.',
    cost: 5,
    modifier: { stats: { atk: 2, spd: 2 } },
  },
  { id: 'featherweight-charm', name: 'Featherweight Charm', description: '+4 SPD, −6 HP.', cost: 3, modifier: { stats: { spd: 4, hp: -6 } } },
  {
    id: 'winged-sandals',
    name: 'Winged Sandals',
    description: 'Start of combat: all allies +1 SPD.',
    cost: 5,
    modifier: { triggers: [on('startOfCombat', 'Winged Sandals', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }])] },
  },
  {
    id: 'adrenaline-vial',
    name: 'Adrenaline Vial',
    description: 'When bloodied, gain +5 SPD.',
    cost: 3,
    modifier: { triggers: [on('onBloodied', 'Adrenaline', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 5 } }])] },
  },

  // Effect items.
  { id: 'vampiric-fang', name: 'Vampiric Fang', description: '+20% lifesteal.', cost: 4, modifier: { lifesteal: 0.2 } },
  {
    id: 'thorned-mail',
    name: 'Thorned Mail',
    description: 'When hurt, deal 2 piercing damage to the attacker.',
    cost: 4,
    modifier: { triggers: [on('onHurt', 'Thorns', [{ kind: 'damage', target: 'triggerSource', amount: { flat: 2 }, pierce: true }])] },
  },
  { id: 'hourglass', name: 'Hourglass', description: 'Ability cooldown −1.', cost: 5, modifier: { abilityCooldown: -1 } },
  {
    id: 'healing-charm',
    name: 'Healing Charm',
    description: 'The first time you drop below 50% HP, heal 25% of max HP.',
    cost: 3,
    modifier: { triggers: [on('onBloodied', 'Healing Charm', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.25 } }])] },
  },

  // Class-tied items.
  {
    id: 'long-spear',
    name: 'Long Spear',
    description: 'Fight at full strength from the back row. +1 ATK.',
    cost: 3,
    modifier: { reach: true, stats: { atk: 1 } },
    classBonus: { classIds: WARRIORS, description: 'Warriors: +2 more ATK.', modifier: { stats: { atk: 2 } } },
  },
  {
    id: 'tower-shield',
    name: 'Tower Shield',
    description: 'Start of combat: shield yourself for 8.',
    cost: 4,
    modifier: { triggers: [on('startOfCombat', 'Tower Shield', [{ kind: 'shield', target: 'self', amount: { flat: 8 } }])] },
    classBonus: {
      classIds: WARRIORS,
      description: 'Warriors: also shield all allies for 3.',
      modifier: { triggers: [on('startOfCombat', 'Shield Wall', [{ kind: 'shield', target: 'allAllies', amount: { flat: 3 } }])] },
    },
  },
  {
    id: 'smoke-cloak',
    name: 'Smoke Cloak',
    description: '+2 SPD.',
    cost: 3,
    modifier: { stats: { spd: 2 } },
    classBonus: { classIds: ROGUES, description: 'Rogues: fight at full strength from the back row.', modifier: { reach: true } },
  },
  {
    id: 'spellbook',
    name: 'Spellbook',
    description: '+25% ability power.',
    cost: 4,
    modifier: { abilityPower: 0.25 },
    classBonus: { classIds: MAGES, description: 'Mages: +25% more.', modifier: { abilityPower: 0.25 } },
  },
  {
    id: 'holy-symbol',
    name: 'Holy Symbol',
    description: '+20% ability power.',
    cost: 4,
    modifier: { abilityPower: 0.2 },
    classBonus: {
      classIds: [...CLERICS, 'knight'],
      description: 'Clerics and Knights: start of combat, shield all allies for 3.',
      modifier: { triggers: [on('startOfCombat', 'Blessed Symbol', [{ kind: 'shield', target: 'allAllies', amount: { flat: 3 } }])] },
    },
  },
  {
    id: 'hunting-bow',
    name: 'Hunting Bow',
    description: '25% on attack: strike again for 50% ATK.',
    cost: 4,
    modifier: {
      triggers: [on('onAttack', 'Hunting Bow', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.5 } }], { chance: 0.25 })],
    },
    classBonus: { classIds: RANGERS, description: 'Rangers: +2 ATK.', modifier: { stats: { atk: 2 } } },
  },
  {
    id: 'skull-totem',
    name: 'Skull Totem',
    description: 'When an ally falls, gain +2 ATK.',
    cost: 4,
    modifier: { triggers: [on('onAllyDeath', 'Skull Totem', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }])] },
    classBonus: {
      classIds: NECROS,
      description: 'Necromancers: also heal 200% ATK when an ally falls.',
      modifier: { triggers: [on('onAllyDeath', 'Grave Feast', [{ kind: 'heal', target: 'self', amount: { atk: 2 } }])] },
    },
  },
  {
    id: 'rage-gauntlets',
    name: 'Rage Gauntlets',
    description: 'When bloodied, gain +4 ATK.',
    cost: 4,
    modifier: { triggers: [on('onBloodied', 'Rage Gauntlets', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } }])] },
    classBonus: { classIds: ['berserker'], description: 'Berserkers: +15% lifesteal.', modifier: { lifesteal: 0.15 } },
  },
  {
    id: 'assassins-dagger',
    name: "Assassin's Dagger",
    description: 'On kill, your next ability comes a turn sooner.',
    cost: 4,
    modifier: { triggers: [on('onKill', "Assassin's Dagger", [{ kind: 'cooldown', target: 'self', turns: -1 }])] },
    classBonus: { classIds: ROGUES, description: 'Rogues: +30% ability power.', modifier: { abilityPower: 0.3 } },
  },
  {
    id: 'time-shard',
    name: 'Time Shard',
    description: 'Start of combat: shield yourself for 150% ATK.',
    cost: 4,
    modifier: { triggers: [on('startOfCombat', 'Time Shard', [{ kind: 'shield', target: 'self', amount: { atk: 1.5 } }])] },
    classBonus: {
      classIds: MAGES,
      description: "Mages: start of combat, every enemy's ability comes a turn later.",
      modifier: { triggers: [on('startOfCombat', 'Stasis', [{ kind: 'cooldown', target: 'allEnemies', turns: 1 }])] },
    },
  },
  {
    id: 'prayer-beads',
    name: 'Prayer Beads',
    description: '+2 SPD.',
    cost: 3,
    modifier: { stats: { spd: 2 } },
    classBonus: {
      classIds: MONKS,
      description: 'Monks: each basic attack grants +1 SPD (max 4).',
      modifier: { triggers: [on('onAttack', 'Prayer Beads', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } }], { limit: 4 })] },
    },
  },
  {
    id: 'enchanted-lute',
    name: 'Enchanted Lute',
    description: '+20% ability power.',
    cost: 4,
    modifier: { abilityPower: 0.2 },
    classBonus: {
      classIds: BARDS,
      description: 'Bards: start of combat, all allies +1 ATK.',
      modifier: { triggers: [on('startOfCombat', 'Opening Chord', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }])] },
    },
  },
  {
    id: 'oak-heart',
    name: 'Oak Heart',
    description: '+10 HP.',
    cost: 3,
    modifier: { stats: { hp: 10 } },
    classBonus: {
      classIds: DRUIDS,
      description: 'Druids: 25% when hurt, shield yourself for 4.',
      modifier: { triggers: [on('onHurt', 'Oak Heart', [{ kind: 'shield', target: 'self', amount: { flat: 4 } }], { chance: 0.25 })] },
    },
  },
  {
    id: 'cursed-tome',
    name: 'Cursed Tome',
    description: '+3 ATK, −4 HP.',
    cost: 3,
    modifier: { stats: { atk: 3, hp: -4 } },
    classBonus: { classIds: WARLOCKS, description: 'Warlocks: +15% lifesteal.', modifier: { lifesteal: 0.15 } },
  },
  {
    id: 'gearbox',
    name: 'Gearbox',
    description: '+2 DEF, +1 SPD.',
    cost: 3,
    modifier: { stats: { def: 2, spd: 1 } },
    classBonus: { classIds: ENGINEERS, description: 'Engineers: +40% ability power (stronger turrets).', modifier: { abilityPower: 0.4 } },
  },

  // Unlockable items (M7).
  {
    id: 'phoenix-feather',
    name: 'Phoenix Feather',
    description: 'The first time you would fall, survive at 30% HP.',
    cost: 6,
    modifier: { revive: 0.3 },
  },
  {
    id: 'war-banner',
    name: 'War Banner',
    description: 'Start of combat: you and the allies in your row gain +2 ATK.',
    cost: 5,
    modifier: { triggers: [on('startOfCombat', 'War Banner', [{ kind: 'buff', target: 'rowAllies', stat: 'atk', amount: { flat: 2 } }])] },
  },
  {
    id: 'gamblers-coin',
    name: "Gambler's Coin",
    description: '+1 gold after every won fight.',
    cost: 4,
    modifier: {},
    goldPerWin: 1,
  },
  {
    id: 'executioners-axe',
    name: "Executioner's Axe",
    description: '+2 ATK. Deal 50% more damage to enemies below half HP.',
    cost: 5,
    modifier: { stats: { atk: 2 }, executeBonus: 0.5 },
  },
  {
    id: 'mirror-shard',
    name: 'Mirror Shard',
    description: 'When hurt, deal 60% ATK back to the attacker (up to 4 times per fight).',
    cost: 5,
    modifier: { triggers: [on('onHurt', 'Mirror Shard', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.6 } }], { limit: 4 })] },
  },
  {
    id: 'soulstone',
    name: 'Soulstone',
    description: 'When an ally falls, your next ability comes 1 turn sooner and you shield yourself for 100% ATK.',
    cost: 4,
    modifier: {
      triggers: [
        on('onAllyDeath', 'Soulstone', [
          { kind: 'cooldown', target: 'self', turns: -1 },
          { kind: 'shield', target: 'self', amount: { atk: 1 } },
        ]),
      ],
    },
  },
];

/** Every item, including the tertiary classes' signature items (M7). */
export const ITEMS: Record<string, ItemDef> = Object.fromEntries([...ITEM_LIST, ...SIGNATURE_ITEMS].map((i) => [i.id, i]));
/** Items the shop and enemies roll (signature items are offered separately). */
export const ITEM_IDS = ITEM_LIST.map((i) => i.id);

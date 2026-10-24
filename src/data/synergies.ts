import type { SynergyDef, UnitFilter } from '../engine/run/content-types.ts';
import { on } from './builds/dsl.ts';

/** Light and Dark units (M7): divine units are Light; shadow and occult units are Dark. */
export const LIGHT: UnitFilter = { tags: ['divine'] };
export const DARK: UnitFilter = { tags: ['shadow', 'occult'] };

/**
 * Party synergies from class tags. Base tags:
 *   Warrior martial+guardian, Rogue martial+shadow, Mage arcane,
 *   Cleric divine, Ranger martial+wild, Necromancer arcane+shadow,
 *   Monk martial+spirit, Bard arcane+spirit, Druid wild+nature,
 *   Warlock shadow+occult, Engineer tech.
 * Advanced classes replace their tags (e.g. Knight adds divine), so
 * advancing can open or close synergies.
 */
export const SYNERGIES: SynergyDef[] = [
  {
    id: 'martial',
    name: 'Martial Discipline',
    tiers: [
      { requires: [{ kind: 'tag', tag: 'martial', count: 2 }], description: 'Martial units +2 ATK.', modifier: { stats: { atk: 2 } }, appliesTo: { tag: 'martial' } },
      { requires: [{ kind: 'tag', tag: 'martial', count: 4 }], description: 'Martial units +2 ATK and +4 HP.', modifier: { stats: { atk: 2, hp: 4 } }, appliesTo: { tag: 'martial' } },
    ],
  },
  {
    id: 'arcane',
    name: 'Arcane Circle',
    tiers: [
      { requires: [{ kind: 'tag', tag: 'arcane', count: 2 }], description: 'Arcane units +30% ability power and +8 HP.', modifier: { abilityPower: 0.3, stats: { hp: 8 } }, appliesTo: { tag: 'arcane' } },
      { requires: [{ kind: 'tag', tag: 'arcane', count: 3 }], description: 'Arcane units +40% ability power and +10 HP.', modifier: { abilityPower: 0.4, stats: { hp: 10 } }, appliesTo: { tag: 'arcane' } },
    ],
  },
  {
    id: 'guardian',
    name: 'Shield Wall',
    tiers: [
      {
        requires: [{ kind: 'tag', tag: 'guardian', count: 2 }],
        description: 'Start of combat: every ally shields itself for 3.',
        modifier: { triggers: [on('startOfCombat', 'Shield Wall', [{ kind: 'shield', target: 'self', amount: { flat: 3 } }])] },
        appliesTo: 'all',
      },
      {
        requires: [{ kind: 'tag', tag: 'guardian', count: 3 }],
        description: 'Start of combat: every ally shields itself for 7.',
        modifier: { triggers: [on('startOfCombat', 'Shield Wall', [{ kind: 'shield', target: 'self', amount: { flat: 7 } }])] },
        appliesTo: 'all',
      },
    ],
  },
  {
    id: 'divine',
    name: 'Divine Choir',
    tiers: [
      {
        requires: [{ kind: 'tag', tag: 'divine', count: 2 }],
        description: 'Every ally heals 2 HP at the start of each of its turns.',
        modifier: { triggers: [on('onTurnStart', 'Divine Choir', [{ kind: 'heal', target: 'self', amount: { flat: 2 } }])] },
        appliesTo: 'all',
      },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow Pact',
    tiers: [
      { requires: [{ kind: 'tag', tag: 'shadow', count: 2 }], description: 'Shadow units +10% lifesteal and +1 SPD.', modifier: { lifesteal: 0.1, stats: { spd: 1 } }, appliesTo: { tag: 'shadow' } },
    ],
  },
  {
    id: 'wild',
    name: 'Call of the Wild',
    tiers: [
      { requires: [{ kind: 'tag', tag: 'wild', count: 2 }], description: 'Wild units +2 SPD.', modifier: { stats: { spd: 2 } }, appliesTo: { tag: 'wild' } },
    ],
  },
  {
    id: 'spirit',
    name: 'Inner Harmony',
    tiers: [
      { requires: [{ kind: 'tag', tag: 'spirit', count: 2 }], description: 'Spirit units +2 SPD.', modifier: { stats: { spd: 2 } }, appliesTo: { tag: 'spirit' } },
      { requires: [{ kind: 'tag', tag: 'spirit', count: 3 }], description: 'Spirit units +2 SPD and +6 HP.', modifier: { stats: { spd: 2, hp: 6 } }, appliesTo: { tag: 'spirit' } },
    ],
  },
  {
    id: 'nature',
    name: "Nature's Bond",
    tiers: [
      {
        requires: [{ kind: 'tag', tag: 'nature', count: 2 }],
        description: 'Every ally +8 HP and +1 DEF.',
        modifier: { stats: { hp: 8, def: 1 } },
        appliesTo: 'all',
      },
    ],
  },
  {
    id: 'occult',
    name: 'Dark Covenant',
    tiers: [
      {
        requires: [{ kind: 'tag', tag: 'occult', count: 2 }],
        description: 'Occult units +4 ATK and −6 HP.',
        modifier: { stats: { atk: 4, hp: -6 } },
        appliesTo: { tag: 'occult' },
      },
    ],
  },
  {
    id: 'tech',
    name: 'Workshop',
    tiers: [
      {
        requires: [{ kind: 'tag', tag: 'tech', count: 2 }],
        description: 'Tech units +40% ability power (stronger turrets and bombs) and +2 DEF.',
        modifier: { abilityPower: 0.4, stats: { def: 2 } },
        appliesTo: { tag: 'tech' },
      },
    ],
  },
  {
    // The brief's "frontline + healer" combo.
    id: 'vanguard',
    name: 'Vanguard',
    tiers: [
      {
        requires: [
          { kind: 'tag', tag: 'guardian', count: 1 },
          { kind: 'tag', tag: 'divine', count: 1 },
        ],
        description: 'With a guardian and a divine healer: guardians +3 DEF.',
        modifier: { stats: { def: 3 } },
        appliesTo: { tag: 'guardian' },
      },
    ],
  },
  {
    id: 'party',
    name: 'Adventuring Party',
    tiers: [
      { requires: [{ kind: 'distinctClasses', count: 4 }], description: '4 different classes: every ally +3 HP.', modifier: { stats: { hp: 3 } }, appliesTo: 'all' },
      { requires: [{ kind: 'distinctClasses', count: 5 }], description: '5 different classes: every ally +4 HP.', modifier: { stats: { hp: 4 } }, appliesTo: 'all' },
    ],
  },

  // M7: role, alignment and class-pair synergies that don't need duplicate classes.
  {
    id: 'holy-trinity',
    name: 'Holy Trinity',
    tiers: [
      {
        requires: [{ kind: 'party', slots: [{ tags: ['guardian'] }, { roles: ['support'] }, { roles: ['striker', 'caster'] }], label: 'guardian, healer and damage dealer' }],
        description: 'A guardian, a support and a striker or caster: every ally +3 HP.',
        modifier: { stats: { hp: 3 } },
        appliesTo: 'all',
      },
    ],
  },
  {
    id: 'light',
    name: 'Champions of Light',
    tiers: [
      {
        requires: [{ kind: 'units', filter: LIGHT, count: 3, label: 'Light units' }],
        description: '3 Light units: Light units +6 HP.',
        modifier: { stats: { hp: 6 } },
        appliesTo: { filter: LIGHT },
      },
      {
        requires: [{ kind: 'units', filter: LIGHT, count: 4, label: 'Light units' }],
        description: '4 Light units: every ally +6 HP.',
        modifier: { stats: { hp: 6 } },
        appliesTo: 'all',
      },
    ],
  },
  {
    id: 'dark',
    name: 'Legion of Night',
    tiers: [
      {
        requires: [{ kind: 'units', filter: DARK, count: 3, label: 'Dark units' }],
        description: '3 Dark units: Dark units +1 ATK.',
        modifier: { stats: { atk: 1 } },
        appliesTo: { filter: DARK },
      },
      {
        requires: [{ kind: 'units', filter: DARK, count: 4, label: 'Dark units' }],
        description: '4 Dark units: Dark units +2 ATK, and +1 ATK on every kill.',
        modifier: { stats: { atk: 2 }, triggers: [on('onKill', 'Legion of Night', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 1 } }])] },
        appliesTo: { filter: DARK },
      },
    ],
  },
  {
    id: 'twilight',
    name: 'Twilight Pact',
    tiers: [
      {
        requires: [
          { kind: 'units', filter: LIGHT, count: 2, label: 'Light units' },
          { kind: 'units', filter: DARK, count: 2, label: 'Dark units' },
        ],
        description: '2 Light and 2 Dark units: every ally heals 2 at the start of each of its turns.',
        modifier: { triggers: [on('onTurnStart', 'Twilight Pact', [{ kind: 'heal', target: 'self', amount: { flat: 2 } }])] },
        appliesTo: 'all',
      },
    ],
  },
  {
    id: 'life-and-death',
    name: 'Life and Death',
    tiers: [
      {
        requires: [{ kind: 'party', slots: [{ classIds: ['necromancer'] }, { classIds: ['cleric'] }], label: 'Necromancer and Cleric' }],
        description: 'Necromancer + Cleric: whenever either gets a kill or an ally dies, it heals the most wounded ally for 60% ATK.',
        modifier: {
          triggers: [
            on('onKill', 'Life and Death', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.6 } }]),
            on('onAllyDeath', 'Life and Death', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.6 } }]),
          ],
        },
        appliesTo: { filter: { classIds: ['necromancer', 'cleric'] } },
      },
    ],
  },
  {
    id: 'mad-science',
    name: 'Mad Science',
    tiers: [
      {
        requires: [{ kind: 'party', slots: [{ classIds: ['engineer'] }, { classIds: ['mage'] }], label: 'Engineer and Mage' }],
        description: 'Engineer + Mage: tech and arcane units +25% ability power (bigger summons too).',
        modifier: { abilityPower: 0.25 },
        appliesTo: { filter: { tags: ['tech', 'arcane'] } },
      },
    ],
  },
  {
    id: 'wild-hunt',
    name: 'Wild Hunt',
    tiers: [
      {
        requires: [{ kind: 'party', slots: [{ classIds: ['ranger'] }, { classIds: ['druid'] }], label: 'Ranger and Druid' }],
        description: 'Ranger + Druid: wild and nature units +2 ATK and +1 SPD.',
        modifier: { stats: { atk: 2, spd: 1 } },
        appliesTo: { filter: { tags: ['wild', 'nature'] } },
      },
    ],
  },
  {
    id: 'battle-hymn',
    name: 'Battle Hymn',
    tiers: [
      {
        requires: [{ kind: 'party', slots: [{ classIds: ['bard'] }, { classIds: ['warrior'] }], label: 'Bard and Warrior' }],
        description: 'Bard + Warrior: each time the Bard casts, the front row gains +1 ATK (up to 2 times per fight).',
        modifier: { triggers: [on('onAbility', 'Battle Hymn', [{ kind: 'buff', target: 'allyFrontRow', stat: 'atk', amount: { flat: 1 } }], { limit: 2 })] },
        appliesTo: { filter: { classIds: ['bard'] } },
      },
    ],
  },
  {
    // Brandon (post-M7): hero and villain, grudgingly side by side.
    id: 'rivals',
    name: 'Rivals',
    tiers: [
      {
        requires: [{ kind: 'party', slots: [{ classIds: ['warrior'] }, { classIds: ['dark-knight'] }], label: 'Warrior and Dark Knight' }],
        description: 'Warrior + Dark Knight: both start with +2 ATK and +1 DEF, and gain +2 ATK whenever an ally falls (up to 2 times per fight).',
        modifier: {
          stats: { atk: 2, def: 1 },
          triggers: [on('onAllyDeath', 'Rivals', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }], { limit: 2 })],
        },
        appliesTo: { filter: { classIds: ['warrior', 'dark-knight'] } },
      },
    ],
  },
];

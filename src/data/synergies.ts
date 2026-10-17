import type { SynergyDef } from '../engine/run/content-types.ts';
import { on } from './builds/dsl.ts';

/**
 * Party synergies from class tags. Base tags:
 *   Warrior martial+guardian, Rogue martial+shadow, Mage arcane,
 *   Cleric divine, Ranger martial+wild, Necromancer arcane+shadow.
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
      { requires: [{ kind: 'tag', tag: 'arcane', count: 3 }], description: 'Arcane units +50% ability power and +12 HP.', modifier: { abilityPower: 0.5, stats: { hp: 12 } }, appliesTo: { tag: 'arcane' } },
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
      { requires: [{ kind: 'tag', tag: 'wild', count: 2 }], description: 'Wild units +1 SPD.', modifier: { stats: { spd: 1 } }, appliesTo: { tag: 'wild' } },
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
];

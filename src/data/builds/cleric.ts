import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const clericTalents = [
  talent('cleric/devotion', 'Devotion', '+30% ability power.', { abilityPower: 0.3 }),
  talent('cleric/sanctuary', 'Sanctuary', 'Start of combat: shield all allies for 2 more.', trig(
    on('startOfCombat', 'Sanctuary', [{ kind: 'shield', target: 'allAllies', amount: { flat: 2 } }]),
  )),
  talent('cleric/holy-strike', 'Holy Strike', 'Basic attacks deal an extra 50% ATK as piercing damage.', trig(
    on('onAttack', 'Holy Strike', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.5 }, pierce: true }]),
  )),
  talent('cleric/martyr', 'Martyr', 'When an ally falls, heal all allies for 100% ATK.', trig(
    on('onAllyDeath', 'Martyr', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }]),
  )),
];

export const priest = advanced({
  id: 'priest',
  name: 'Priest',
  baseClassId: 'cleric',
  description: 'Dedicated healer who keeps the whole party standing.',
  tags: ['divine'],
  ability: {
    id: 'prayer',
    name: 'Prayer of Healing',
    description: 'Every 3rd turn: heal all allies for 180% ATK and shield them for 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'heal', target: 'allAllies', amount: { atk: 1.8 } },
      { kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } },
    ],
  },
  passive: { name: 'Last Rites', description: 'When an ally dies, shield all allies for 100% ATK.' },
  modifier: {
    stats: { hp: 6 },
    triggers: [on('onAllyDeath', 'Last Rites', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }])],
  },
  talents: [
    talent('priest/greater-heal', 'Greater Heal', '+50% ability power.', { abilityPower: 0.5 }),
    talent('priest/grace', 'Divine Grace', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    talent('priest/guardian-angel', 'Guardian Angel', 'Twice per combat, when an ally falls, heal the most injured ally for 300% ATK.', trig(
      on('onAllyDeath', 'Guardian Angel', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 3 } }], { limit: 2 }),
    )),
    talent('priest/halo', 'Halo', 'Start of combat: all allies gain +1 DEF.', trig(
      on('startOfCombat', 'Halo', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
    )),
  ],
});

export const inquisitor = advanced({
  id: 'inquisitor',
  name: 'Inquisitor',
  baseClassId: 'cleric',
  description: 'Battle cleric who smites the strongest foe and sustains on it.',
  tags: ['divine', 'martial'],
  ability: {
    id: 'judgment',
    name: 'Judgment',
    description: 'Every 3rd turn: deal 170% ATK piercing to the strongest enemy and heal yourself for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'highestAtk', amount: { atk: 1.7 }, pierce: true },
      { kind: 'heal', target: 'self', amount: { atk: 1 } },
    ],
  },
  passive: { name: 'Condemn', description: 'After casting, the strongest enemy loses 1 DEF.' },
  modifier: {
    stats: { atk: 2, def: 1 },
    triggers: [on('onAbility', 'Condemn', [{ kind: 'debuff', target: 'highestAtk', stat: 'def', amount: { flat: 1 } }])],
  },
  talents: [
    talent('inquisitor/zeal', 'Zeal', '+3 ATK.', { stats: { atk: 3 } }),
    talent('inquisitor/purge', 'Purge', 'Basic attacks strip 1 ATK from the target (max 4 times).', trig(
      on('onAttack', 'Purge', [{ kind: 'debuff', target: 'triggerTarget', stat: 'atk', amount: { flat: 1 } }], { limit: 4 }),
    )),
    talent('inquisitor/fury', 'Righteous Fury', 'When bloodied, gain +4 ATK.', trig(
      on('onBloodied', 'Righteous Fury', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } }]),
    )),
    talent('inquisitor/sanctified', 'Sanctified Blade', '+20% lifesteal.', { lifesteal: 0.2 }),
  ],
});

export const clericClass: ClassDef = {
  id: 'cleric',
  name: 'Cleric',
  role: 'support',
  tags: ['divine'],
  unlockable: false,
  description: 'Healer who shields the party at the start of combat.',
  baseStats: { hp: 30, atk: 4, def: 2, spd: 9 },
  range: 'ranged',
  placement: 2,
  statWeights: { hp: 3, atk: 2, def: 2, spd: 1 },
  talents: talentIds(clericTalents),
  advancedClasses: ['priest', 'inquisitor'],
  attackTarget: 'nearest',
  ability: {
    id: 'mend',
    name: 'Mend',
    description: 'Every 2nd turn: heal the most injured ally for 250% ATK.',
    cooldown: 2,
    effects: [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 2.5 } }],
  },
  passive: { name: 'Blessing', description: 'Start of combat: shield all allies for 100% ATK.' },
  triggers: [
    {
      label: 'Blessing',
      on: 'startOfCombat',
      effects: [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }],
    },
  ],
};

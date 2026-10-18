import type { SummonDef } from '../../engine/types.ts';
import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const druidTalents = [
  talent('druid/regrowth', 'Regrowth', 'At the start of each of your turns, heal 3.', trig(
    on('onTurnStart', 'Regrowth', [{ kind: 'heal', target: 'self', amount: { flat: 3 } }]),
  )),
  talent('druid/wild-growth', 'Wild Growth', 'After your ability, heal all allies for 2.', trig(
    on('onAbility', 'Wild Growth', [{ kind: 'heal', target: 'allAllies', amount: { flat: 2 } }]),
  )),
  talent('druid/barkskin', 'Barkskin', 'Start of combat: shield yourself for 8.', trig(
    on('startOfCombat', 'Barkskin', [{ kind: 'shield', target: 'self', amount: { flat: 8 } }]),
  )),
  talent('druid/strangle', 'Strangling Vines', 'After your ability, the enemy front row loses 1 more SPD.', trig(
    on('onAbility', 'Strangling Vines', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } }]),
  )),
];

export const shapeshifter = advanced({
  id: 'shapeshifter',
  name: 'Shapeshifter',
  baseClassId: 'druid',
  description: 'Takes the form of a great bear to hold the front line.',
  tags: ['wild', 'guardian', 'nature'],
  ability: {
    id: 'maul',
    name: 'Maul',
    description: 'Every 3rd turn: deal 140% ATK to the nearest enemy and taunt for 1 turn.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.4 } },
      { kind: 'taunt', target: 'self', turns: 1 },
    ],
  },
  statWeights: { hp: 5, atk: 2, def: 3, spd: 1 },
  modifier: {
    stats: { hp: 14, def: 2, atk: 1 },
    triggers: [
      on('onBloodied', 'Primal Fury', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } },
        { kind: 'buff', target: 'self', stat: 'def', amount: { flat: 2 } },
      ]),
    ],
  },
  talents: [
    talent('shapeshifter/savage-roar', 'Savage Roar', 'Start of combat: the enemy front row loses 1 ATK.', trig(
      on('startOfCombat', 'Savage Roar', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('shapeshifter/hibernate', 'Hibernate', 'When bloodied, heal 30% of max HP.', trig(
      on('onBloodied', 'Hibernate', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    talent('shapeshifter/rend', 'Rend', '30% on attack: the target loses 1 DEF.', trig(
      on('onAttack', 'Rend', [{ kind: 'debuff', target: 'triggerTarget', stat: 'def', amount: { flat: 1 } }], { chance: 0.3 }),
    )),
    talent('shapeshifter/ironbark', 'Ironbark', '+4 DEF, −2 SPD.', { stats: { def: 4, spd: -2 } }),
  ],
});

const treant: SummonDef = {
  name: 'Treant',
  classId: 'treant',
  hp: { maxHp: 0.6 },
  atk: { atk: 0.5 },
  def: 2,
  spd: 7,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

export const groveWarden = advanced({
  id: 'grove-warden',
  name: 'Grove Warden',
  baseClassId: 'druid',
  description: 'Calls treants to the front line and keeps the party mended.',
  tags: ['nature', 'divine'],
  ability: {
    id: 'call-of-the-grove',
    name: 'Call of the Grove',
    description: 'Every 4th turn (first on turn 2): summon a Treant in an empty slot (60% of your max HP, 50% ATK). If the board is full, heal all allies for 80% ATK instead.',
    cooldown: 4,
    initialCooldown: 2,
    effects: [{ kind: 'summon', summon: treant, fallback: [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.8 } }] }],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  modifier: {
    stats: { hp: 6, atk: 1 },
    triggers: [on('onTurnStart', 'Rejuvenate', [{ kind: 'heal', target: 'lowestHpAlly', amount: { flat: 2 } }])],
  },
  talents: [
    talent('grove-warden/bloom', 'Bloom', 'After your ability, heal all allies for 50% ATK.', trig(
      on('onAbility', 'Bloom', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } }]),
    )),
    talent('grove-warden/ancient-growth', 'Ancient Growth', '+40% ability power (stronger treants and heals).', { abilityPower: 0.4 }),
    talent('grove-warden/sap-shield', 'Sap Shield', 'Start of combat: shield all allies for 3.', trig(
      on('startOfCombat', 'Sap Shield', [{ kind: 'shield', target: 'allAllies', amount: { flat: 3 } }]),
    )),
    talent('grove-warden/entwine', 'Entwine', 'After your ability, the enemy front row loses 1 SPD.', trig(
      on('onAbility', 'Entwine', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } }]),
    )),
  ],
});

export const druidClass: ClassDef = {
  id: 'druid',
  name: 'Druid',
  role: 'support',
  tags: ['wild', 'nature'],
  unlockable: false,
  description: 'Nature caster who slows the enemy front line; becomes a bear or a healer.',
  baseStats: { hp: 30, atk: 5, def: 1, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 4, atk: 2, def: 2, spd: 1 },
  talents: talentIds(druidTalents),
  advancedClasses: ['shapeshifter', 'grove-warden'],
  attackTarget: 'nearest',
  ability: {
    id: 'entangle',
    name: 'Entangle',
    description: 'Every 3rd turn: deal 70% ATK to each enemy in the front row and slow them by 1 SPD.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.7 } },
      { kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } },
    ],
  },
  triggers: [on('onHurt', 'Thornhide', [{ kind: 'damage', target: 'triggerSource', amount: { flat: 2 }, pierce: true }], { chance: 0.3 })],
};

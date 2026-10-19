import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const monkTalents = [
  talent('monk/pressure-points', 'Pressure Points', '30% on attack: the target loses 1 DEF.', trig(
    on('onAttack', 'Pressure Points', [{ kind: 'debuff', target: 'triggerTarget', stat: 'def', amount: { flat: 1 } }], { chance: 0.3 }),
  )),
  talent('monk/meditation', 'Meditation', 'The first time you drop below 50% HP, heal 25% of max HP and gain +2 SPD.', trig(
    on('onBloodied', 'Meditation', [
      { kind: 'heal', target: 'self', amount: { maxHp: 0.25 } },
      { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 2 } },
    ]),
  )),
  talent('monk/long-stance', 'Long Stance', 'Fight at full strength from the back row. +1 SPD.', { reach: true, stats: { spd: 1 } }),
  talent('monk/deflect', 'Deflect', '25% when hurt: shield yourself for 4.', trig(
    on('onHurt', 'Deflect', [{ kind: 'shield', target: 'self', amount: { flat: 4 } }], { chance: 0.25 }),
  )),
];

export const windwalker = advanced({
  id: 'windwalker',
  name: 'Windwalker',
  baseClassId: 'monk',
  description: 'A blur of fists that only gets faster.',
  tags: ['martial', 'spirit'],
  ability: {
    id: 'hundred-fists',
    name: 'Hundred Fists',
    description: 'Every 3rd turn: strike random enemies 5 times for 45% ATK each.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.45 }, hits: 5 }],
  },
  statWeights: { hp: 1, atk: 3, def: 1, spd: 5 },
  modifier: {
    stats: { spd: 3, atk: 2, hp: 6 },
    triggers: [on('onKill', 'Wind Step', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 2 } }])],
  },
  talents: [
    talent('windwalker/gale', 'Gale', 'Each basic attack grants +1 SPD (max 6).', trig(
      on('onAttack', 'Gale', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } }], { limit: 6 }),
    )),
    talent('windwalker/tempest', 'Tempest', '+30% ability power.', { abilityPower: 0.3 }),
    talent('windwalker/afterimage', 'Afterimage', 'Start of combat: shield yourself for 25% of max HP.', trig(
      on('startOfCombat', 'Afterimage', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.25 } }]),
    )),
    talent('windwalker/follow-through', 'Follow-Through', '25% on attack: strike again for 60% ATK.', trig(
      on('onAttack', 'Follow-Through', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.6 } }], { chance: 0.25 }),
    )),
  ],
});

export const ironFist = advanced({
  id: 'iron-fist',
  name: 'Iron Fist',
  baseClassId: 'monk',
  description: 'Immovable fighter who turns every blow back on the attacker.',
  tags: ['martial', 'guardian', 'spirit'],
  ability: {
    id: 'counterstance',
    name: 'Counterstance',
    description: 'Every 3rd turn: shield yourself for 3 + 120% DEF and taunt for 1 turn.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'self', amount: { flat: 3, def: 1.2 } },
      { kind: 'taunt', target: 'self', turns: 1 },
    ],
  },
  statWeights: { hp: 4, atk: 2, def: 3, spd: 2 },
  modifier: {
    stats: { hp: 8, def: 2 },
    triggers: [on('onHurt', 'Riposte', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.6 } }], { chance: 0.25 })],
  },
  talents: [
    talent('iron-fist/stone-body', 'Stone Body', '+3 DEF, −2 SPD.', { stats: { def: 3, spd: -2 } }),
    talent('iron-fist/retaliate', 'Retaliate', '25% when hurt: strike the attacker for 100% ATK.', trig(
      on('onHurt', 'Retaliate', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 1 } }], { chance: 0.25 }),
    )),
    talent('iron-fist/chi-ward', 'Chi Ward', 'Start of combat: shield all allies for 4.', trig(
      on('startOfCombat', 'Chi Ward', [{ kind: 'shield', target: 'allAllies', amount: { flat: 4 } }]),
    )),
    talent('iron-fist/unbroken', 'Unbroken', 'When bloodied: heal 20% of max HP and taunt for 2 turns.', trig(
      on('onBloodied', 'Unbroken', [
        { kind: 'heal', target: 'self', amount: { maxHp: 0.2 } },
        { kind: 'taunt', target: 'self', turns: 2 },
      ]),
    )),
  ],
});

export const monkClass: ClassDef = {
  id: 'monk',
  name: 'Monk',
  role: 'striker',
  tags: ['martial', 'spirit'],
  unlockable: false,
  description: 'Fast unarmed fighter: many quick hits, and quicker with every swing.',
  baseStats: { hp: 30, atk: 5, def: 2, spd: 14 },
  range: 'melee',
  placement: 1,
  statWeights: { hp: 2, atk: 3, def: 1, spd: 4 },
  talents: talentIds(monkTalents),
  advancedClasses: ['windwalker', 'iron-fist'],
  attackTarget: 'nearest',
  ability: {
    id: 'flurry',
    name: 'Flurry',
    description: 'Every 3rd turn: strike the nearest enemy 3 times for 50% ATK each.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 0.5 }, hits: 3 }],
  },
  triggers: [on('onAttack', 'Momentum', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } }], { limit: 3 })],
};

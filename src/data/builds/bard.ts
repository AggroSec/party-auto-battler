import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const bardTalents = [
  talent('bard/allegro', 'Allegro', 'Start of combat: all allies gain +1 more SPD.', trig(
    on('startOfCombat', 'Allegro', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }]),
  )),
  talent('bard/dirge', 'Dirge', 'After your ability, the enemy front row loses 1 ATK.', trig(
    on('onAbility', 'Dirge', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } }]),
  )),
  talent('bard/harmony', 'Harmony', 'After your ability, heal the most wounded ally for 100% ATK.', trig(
    on('onAbility', 'Harmony', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } }]),
  )),
  talent('bard/second-verse', 'Second Verse', 'Start of combat: shield yourself for 6.', trig(
    on('startOfCombat', 'Second Verse', [{ kind: 'shield', target: 'self', amount: { flat: 6 } }]),
  )),
];

export const skald = advanced({
  id: 'skald',
  name: 'Skald',
  baseClassId: 'bard',
  description: 'War-singer whose chants make the whole party hit harder.',
  tags: ['martial', 'spirit'],
  ability: {
    id: 'war-chant',
    name: 'War Chant',
    description: 'Every 3rd turn: all allies gain +2 ATK.',
    cooldown: 3,
    effects: [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } }],
  },
  statWeights: { hp: 3, atk: 2, def: 2, spd: 3 },
  modifier: {
    stats: { hp: 6, atk: 1 },
    triggers: [on('onAllyDeath', 'Lament', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }])],
  },
  talents: [
    talent('skald/war-drums', 'War Drums', 'Start of combat: all allies gain +1 ATK.', trig(
      on('startOfCombat', 'War Drums', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('skald/anthem', 'Anthem', 'War Chant also gives all allies +1 DEF.', trig(
      on('onAbility', 'Anthem', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('skald/rally', 'Rally', 'When bloodied, shield all allies for 4.', trig(
      on('onBloodied', 'Rally', [{ kind: 'shield', target: 'allAllies', amount: { flat: 4 } }]),
    )),
    talent('skald/inspiring-presence', 'Inspiring Presence', 'At the start of each of your turns, all allies heal 1.', trig(
      on('onTurnStart', 'Inspiring Presence', [{ kind: 'heal', target: 'allAllies', amount: { flat: 1 } }]),
    )),
  ],
});

export const trickster = advanced({
  id: 'trickster',
  name: 'Trickster',
  baseClassId: 'bard',
  description: 'Sows discord: delays enemy abilities and saps their strength.',
  tags: ['arcane', 'shadow'],
  ability: {
    id: 'discord',
    name: 'Discord',
    description: "Every 3rd turn: every enemy's ability comes 1 turn later, and the strongest enemy loses 2 ATK.",
    cooldown: 3,
    effects: [
      { kind: 'cooldown', target: 'allEnemies', turns: 1 },
      { kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 2 } },
    ],
  },
  statWeights: { hp: 2, atk: 3, def: 1, spd: 4 },
  modifier: {
    stats: { spd: 2, atk: 1 },
    triggers: [on('startOfCombat', 'Misdirection', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } }])],
  },
  talents: [
    talent('trickster/jinx', 'Jinx', '25% on attack: the target loses 1 SPD.', trig(
      on('onAttack', 'Jinx', [{ kind: 'debuff', target: 'triggerTarget', stat: 'spd', amount: { flat: 1 } }], { chance: 0.25 }),
    )),
    talent('trickster/vanish', 'Vanish', 'When bloodied, shield yourself for 30% of max HP.', trig(
      on('onBloodied', 'Vanish', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    talent('trickster/cacophony', 'Cacophony', 'Discord also deals 50% ATK to every enemy.', trig(
      on('onAbility', 'Cacophony', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } }]),
    )),
    talent('trickster/backfire', 'Backfire', "30% when hurt: the attacker's ability comes 1 turn later.", trig(
      on('onHurt', 'Backfire', [{ kind: 'cooldown', target: 'triggerSource', turns: 1 }], { chance: 0.3 }),
    )),
  ],
});

export const bardClass: ClassDef = {
  id: 'bard',
  name: 'Bard',
  role: 'support',
  tags: ['arcane', 'spirit'],
  unlockable: false,
  description: 'Back-row performer who speeds up the party and makes it stronger every song.',
  baseStats: { hp: 26, atk: 4, def: 1, spd: 10 },
  range: 'ranged',
  placement: 4,
  statWeights: { hp: 3, atk: 2, def: 1, spd: 3 },
  talents: talentIds(bardTalents),
  advancedClasses: ['skald', 'trickster'],
  attackTarget: 'randomEnemy',
  ability: {
    id: 'rousing-ballad',
    name: 'Rousing Ballad',
    description: 'Every 3rd turn: all allies gain +1 ATK.',
    cooldown: 3,
    effects: [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }],
  },
  triggers: [on('startOfCombat', 'Inspire', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }])],
};

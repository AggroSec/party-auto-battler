// Monk tertiary classes (level 7): Windwalker → Stormfist / Mistwalker, Iron Fist → Stoneguard / Grandmaster.
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const stormfist = tertiary({
  id: 'stormfist',
  name: 'Stormfist',
  baseClassId: 'monk',
  advancedClassId: 'windwalker',
  description: 'Lightning in human form: more hits, faster, every turn.',
  tags: ['martial', 'spirit'],
  ability: {
    id: 'thunder-palms',
    name: 'Thunder Palms',
    description: 'Every 3rd turn: strike random enemies 7 times for 55% ATK each, then gain +1 SPD.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'randomEnemy', amount: { atk: 0.55 }, hits: 7 },
      { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } },
    ],
  },
  statWeights: { hp: 1, atk: 3, def: 1, spd: 5 },
  passive: { name: 'Static', description: '25% on attack: deal 50% ATK piercing to a random enemy.' },
  modifier: {
    stats: { hp: 8, atk: 2, spd: 3 },
    triggers: [on('onAttack', 'Static', [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.5 }, pierce: true }], { chance: 0.25 })],
  },
  talents: [
    talent('stormfist/lightning-reflexes', 'Lightning Reflexes', '+3 SPD, +1 ATK.', { stats: { spd: 3, atk: 1 } }),
    talent('stormfist/overcharge', 'Overcharge', '+35% ability power.', { abilityPower: 0.35 }),
    talent('stormfist/storm-shield', 'Storm Shield', 'Start of combat: shield yourself for 30% of max HP.', trig(
      on('startOfCombat', 'Storm Shield', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    abilityTalent('stormfist/chain-lightning', {
      id: 'chain-lightning',
      name: 'Chain Lightning',
      description: 'Every 4th turn: deal 90% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.9 } }],
    }),
  ],
});

export const mistwalker = tertiary({
  id: 'mistwalker',
  name: 'Mistwalker',
  baseClassId: 'monk',
  advancedClassId: 'windwalker',
  description: 'Hard to pin down: flows through blows and mends allies between strikes.',
  tags: ['spirit'],
  ability: {
    id: 'mist-step',
    name: 'Mist Step',
    description: 'Every 3rd turn: strike random enemies 4 times for 60% ATK each, then heal all allies for 50% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'randomEnemy', amount: { atk: 0.6 }, hits: 4 },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } },
    ],
  },
  statWeights: { hp: 3, atk: 3, def: 1, spd: 4 },
  passive: { name: 'Flowing Mist', description: '30% when hurt: shield yourself for 8.' },
  modifier: {
    stats: { hp: 12, atk: 1, spd: 2 },
    triggers: [on('onHurt', 'Flowing Mist', [{ kind: 'shield', target: 'self', amount: { flat: 8 } }], { chance: 0.3 })],
  },
  talents: [
    talent('mistwalker/serenity', 'Serenity', 'At the start of each of your turns, heal the most wounded ally for 3.', trig(
      on('onTurnStart', 'Serenity', [{ kind: 'heal', target: 'lowestHpAlly', amount: { flat: 3 } }]),
    )),
    talent('mistwalker/veil', 'Veil', 'Start of combat: shield all allies for 6.', trig(
      on('startOfCombat', 'Veil', [{ kind: 'shield', target: 'allAllies', amount: { flat: 6 } }]),
    )),
    talent('mistwalker/ebb', 'Ebb and Flow', '+30% ability power, +2 SPD.', { abilityPower: 0.3, stats: { spd: 2 } }),
    abilityTalent('mistwalker/renewing-mist', {
      id: 'renewing-mist',
      name: 'Renewing Mist',
      description: 'Every 4th turn: heal all allies for 100% ATK and shield them for 50% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'heal', target: 'allAllies', amount: { atk: 1 } },
        { kind: 'shield', target: 'allAllies', amount: { atk: 0.5 } },
      ],
    }),
  ],
});

export const stoneguard = tertiary({
  id: 'stoneguard',
  name: 'Stoneguard',
  baseClassId: 'monk',
  advancedClassId: 'iron-fist',
  description: 'A mountain that walks: taunts the whole enemy side and shrugs it off.',
  tags: ['martial', 'guardian', 'spirit'],
  ability: {
    id: 'mountain-stance',
    name: 'Mountain Stance',
    description: 'Every 3rd turn: shield yourself for 5 + 150% DEF, taunt for 2 turns, and heal yourself for 10% of max HP.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'self', amount: { flat: 5, def: 1.5 } },
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'heal', target: 'self', amount: { maxHp: 0.1 } },
    ],
  },
  statWeights: { hp: 5, atk: 1, def: 4, spd: 1 },
  passive: { name: 'Granite Skin', description: '30% when hurt: strike the attacker for 60% ATK.' },
  modifier: {
    stats: { hp: 16, def: 3 },
    triggers: [on('onHurt', 'Granite Skin', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.6 } }], { chance: 0.3 })],
  },
  talents: [
    talent('stoneguard/bedrock', 'Bedrock', '+16 HP, +1 DEF.', { stats: { hp: 16, def: 1 } }),
    talent('stoneguard/avalanche', 'Avalanche', 'After casting, the enemy front row loses 1 ATK.', trig(
      on('onAbility', 'Avalanche', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('stoneguard/immovable', 'Immovable', 'When bloodied, shield yourself for 50% of max HP.', trig(
      on('onBloodied', 'Immovable', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.5 } }]),
    )),
    abilityTalent('stoneguard/earthshatter', {
      id: 'earthshatter',
      name: 'Earthshatter',
      description: 'Every 4th turn: deal 80% ATK + 80% DEF to each enemy in the front row; they lose 1 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.8, def: 0.8 } },
        { kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const grandmaster = tertiary({
  id: 'grandmaster',
  name: 'Grandmaster',
  baseClassId: 'monk',
  advancedClassId: 'iron-fist',
  description: 'Perfect technique: every attack against it is answered.',
  tags: ['martial', 'spirit'],
  ability: {
    id: 'perfect-counter',
    name: 'Perfect Counter',
    description: 'Every 3rd turn: shield yourself for 3 + 100% DEF, taunt for 1 turn, and strike the nearest enemy 3 times for 70% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'self', amount: { flat: 3, def: 1 } },
      { kind: 'taunt', target: 'self', turns: 1 },
      { kind: 'damage', target: 'nearest', amount: { atk: 0.7 }, hits: 3 },
    ],
  },
  passive: { name: 'Riposte Mastery', description: '45% when hurt: strike the attacker for 80% ATK.' },
  modifier: {
    stats: { hp: 12, atk: 2, def: 1 },
    triggers: [on('onHurt', 'Riposte Mastery', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.8 } }], { chance: 0.45 })],
  },
  talents: [
    talent('grandmaster/discipline', 'Discipline', '+2 ATK, +2 DEF, +1 SPD.', { stats: { atk: 2, def: 2, spd: 1 } }),
    talent('grandmaster/pressure', 'Nerve Strike', '30% on attack: the target loses 1 ATK.', trig(
      on('onAttack', 'Nerve Strike', [{ kind: 'debuff', target: 'triggerTarget', stat: 'atk', amount: { flat: 1 } }], { chance: 0.3 }),
    )),
    talent('grandmaster/inner-peace', 'Inner Peace', 'When bloodied, heal 30% of max HP and gain +2 DEF.', trig(
      on('onBloodied', 'Inner Peace', [
        { kind: 'heal', target: 'self', amount: { maxHp: 0.3 } },
        { kind: 'buff', target: 'self', stat: 'def', amount: { flat: 2 } },
      ]),
    )),
    abilityTalent('grandmaster/quivering-palm', {
      id: 'quivering-palm',
      name: 'Quivering Palm',
      description: 'Every 5th turn: deal 300% ATK piercing to the strongest enemy.',
      cooldown: 5,
      effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 3 }, pierce: true }],
    }),
  ],
});

export const MONK_TERTIARY = [stormfist, mistwalker, stoneguard, grandmaster];

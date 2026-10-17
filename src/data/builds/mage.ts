import { advanced, on, talent, trig } from './dsl.ts';

export const mageTalents = [
  talent('mage/focus', 'Arcane Focus', '+30% ability power.', { abilityPower: 0.3 }),
  talent('mage/quickcast', 'Quickcast', 'Ability cooldown −1.', { abilityCooldown: -1 }),
  talent('mage/mana-shield', 'Mana Shield', 'Start of combat: shield yourself for 150% ATK.', trig(
    on('startOfCombat', 'Mana Shield', [{ kind: 'shield', target: 'self', amount: { atk: 1.5 } }]),
  )),
  talent('mage/ignite', 'Ignite', 'After casting, deal 60% ATK to a random enemy.', trig(
    on('onAbility', 'Ignite', [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.6 } }]),
  )),
];

export const pyromancer = advanced({
  id: 'pyromancer',
  name: 'Pyromancer',
  baseClassId: 'mage',
  description: 'Burns down the whole front line.',
  tags: ['arcane'],
  ability: {
    id: 'meteor',
    name: 'Meteor',
    description: 'Every 2nd turn: deal 160% ATK to each enemy in the front row.',
    cooldown: 2,
    effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.6 } }],
  },
  modifier: {
    stats: { atk: 3, hp: 6 },
    triggers: [on('onKill', 'Combustion', [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.8 } }])],
  },
  talents: [
    talent('pyromancer/inferno', 'Inferno', '+40% ability power.', { abilityPower: 0.4 }),
    talent('pyromancer/scorch', 'Scorch', 'After casting, deal 30% ATK to every enemy.', trig(
      on('onAbility', 'Scorch', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.3 } }]),
    )),
    talent('pyromancer/fire-ward', 'Fire Ward', 'Start of combat: shield all allies for 3.', trig(
      on('startOfCombat', 'Fire Ward', [{ kind: 'shield', target: 'allAllies', amount: { flat: 3 } }]),
    )),
    talent('pyromancer/living-bomb', 'Living Bomb', '30% on attack: 80% ATK blast that splashes half to neighbours.', trig(
      on('onAttack', 'Living Bomb', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.8 }, splash: 0.5 }], { chance: 0.3 }),
    )),
  ],
});

export const chronomancer = advanced({
  id: 'chronomancer',
  name: 'Chronomancer',
  baseClassId: 'mage',
  description: 'Bends time: hastens allies, delays and slows enemies.',
  tags: ['arcane'],
  ability: {
    id: 'time-warp',
    name: 'Time Warp',
    description: 'Every 3rd turn: allies’ abilities come 1 turn sooner; deal 100% ATK to the nearest enemy.',
    cooldown: 3,
    effects: [
      { kind: 'cooldown', target: 'allAllies', turns: -1 },
      { kind: 'damage', target: 'nearest', amount: { atk: 1 } },
    ],
  },
  modifier: {
    stats: { spd: 2, hp: 4 },
    triggers: [on('startOfCombat', 'Slow Field', [{ kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } }])],
  },
  talents: [
    talent('chronomancer/haste', 'Haste', 'Start of combat: gain +3 SPD.', trig(
      on('startOfCombat', 'Haste', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 3 } }]),
    )),
    talent('chronomancer/temporal-lock', 'Temporal Lock', 'After casting, the strongest enemy loses 1 SPD.', trig(
      on('onAbility', 'Temporal Lock', [{ kind: 'debuff', target: 'highestAtk', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('chronomancer/rewind', 'Rewind', 'The first time you drop below 50% HP, heal 40% of max HP.', trig(
      on('onBloodied', 'Rewind', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.4 } }]),
    )),
    talent('chronomancer/accelerate', 'Accelerate', 'Start of combat: your first Time Warp comes 2 turns sooner.', trig(
      on('startOfCombat', 'Accelerate', [{ kind: 'cooldown', target: 'self', turns: -2 }]),
    )),
  ],
});

import { advanced, on, talent, trig } from './dsl.ts';

export const warriorTalents = [
  talent('warrior/intimidate', 'Intimidating Cleave', 'After Cleave, the enemy front row loses 1 ATK.', trig(
    on('onAbility', 'Intimidate', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } }]),
  )),
  talent('warrior/second-wind', 'Second Wind', 'The first time you drop below 50% HP, heal 30% of max HP.', trig(
    on('onBloodied', 'Second Wind', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]),
  )),
  talent('warrior/bulwark', 'Bulwark', 'Start of combat: shield yourself for 4 + 100% DEF.', trig(
    on('startOfCombat', 'Bulwark', [{ kind: 'shield', target: 'self', amount: { flat: 4, def: 1 } }]),
  )),
  talent('warrior/polearm', 'Polearm Training', 'Fight at full strength from the back row. +1 ATK.', { reach: true, stats: { atk: 1 } }),
];

export const knight = advanced({
  id: 'knight',
  name: 'Knight',
  baseClassId: 'warrior',
  description: 'Holy protector who shields the whole party.',
  tags: ['martial', 'guardian', 'divine'],
  ability: {
    id: 'holy-bulwark',
    name: 'Holy Bulwark',
    description: 'Every 3rd turn: shield all allies for 3 + 150% DEF.',
    cooldown: 3,
    effects: [{ kind: 'shield', target: 'allAllies', amount: { flat: 3, def: 1.5 } }],
  },
  modifier: {
    stats: { hp: 8, def: 2 },
    triggers: [on('onHurt', 'Stalwart', [{ kind: 'shield', target: 'self', amount: { flat: 3 } }], { chance: 0.25 })],
  },
  talents: [
    talent('knight/aegis', 'Aegis', 'Start of combat: shield all allies for 5.', trig(
      on('startOfCombat', 'Aegis', [{ kind: 'shield', target: 'allAllies', amount: { flat: 5 } }]),
    )),
    talent('knight/righteous', 'Righteous', '+40% ability power.', { abilityPower: 0.4 }),
    talent('knight/fortress', 'Fortress', '+3 DEF, −2 SPD.', { stats: { def: 3, spd: -2 } }),
    talent('knight/retribution', 'Retribution', 'When hurt, deal 2 piercing damage to the attacker.', trig(
      on('onHurt', 'Retribution', [{ kind: 'damage', target: 'triggerSource', amount: { flat: 2 }, pierce: true }]),
    )),
  ],
});

export const berserker = advanced({
  id: 'berserker',
  name: 'Berserker',
  baseClassId: 'warrior',
  description: 'Reckless brawler who heals by hitting and grows deadlier when hurt.',
  tags: ['martial'],
  ability: {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Every 3rd turn: deal 85% ATK to every enemy.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.85 } }],
  },
  modifier: {
    stats: { atk: 3, hp: 8 },
    lifesteal: 0.15,
    triggers: [on('onBloodied', 'Rage', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } }])],
  },
  talents: [
    talent('berserker/bloodthirst', 'Bloodthirst', '+15% lifesteal.', { lifesteal: 0.15 }),
    talent('berserker/frenzy', 'Frenzy', 'Each basic attack grants +1 SPD (max 8).', trig(
      on('onAttack', 'Frenzy', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } }], { limit: 8 }),
    )),
    talent('berserker/reckless', 'Reckless', '+4 ATK, −2 DEF.', { stats: { atk: 4, def: -2 } }),
    talent('berserker/unstoppable', 'Unstoppable', 'When bloodied, shield yourself for 35% of max HP.', trig(
      on('onBloodied', 'Unstoppable', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.35 } }]),
    )),
  ],
});

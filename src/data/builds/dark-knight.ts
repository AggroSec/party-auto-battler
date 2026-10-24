// Dark Knight (post-M7, Brandon's design): the evil tank, opposite the
// Warrior. Where the Warrior tanks with DEF and shields, the Dark Knight pays
// HP for power, drinks it back, and hits harder the lower it gets. Dread
// (−1 ATK per stack) saps whoever fights it.
import type { ClassDef } from '../class-types.ts';
import { DREAD } from '../statuses.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const darkKnightTalents = [
  talent('dark-knight/dread-aura', 'Dread Aura', 'When hurt, 50% chance the attacker gains 1 Dread (−1 ATK, up to 3).', trig(
    on('onHurt', 'Dread Aura', [{ kind: 'status', target: 'triggerSource', status: DREAD, stacks: 1 }], { chance: 0.5 }),
  )),
  talent('dark-knight/blood-oath', 'Blood Oath', '+15% lifesteal.', { lifesteal: 0.15 }),
  talent('dark-knight/unholy-vigor', 'Unholy Vigor', 'Start of combat: pay 10% of max HP and gain +3 ATK.', trig(
    on('startOfCombat', 'Unholy Vigor', [
      { kind: 'payHp', amount: { maxHp: 0.1 } },
      { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } },
    ]),
  )),
  talent('dark-knight/spite', 'Spite', 'Basic attacks deal an extra 10% of your missing HP.', trig(
    on('onAttack', 'Spite', [{ kind: 'damage', target: 'triggerTarget', amount: { missingHp: 0.1 } }]),
  )),
];

export const blackguard = advanced({
  id: 'blackguard',
  name: 'Blackguard',
  baseClassId: 'dark-knight',
  description: 'Blood knight: bleeds itself to cut down the front row, and drinks it all back.',
  tags: ['martial', 'shadow'],
  ability: {
    id: 'crimson-cleave',
    name: 'Crimson Cleave',
    description: 'Every 3rd turn: pay 8% of max HP, deal 100% ATK + 20% of your missing HP to each enemy in the front row, and heal for 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.08 } },
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1, missingHp: 0.2 } },
      { kind: 'heal', target: 'self', amount: { atk: 0.6 } },
    ],
  },
  passive: { name: 'Sanguine', description: '+20% lifesteal.' },
  modifier: { stats: { hp: 8, atk: 3 }, lifesteal: 0.2 },
  talents: [
    talent('blackguard/blood-frenzy', 'Blood Frenzy', 'When bloodied, gain +4 ATK and +2 SPD.', trig(
      on('onBloodied', 'Blood Frenzy', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 2 } },
      ]),
    )),
    talent('blackguard/open-veins', 'Open Veins', 'Basic attacks deal an extra 15% of your missing HP.', trig(
      on('onAttack', 'Open Veins', [{ kind: 'damage', target: 'triggerTarget', amount: { missingHp: 0.15 } }]),
    )),
    talent('blackguard/crimson-thirst', 'Crimson Thirst', '+15% lifesteal.', { lifesteal: 0.15 }),
    talent('blackguard/bleed-for-it', 'Bleed for It', 'Ability cooldown −1.', { abilityCooldown: -1 }),
  ],
});

export const dreadknight = advanced({
  id: 'dreadknight',
  name: 'Dreadknight',
  baseClassId: 'dark-knight',
  description: 'Terror on two legs: draws every blow and leaves attackers too frightened to hit hard.',
  tags: ['martial', 'guardian', 'shadow'],
  ability: {
    id: 'terrorize',
    name: 'Terrorize',
    description: 'Every 3rd turn: taunt for 2 turns, give each enemy in the front row 1 Dread, and shield yourself for 6 + 100% DEF.',
    cooldown: 3,
    effects: [
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'status', target: 'enemyFrontRow', status: DREAD, stacks: 1 },
      { kind: 'shield', target: 'self', amount: { flat: 6, def: 1 } },
    ],
  },
  statWeights: { hp: 5, atk: 1, def: 3, spd: 1 },
  passive: { name: 'Aura of Dread', description: 'When hurt, the attacker gains 1 Dread (−1 ATK, up to 3).' },
  modifier: {
    stats: { hp: 12, def: 3 },
    triggers: [on('onHurt', 'Aura of Dread', [{ kind: 'status', target: 'triggerSource', status: DREAD, stacks: 1 }])],
  },
  talents: [
    talent('dreadknight/intimidation', 'Intimidation', 'Start of combat: every enemy gains 1 Dread.', trig(
      on('startOfCombat', 'Intimidation', [{ kind: 'status', target: 'allEnemies', status: DREAD, stacks: 1 }]),
    )),
    talent('dreadknight/iron-will', 'Iron Will', '+3 DEF, +8 HP.', { stats: { def: 3, hp: 8 } }),
    talent('dreadknight/menace', 'Menace', 'Start of combat: taunt for 2 turns.', trig(on('startOfCombat', 'Menace', [{ kind: 'taunt', target: 'self', turns: 2 }]))),
    talent('dreadknight/grim-retort', 'Grim Retort', 'When hurt, deal 30% DEF + 10% of your missing HP to the attacker.', trig(
      on('onHurt', 'Grim Retort', [{ kind: 'damage', target: 'triggerSource', amount: { def: 0.3, missingHp: 0.1 } }]),
    )),
  ],
});

export const darkKnightClass: ClassDef = {
  id: 'dark-knight',
  name: 'Dark Knight',
  role: 'frontline',
  tags: ['martial', 'guardian', 'shadow'],
  unlockable: true,
  description: 'Evil tank: pays HP for power, drinks it back, and grows deadlier as it bleeds.',
  baseStats: { hp: 44, atk: 6, def: 2, spd: 8 },
  range: 'melee',
  placement: 0,
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  talents: talentIds(darkKnightTalents),
  advancedClasses: ['blackguard', 'dreadknight'],
  attackTarget: 'nearest',
  ability: {
    id: 'blood-price',
    name: 'Blood Price',
    description: 'Every 3rd turn: pay 8% of max HP, then deal 140% ATK + 25% of your missing HP to the nearest enemy and heal for 75% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.08 } },
      { kind: 'damage', target: 'nearest', amount: { atk: 1.4, missingHp: 0.25 } },
      { kind: 'heal', target: 'self', amount: { atk: 0.75 } },
    ],
  },
  passive: { name: 'Dark Resolve', description: 'When bloodied, gain +3 DEF and +2 ATK.' },
  triggers: [
    on('onBloodied', 'Dark Resolve', [
      { kind: 'buff', target: 'self', stat: 'def', amount: { flat: 3 } },
      { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
    ]),
  ],
};

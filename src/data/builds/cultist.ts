// Cultist (post-M8, Brandon's evil healer): heals by stealing. Its healing is
// drained from enemies, through Siphon and through Blight, a rot whose every
// tick heals the Cultist's most wounded ally. Hemomancers pay in their own
// blood for bigger heals; Plague Doctors spread Blight so the whole enemy
// party feeds yours.
import type { ClassDef } from '../class-types.ts';
import { BLIGHT } from '../statuses.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const cultistTalents = [
  talent('cultist/vile-harvest', 'Vile Harvest', 'When any enemy falls, heal the most wounded ally for 100% ATK.', trig(
    on('onKill', 'Vile Harvest', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } }]),
    on('onAllyKill', 'Vile Harvest', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } }]),
  )),
  talent('cultist/black-tithe', 'Black Tithe', 'Start of combat: pay 10% of max HP and shield all allies for 80% ATK.', trig(
    on('startOfCombat', 'Black Tithe', [
      { kind: 'payHp', amount: { maxHp: 0.1 } },
      { kind: 'shield', target: 'allAllies', amount: { atk: 0.8 } },
    ]),
  )),
  talent('cultist/leeching-hex', 'Leeching Hex', '+15% lifesteal.', { lifesteal: 0.15 }),
  talent('cultist/creeping-blight', 'Creeping Blight', 'Basic attacks give 1 more Blight.', trig(
    on('onAttack', 'Creeping Blight', [{ kind: 'status', target: 'triggerTarget', status: BLIGHT, stacks: 1 }]),
  )),
];

export const hemomancer = advanced({
  id: 'hemomancer',
  name: 'Hemomancer',
  baseClassId: 'cultist',
  description: 'Blood mage: pays in its own blood to pour life into the party.',
  tags: ['occult', 'shadow'],
  ability: {
    id: 'transfusion',
    name: 'Transfusion',
    description: 'Every 2nd turn: pay 6% of max HP, deal 80% ATK to the nearest enemy, and heal the most wounded ally for 200% ATK.',
    cooldown: 2,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.06 } },
      { kind: 'damage', target: 'nearest', amount: { atk: 0.8 } },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 2 } },
    ],
  },
  passive: { name: 'Blood Bond', description: '+15% lifesteal.' },
  modifier: { stats: { hp: 6, atk: 2 }, lifesteal: 0.15 },
  talents: [
    talent('hemomancer/sanguine-flow', 'Sanguine Flow', '+30% ability power.', { abilityPower: 0.3 }),
    talent('hemomancer/bloodletting', 'Bloodletting', 'When bloodied, heal all allies for 100% ATK.', trig(
      on('onBloodied', 'Bloodletting', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    talent('hemomancer/iron-blood', 'Iron Blood', '+2 DEF, +10 HP.', { stats: { def: 2, hp: 10 } }),
    talent('hemomancer/crimson-ward', 'Crimson Ward', 'After casting, shield the most wounded ally for 60% ATK.', trig(
      on('onAbility', 'Crimson Ward', [{ kind: 'shield', target: 'lowestHpAlly', amount: { atk: 0.6 } }]),
    )),
  ],
});

export const plagueDoctor = advanced({
  id: 'plague-doctor',
  name: 'Plague Doctor',
  baseClassId: 'cultist',
  description: 'Spreads Blight across the enemy front, and every tick of it keeps the party standing.',
  tags: ['occult', 'shadow'],
  ability: {
    id: 'miasma',
    name: 'Miasma',
    description: 'Every 2nd turn: each enemy in the front row gains 1 Blight; heal the most wounded ally for 100% ATK.',
    cooldown: 2,
    effects: [
      { kind: 'status', target: 'enemyFrontRow', status: BLIGHT, stacks: 1 },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } },
    ],
  },
  passive: { name: 'Contagion', description: 'Basic attacks have a 50% chance to give 1 more Blight.' },
  modifier: {
    stats: { hp: 6, atk: 1, def: 1 },
    triggers: [on('onAttack', 'Contagion', [{ kind: 'status', target: 'triggerTarget', status: BLIGHT, stacks: 1 }], { chance: 0.5 })],
  },
  talents: [
    talent('plague-doctor/virulence', 'Virulence', 'Start of combat: every enemy gains 1 Blight.', trig(
      on('startOfCombat', 'Virulence', [{ kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 1 }]),
    )),
    talent('plague-doctor/plague-mask', 'Plague Mask', '+2 DEF, +8 HP.', { stats: { def: 2, hp: 8 } }),
    talent('plague-doctor/fever-dream', 'Fever Dream', 'When hurt, 30% chance the attacker gains 1 Blight.', trig(
      on('onHurt', 'Fever Dream', [{ kind: 'status', target: 'triggerSource', status: BLIGHT, stacks: 1 }], { chance: 0.3 }),
    )),
    talent('plague-doctor/epidemic', 'Epidemic', 'After casting, a random enemy gains 2 Blight.', trig(
      on('onAbility', 'Epidemic', [{ kind: 'status', target: 'randomEnemy', status: BLIGHT, stacks: 2 }]),
    )),
  ],
});

export const cultistClass: ClassDef = {
  id: 'cultist',
  name: 'Cultist',
  role: 'support',
  tags: ['occult', 'shadow'],
  unlockable: true,
  description: 'Evil healer: steals life from the enemy, and its Blight keeps the party standing.',
  baseStats: { hp: 30, atk: 4, def: 1, spd: 9 },
  range: 'ranged',
  placement: 2,
  statWeights: { hp: 3, atk: 3, def: 1, spd: 2 },
  talents: talentIds(cultistTalents),
  advancedClasses: ['hemomancer', 'plague-doctor'],
  attackTarget: 'nearest',
  ability: {
    id: 'siphon',
    name: 'Siphon',
    description: 'Every 2nd turn: deal 100% ATK to the nearest enemy and give it 2 Blight, then heal the most wounded ally for 100% ATK.',
    cooldown: 2,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1 } },
      { kind: 'status', target: 'nearest', status: BLIGHT, stacks: 2 },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } },
    ],
  },
  passive: {
    name: 'Blight',
    description: 'Basic attacks give 1 Blight: 20% ATK damage per stack each turn (up to 5, for 3 turns), and every tick heals your most wounded ally for half the damage dealt.',
  },
  triggers: [on('onAttack', 'Blight', [{ kind: 'status', target: 'triggerTarget', status: BLIGHT, stacks: 1 }])],
};

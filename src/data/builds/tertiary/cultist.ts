// Cultist tertiary classes (level 7): Hemomancer → Sanguine Bishop / Vampire
// Lord, Plague Doctor → Pestilent Saint / Rot Mother.
import { BLIGHT } from '../../statuses.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const sanguineBishop = tertiary({
  id: 'sanguine-bishop',
  name: 'Sanguine Bishop',
  baseClassId: 'cultist',
  advancedClassId: 'hemomancer',
  description: 'High priest of blood: huge party heals, paid for in its own veins.',
  tags: ['occult', 'shadow'],
  ability: {
    id: 'blood-sacrament',
    name: 'Blood Sacrament',
    description: 'Every 3rd turn: pay 10% of max HP, heal all allies for 120% ATK, and shield the most wounded ally for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.1 } },
      { kind: 'heal', target: 'allAllies', amount: { atk: 1.2 } },
      { kind: 'shield', target: 'lowestHpAlly', amount: { atk: 1 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 1, spd: 2 },
  passive: { name: 'Consecrated Blood', description: '+15% lifesteal. When bloodied, heal all allies for 100% ATK.' },
  modifier: {
    stats: { hp: 10, atk: 3 },
    lifesteal: 0.15,
    triggers: [on('onBloodied', 'Consecrated Blood', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }])],
  },
  talents: [
    talent('sanguine-bishop/holy-wounds', 'Holy Wounds', '+30% ability power.', { abilityPower: 0.3 }),
    talent('sanguine-bishop/last-rites', 'Last Rites', 'When an ally falls, heal all other allies for 150% ATK.', trig(
      on('onAllyDeath', 'Last Rites', [{ kind: 'heal', target: 'otherAllies', amount: { atk: 1.5 } }]),
    )),
    talent('sanguine-bishop/red-vestments', 'Red Vestments', '+3 DEF, +10 HP.', { stats: { def: 3, hp: 10 } }),
    abilityTalent('sanguine-bishop/communion-of-blood', {
      id: 'communion-of-blood',
      name: 'Communion of Blood',
      description: 'Every 4th turn: pay 5% of max HP and shield all allies for 80% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'payHp', amount: { maxHp: 0.05 } },
        { kind: 'shield', target: 'allAllies', amount: { atk: 0.8 } },
      ],
    }),
  ],
});

export const vampireLord = tertiary({
  id: 'vampire-lord',
  name: 'Vampire Lord',
  baseClassId: 'cultist',
  advancedClassId: 'hemomancer',
  description: 'Feeds on the whole enemy party, and every kill your party lands feeds them too.',
  tags: ['occult', 'shadow'],
  ability: {
    id: 'crimson-feast',
    name: 'Crimson Feast',
    description: 'Every 3rd turn: deal 80% ATK to every enemy and heal all allies for 40% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.4 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Thirst of Ages', description: '+25% lifesteal. When an ally lands a kill, heal all allies for 30% ATK.' },
  modifier: {
    stats: { hp: 8, atk: 3, spd: 1 },
    lifesteal: 0.25,
    triggers: [
      on('onKill', 'Thirst of Ages', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.3 } }]),
      on('onAllyKill', 'Thirst of Ages', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.3 } }]),
    ],
  },
  talents: [
    talent('vampire-lord/nightstalker', 'Nightstalker', '+3 SPD, +2 ATK.', { stats: { spd: 3, atk: 2 } }),
    talent('vampire-lord/sires-bite', 'Sire’s Bite', 'Basic attacks heal the most wounded ally for 30% ATK.', trig(
      on('onAttack', 'Sire’s Bite', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.3 } }]),
    )),
    talent('vampire-lord/eternal-night', 'Eternal Night', 'The first time you would fall, rise at 30% HP.', { revive: 0.3 }),
    abilityTalent('vampire-lord/bat-swarm', {
      id: 'bat-swarm',
      name: 'Bat Swarm',
      description: 'Every 4th turn: strike 3 random enemies for 50% ATK, then heal the most wounded ally for 100% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'randomEnemy', amount: { atk: 0.5 }, hits: 3 },
        { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } },
      ],
    }),
  ],
});

export const pestilentSaint = tertiary({
  id: 'pestilent-saint',
  name: 'Pestilent Saint',
  baseClassId: 'cultist',
  advancedClassId: 'plague-doctor',
  description: 'Blight on every enemy at once: the whole enemy party bleeds life into yours.',
  tags: ['occult', 'shadow'],
  ability: {
    id: 'great-plague',
    name: 'Great Plague',
    description: 'Every 3rd turn: every enemy gains 2 Blight; heal all allies for 50% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 2 },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Sainted Rot', description: 'Start of combat: every enemy gains 2 Blight.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [on('startOfCombat', 'Sainted Rot', [{ kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 2 }])],
  },
  talents: [
    talent('pestilent-saint/swarm-of-flies', 'Swarm of Flies', 'When hurt, 50% chance every enemy gains 1 Blight.', trig(
      on('onHurt', 'Swarm of Flies', [{ kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 1 }], { chance: 0.5 }),
    )),
    talent('pestilent-saint/holy-pestilence', 'Holy Pestilence', '+30% ability power.', { abilityPower: 0.3 }),
    talent('pestilent-saint/incense-of-decay', 'Incense of Decay', '+2 DEF, +10 HP.', { stats: { def: 2, hp: 10 } }),
    abilityTalent('pestilent-saint/plague-censer', {
      id: 'plague-censer',
      name: 'Plague Censer',
      description: 'Every 4th turn: every enemy loses 1 SPD and gains 1 Blight.',
      cooldown: 4,
      effects: [
        { kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } },
        { kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 1 },
      ],
    }),
  ],
});

export const rotMother = tertiary({
  id: 'rot-mother',
  name: 'Rot Mother',
  baseClassId: 'cultist',
  advancedClassId: 'plague-doctor',
  description: 'Smothers one enemy in Blight; every death feeds the party and spreads the rot.',
  tags: ['occult', 'shadow', 'nature'],
  ability: {
    id: 'brood-of-rot',
    name: 'Brood of Rot',
    description: 'Every 3rd turn: the nearest enemy gains 4 Blight; heal the most wounded ally for 150% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'nearest', status: BLIGHT, stacks: 4 },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1.5 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Cycle of Rot', description: 'When any enemy falls, heal all allies for 30% ATK and every enemy gains 1 Blight.' },
  modifier: {
    stats: { hp: 12, atk: 2, def: 1 },
    triggers: [
      on('onKill', 'Cycle of Rot', [
        { kind: 'heal', target: 'allAllies', amount: { atk: 0.3 } },
        { kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 1 },
      ]),
      on('onAllyKill', 'Cycle of Rot', [
        { kind: 'heal', target: 'allAllies', amount: { atk: 0.3 } },
        { kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 1 },
      ]),
    ],
  },
  talents: [
    talent('rot-mother/mothers-embrace', 'Mother’s Embrace', 'Start of combat: shield all allies for 60% ATK.', trig(
      on('startOfCombat', 'Mother’s Embrace', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } }]),
    )),
    talent('rot-mother/fecund-rot', 'Fecund Rot', 'Basic attacks give 1 more Blight.', trig(
      on('onAttack', 'Fecund Rot', [{ kind: 'status', target: 'triggerTarget', status: BLIGHT, stacks: 1 }]),
    )),
    talent('rot-mother/rotting-grasp', 'Rotting Grasp', 'Basic attacks make the target lose 1 SPD.', trig(
      on('onAttack', 'Rotting Grasp', [{ kind: 'debuff', target: 'triggerTarget', stat: 'spd', amount: { flat: 1 } }]),
    )),
    abilityTalent('rot-mother/corpse-bloom', {
      id: 'corpse-bloom',
      name: 'Corpse Bloom',
      description: 'Every 4th turn: heal all allies for 80% ATK.',
      cooldown: 4,
      effects: [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.8 } }],
    }),
  ],
});

export const CULTIST_TERTIARY = [sanguineBishop, vampireLord, pestilentSaint, rotMother];

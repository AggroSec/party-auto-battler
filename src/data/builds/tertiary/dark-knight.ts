// Dark Knight tertiary classes (level 7): Blackguard → Crimson Lord / Hellknight,
// Dreadknight → Tyrant / Revenant.
import { DREAD, HELLFIRE } from '../../statuses.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const crimsonLord = tertiary({
  id: 'crimson-lord',
  name: 'Crimson Lord',
  baseClassId: 'dark-knight',
  advancedClassId: 'blackguard',
  description: 'Lord of blood: huge lifesteal, and the lower it falls the harder it hits.',
  tags: ['martial', 'shadow'],
  ability: {
    id: 'sanguine-tide',
    name: 'Sanguine Tide',
    description: 'Every 3rd turn: pay 10% of max HP, deal 90% ATK + 25% of your missing HP to every enemy, and heal for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.9, missingHp: 0.25 } },
      { kind: 'heal', target: 'self', amount: { atk: 1 } },
    ],
  },
  passive: { name: 'Blood Sovereign', description: '+10% lifesteal. When bloodied, gain +4 ATK.' },
  modifier: {
    stats: { hp: 12, atk: 2 },
    lifesteal: 0.1,
    triggers: [on('onBloodied', 'Blood Sovereign', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } }])],
  },
  talents: [
    talent('crimson-lord/exsanguinate', 'Exsanguinate', 'On kill, heal 25% of max HP.', trig(
      on('onKill', 'Exsanguinate', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.25 } }]),
    )),
    talent('crimson-lord/crimson-fury', 'Crimson Fury', 'Basic attacks deal an extra 20% of your missing HP.', trig(
      on('onAttack', 'Crimson Fury', [{ kind: 'damage', target: 'triggerTarget', amount: { missingHp: 0.2 } }]),
    )),
    talent('crimson-lord/bloodbound', 'Bloodbound', '+3 ATK, +10 HP.', { stats: { atk: 3, hp: 10 } }),
    abilityTalent('crimson-lord/blood-nova', {
      id: 'blood-nova',
      name: 'Blood Nova',
      description: 'Every 4th turn: pay 10% of max HP and deal 50% of your missing HP to every enemy.',
      cooldown: 4,
      effects: [
        { kind: 'payHp', amount: { maxHp: 0.1 } },
        { kind: 'damage', target: 'allEnemies', amount: { missingHp: 0.5 } },
      ],
    }),
  ],
});

export const hellknight = tertiary({
  id: 'hellknight',
  name: 'Hellknight',
  baseClassId: 'dark-knight',
  advancedClassId: 'blackguard',
  description: 'Sworn to the pit: wreathed in Hellfire that burns everyone who strikes it.',
  tags: ['martial', 'shadow', 'occult'],
  ability: {
    id: 'hellfire-slash',
    name: 'Hellfire Slash',
    description: 'Every 3rd turn: deal 130% ATK to the nearest enemy, give it 3 Hellfire, and taunt for 1 turn.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.3 } },
      { kind: 'status', target: 'nearest', status: HELLFIRE, stacks: 3 },
      { kind: 'taunt', target: 'self', turns: 1 },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Infernal Aura', description: 'When hurt, 50% chance the attacker gains 1 Hellfire (20% ATK damage per stack each turn, up to 5, for 3 turns).' },
  modifier: {
    stats: { hp: 10, atk: 2, def: 1 },
    triggers: [on('onHurt', 'Infernal Aura', [{ kind: 'status', target: 'triggerSource', status: HELLFIRE, stacks: 1 }], { chance: 0.5 })],
  },
  talents: [
    talent('hellknight/pit-forged', 'Pit-Forged', '+3 DEF, +6 HP.', { stats: { def: 3, hp: 6 } }),
    talent('hellknight/pact-of-flame', 'Pact of Flame', 'Start of combat: every enemy gains 2 Hellfire.', trig(
      on('startOfCombat', 'Pact of Flame', [{ kind: 'status', target: 'allEnemies', status: HELLFIRE, stacks: 2 }]),
    )),
    talent('hellknight/burning-blood', 'Burning Blood', 'When bloodied, every enemy gains 3 Hellfire.', trig(
      on('onBloodied', 'Burning Blood', [{ kind: 'status', target: 'allEnemies', status: HELLFIRE, stacks: 3 }]),
    )),
    abilityTalent('hellknight/infernal-eruption', {
      id: 'infernal-eruption',
      name: 'Infernal Eruption',
      description: 'Every 4th turn: deal 60% ATK to every enemy and give each 1 Hellfire.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } },
        { kind: 'status', target: 'allEnemies', status: HELLFIRE, stacks: 1 },
      ],
    }),
  ],
});

export const tyrant = tertiary({
  id: 'tyrant',
  name: 'Tyrant',
  baseClassId: 'dark-knight',
  advancedClassId: 'dreadknight',
  description: 'Rules by fear: the whole enemy party fights at a fraction of its strength.',
  tags: ['martial', 'guardian', 'shadow'],
  ability: {
    id: 'reign-of-terror',
    name: 'Reign of Terror',
    description: 'Every 3rd turn: every enemy gains 1 Dread; taunt for 2 turns and shield yourself for 6 + 100% DEF.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'allEnemies', status: DREAD, stacks: 1 },
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'shield', target: 'self', amount: { flat: 6, def: 1 } },
    ],
  },
  statWeights: { hp: 5, atk: 1, def: 4, spd: 1 },
  passive: { name: 'Dominion', description: 'Start of combat: every enemy gains 1 Dread.' },
  modifier: {
    stats: { hp: 12, def: 2 },
    triggers: [on('startOfCombat', 'Dominion', [{ kind: 'status', target: 'allEnemies', status: DREAD, stacks: 1 }])],
  },
  talents: [
    talent('tyrant/tyranny', 'Tyranny', '+4 DEF, −1 SPD.', { stats: { def: 4, spd: -1 } }),
    talent('tyrant/subjugate', 'Subjugate', 'Basic attacks have a 50% chance to give the target 1 Dread.', trig(
      on('onAttack', 'Subjugate', [{ kind: 'status', target: 'triggerTarget', status: DREAD, stacks: 1 }], { chance: 0.5 }),
    )),
    talent('tyrant/oppression', 'Oppression', 'Start of combat: each enemy in the front row loses 2 SPD.', trig(
      on('startOfCombat', 'Oppression', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 2 } }]),
    )),
    abilityTalent('tyrant/dread-lash', {
      id: 'dread-lash',
      name: 'Dread Lash',
      description: 'Every 4th turn: deal 100% ATK + 100% DEF to the nearest enemy and give it 2 Dread.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 1, def: 1 } },
        { kind: 'status', target: 'nearest', status: DREAD, stacks: 2 },
      ],
    }),
  ],
});

export const revenant = tertiary({
  id: 'revenant',
  name: 'Revenant',
  baseClassId: 'dark-knight',
  advancedClassId: 'dreadknight',
  description: 'Refuses to stay dead: rises once more and fights on, still hitting harder the lower it is.',
  tags: ['martial', 'guardian', 'shadow'],
  ability: {
    id: 'grave-strike',
    name: 'Grave Strike',
    description: 'Every 3rd turn: pay 5% of max HP, deal 130% ATK + 30% of your missing HP to the nearest enemy, and heal for 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.05 } },
      { kind: 'damage', target: 'nearest', amount: { atk: 1.3, missingHp: 0.3 } },
      { kind: 'heal', target: 'self', amount: { atk: 0.6 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Undeath', description: 'The first time you would fall, rise at 30% HP; every enemy gains 1 Dread.' },
  modifier: {
    stats: { hp: 10, atk: 2 },
    revive: 0.3,
    triggers: [on('onRevive', 'Undeath', [{ kind: 'status', target: 'allEnemies', status: DREAD, stacks: 1 }])],
  },
  talents: [
    talent('revenant/second-grave', 'Second Grave', 'Rise one more time.', { revive: 0.25 }),
    talent('revenant/wrath-of-the-grave', 'Wrath of the Grave', 'After rising, gain +4 ATK and taunt for 1 turn.', trig(
      on('onRevive', 'Wrath of the Grave', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } },
        { kind: 'taunt', target: 'self', turns: 1 },
      ]),
    )),
    talent('revenant/cold-iron', 'Cold Iron', '+3 DEF, +10 HP.', { stats: { def: 3, hp: 10 } }),
    abilityTalent('revenant/grave-chill', {
      id: 'grave-chill',
      name: 'Grave Chill',
      description: 'Every 4th turn: every enemy loses 1 SPD and gains 1 Dread.',
      cooldown: 4,
      effects: [
        { kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } },
        { kind: 'status', target: 'allEnemies', status: DREAD, stacks: 1 },
      ],
    }),
  ],
});

export const DARK_KNIGHT_TERTIARY = [crimsonLord, hellknight, tyrant, revenant];

// Mage tertiary classes (level 7): Pyromancer → Firelord / Phoenix, Chronomancer → Chronarch / Entropist.
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const firelord = tertiary({
  id: 'firelord',
  name: 'Firelord',
  baseClassId: 'mage',
  advancedClassId: 'pyromancer',
  description: 'Master of flame: rains fire on the whole enemy side.',
  tags: ['arcane'],
  ability: {
    id: 'firestorm',
    name: 'Firestorm',
    description: 'Every 2nd turn: deal 160% ATK to each enemy in the front row and 60% ATK to every enemy.',
    cooldown: 2,
    effects: [
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.6 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } },
    ],
  },
  passive: { name: 'Wildfire', description: 'On kill, deal 100% ATK to every enemy.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [on('onKill', 'Wildfire', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 1 } }])],
  },
  talents: [
    talent('firelord/searing-heat', 'Searing Heat', '+35% ability power.', { abilityPower: 0.35 }),
    talent('firelord/melt', 'Melt', 'After casting, every enemy loses 1 DEF.', trig(
      on('onAbility', 'Melt', [{ kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('firelord/ember-shield', 'Ember Shield', 'Start of combat: shield yourself for 200% ATK.', trig(
      on('startOfCombat', 'Ember Shield', [{ kind: 'shield', target: 'self', amount: { atk: 2 } }]),
    )),
    abilityTalent('firelord/pyroblast', {
      id: 'pyroblast',
      name: 'Pyroblast',
      description: 'Every 4th turn: deal 350% ATK to the strongest enemy (50% splash).',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 3.5 }, splash: 0.5 }],
    }),
  ],
});

export const phoenix = tertiary({
  id: 'phoenix',
  name: 'Phoenix',
  baseClassId: 'mage',
  advancedClassId: 'pyromancer',
  description: 'Burns bright and rises again: fire that heals allies and won’t stay down.',
  tags: ['arcane', 'divine'],
  ability: {
    id: 'phoenix-flame',
    name: 'Phoenix Flame',
    description: 'Every 2nd turn: deal 120% ATK to each enemy in the front row and heal the most wounded ally for 120% ATK.',
    cooldown: 2,
    effects: [
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.2 } },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1.2 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 1 },
  passive: { name: 'Rebirth', description: 'When bloodied, heal 45% of max HP.' },
  modifier: {
    stats: { hp: 14, atk: 2 },
    triggers: [on('onBloodied', 'Rebirth', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.45 } }])],
  },
  talents: [
    talent('phoenix/radiance', 'Radiance', '+30% ability power, +8 HP.', { abilityPower: 0.3, stats: { hp: 8 } }),
    talent('phoenix/cinders', 'Cinders', 'When hurt, deal 30% ATK to the attacker.', trig(
      on('onHurt', 'Cinders', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.3 } }]),
    )),
    talent('phoenix/warmth', 'Warmth', 'At the start of each of your turns, all allies heal 2.', trig(
      on('onTurnStart', 'Warmth', [{ kind: 'heal', target: 'allAllies', amount: { flat: 2 } }]),
    )),
    abilityTalent('phoenix/flame-ward', {
      id: 'flame-ward',
      name: 'Flame Ward',
      description: 'Every 4th turn: shield all allies for 100% ATK.',
      cooldown: 4,
      effects: [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }],
    }),
  ],
});

export const chronarch = tertiary({
  id: 'chronarch',
  name: 'Chronarch',
  baseClassId: 'mage',
  advancedClassId: 'chronomancer',
  description: 'Lord of time: the party acts faster and casts more.',
  tags: ['arcane'],
  ability: {
    id: 'time-dilation',
    name: 'Time Dilation',
    description: 'Every 2nd turn: other allies’ abilities come 1 turn sooner (but not sooner than 2 turns away); deal 170% ATK to the nearest enemy.',
    cooldown: 2,
    effects: [
      { kind: 'cooldown', target: 'otherAllies', turns: -1, min: 2 },
      { kind: 'damage', target: 'nearest', amount: { atk: 1.7 } },
    ],
  },
  passive: { name: 'Quickening', description: 'Start of combat: all allies gain +1 SPD.' },
  modifier: {
    stats: { hp: 8, spd: 2, atk: 1 },
    triggers: [on('startOfCombat', 'Quickening', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }])],
  },
  talents: [
    talent('chronarch/foresight', 'Foresight', 'Start of combat: shield all allies for 100% ATK.', trig(
      on('startOfCombat', 'Foresight', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    talent('chronarch/flux', 'Flux', '+3 SPD, +6 HP.', { stats: { spd: 3, hp: 6 } }),
    talent('chronarch/loop', 'Time Loop', 'The first time you drop below 50% HP, heal 50% of max HP.', trig(
      on('onBloodied', 'Time Loop', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.5 } }]),
    )),
    abilityTalent('chronarch/stasis', {
      id: 'stasis',
      name: 'Stasis',
      description: 'Every 4th turn: every enemy’s ability comes 1 turn later and the strongest enemy loses 2 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'cooldown', target: 'allEnemies', turns: 1 },
        { kind: 'debuff', target: 'highestAtk', stat: 'spd', amount: { flat: 2 } },
      ],
    }),
  ],
});

export const entropist = tertiary({
  id: 'entropist',
  name: 'Entropist',
  baseClassId: 'mage',
  advancedClassId: 'chronomancer',
  description: 'Decay made manifest: enemies slow down, weaken and crumble.',
  tags: ['arcane', 'occult'],
  ability: {
    id: 'entropy',
    name: 'Entropy',
    description: 'Every 3rd turn: every enemy loses 1 SPD and takes 80% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
    ],
  },
  statWeights: { hp: 2, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Rust', description: 'Start of combat: every enemy loses 1 DEF.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [on('startOfCombat', 'Rust', [{ kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } }])],
  },
  talents: [
    talent('entropist/collapse', 'Collapse', '+35% ability power.', { abilityPower: 0.35 }),
    talent('entropist/wither', 'Wither', 'After casting, the strongest enemy loses 2 ATK.', trig(
      on('onAbility', 'Wither', [{ kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 2 } }]),
    )),
    talent('entropist/null-field', 'Null Field', 'Start of combat: every enemy’s first ability comes 1 turn later.', trig(
      on('startOfCombat', 'Null Field', [{ kind: 'cooldown', target: 'allEnemies', turns: 1 }]),
    )),
    abilityTalent('entropist/unravel', {
      id: 'unravel',
      name: 'Unravel',
      description: 'Every 4th turn: deal 250% ATK piercing to the nearest enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 2.5 }, pierce: true }],
    }),
  ],
});

export const MAGE_TERTIARY = [firelord, phoenix, chronarch, entropist];

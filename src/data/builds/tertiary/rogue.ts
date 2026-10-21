// Rogue tertiary classes (level 7): Assassin → Nightblade / Shadowdancer, Duelist → Swordmaster / Swashbuckler.
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const nightblade = tertiary({
  id: 'nightblade',
  name: 'Nightblade',
  baseClassId: 'rogue',
  advancedClassId: 'assassin',
  description: 'Executioner: picks off the weakest enemy, then the next.',
  tags: ['shadow'],
  ability: {
    id: 'death-mark',
    name: 'Death Mark',
    description: 'Every 3rd turn: deal 260% ATK to the weakest enemy, then 100% ATK to whichever enemy is weakest after that.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'lowestHp', amount: { atk: 2.6 } },
      { kind: 'damage', target: 'lowestHp', amount: { atk: 1 } },
    ],
  },
  passive: { name: 'Shadow Step', description: 'On kill, your next ability comes 1 turn sooner and you gain +1 SPD.' },
  modifier: {
    stats: { hp: 8, atk: 3, spd: 1 },
    triggers: [
      on('onKill', 'Shadow Step', [
        { kind: 'cooldown', target: 'self', turns: -1 },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('nightblade/cruelty', 'Cruelty', '+35% ability power.', { abilityPower: 0.35 }),
    talent('nightblade/nightfall', 'Nightfall', 'Start of combat: every enemy loses 1 DEF.', trig(
      on('startOfCombat', 'Nightfall', [{ kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('nightblade/cloak', 'Cloak of Shadows', 'When bloodied, shield yourself for 50% of max HP.', trig(
      on('onBloodied', 'Cloak of Shadows', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.5 } }]),
    )),
    abilityTalent('nightblade/fan-of-knives', {
      id: 'fan-of-knives',
      name: 'Fan of Knives',
      description: 'Every 4th turn: deal 70% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }],
    }),
  ],
});

export const shadowdancer = tertiary({
  id: 'shadowdancer',
  name: 'Shadowdancer',
  baseClassId: 'rogue',
  advancedClassId: 'assassin',
  description: 'Never stands still: strikes the back row again and again and slips away.',
  tags: ['shadow', 'spirit'],
  ability: {
    id: 'shadow-dance',
    name: 'Shadow Dance',
    description: 'Every 3rd turn: strike the weakest back-row enemy 3 times for 120% ATK, then shield yourself for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'backlineFirst', amount: { atk: 1.2 }, hits: 3 },
      { kind: 'shield', target: 'self', amount: { atk: 1 } },
    ],
  },
  statWeights: { hp: 2, atk: 3, def: 1, spd: 5 },
  passive: { name: 'Evasive', description: '25% when hurt: shield yourself for 6.' },
  modifier: {
    stats: { hp: 8, atk: 2, spd: 3 },
    triggers: [on('onHurt', 'Evasive', [{ kind: 'shield', target: 'self', amount: { flat: 6 } }], { chance: 0.25 })],
  },
  talents: [
    talent('shadowdancer/quickstep', 'Quickstep', '+3 SPD.', { stats: { spd: 3 } }),
    talent('shadowdancer/twin-fangs', 'Twin Fangs', '30% on attack: strike the weakest back-row enemy for 80% ATK.', trig(
      on('onAttack', 'Twin Fangs', [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 0.8 } }], { chance: 0.3 }),
    )),
    talent('shadowdancer/vanishing-act', 'Vanishing Act', 'On kill, shield yourself for 30% of max HP.', trig(
      on('onKill', 'Vanishing Act', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    abilityTalent('shadowdancer/blind', {
      id: 'blind',
      name: 'Blind',
      description: 'Every 4th turn: the strongest enemy loses 3 ATK and its ability comes 1 turn later.',
      cooldown: 4,
      effects: [
        { kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 3 } },
        { kind: 'cooldown', target: 'highestAtk', turns: 1 },
      ],
    }),
  ],
});

export const swordmaster = tertiary({
  id: 'swordmaster',
  name: 'Swordmaster',
  baseClassId: 'rogue',
  advancedClassId: 'duelist',
  description: 'Peerless blade: a storm of strikes and a counter for every blow.',
  tags: ['martial'],
  ability: {
    id: 'blade-storm',
    name: 'Blade Storm',
    description: 'Every 3rd turn: strike the nearest enemy 5 times for 70% ATK each.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 0.7 }, hits: 5 }],
  },
  passive: { name: 'Perfect Parry', description: 'Reach: full damage from the back row. 45% when hurt: strike the attacker for 100% ATK.' },
  modifier: {
    stats: { hp: 10, def: 2, atk: 2 },
    reach: true,
    triggers: [on('onHurt', 'Perfect Parry', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 1 } }], { chance: 0.45 })],
  },
  talents: [
    talent('swordmaster/keen-edge', 'Keen Edge', '+3 ATK.', { stats: { atk: 3 } }),
    talent('swordmaster/iron-wrist', 'Iron Wrist', '+3 DEF, +8 HP.', { stats: { def: 3, hp: 8 } }),
    talent('swordmaster/momentum', 'Flowing Blade', 'Each basic attack gives +1 ATK (up to 5 times per fight).', trig(
      on('onAttack', 'Flowing Blade', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 1 } }], { limit: 5 }),
    )),
    abilityTalent('swordmaster/challenge', {
      id: 'duel',
      name: 'Duel',
      description: 'Every 4th turn: taunt for 1 turn and shield yourself for 100% DEF + 6.',
      cooldown: 4,
      effects: [
        { kind: 'taunt', target: 'self', turns: 1 },
        { kind: 'shield', target: 'self', amount: { flat: 6, def: 1 } },
      ],
    }),
  ],
});

export const swashbuckler = tertiary({
  id: 'swashbuckler',
  name: 'Swashbuckler',
  baseClassId: 'rogue',
  advancedClassId: 'duelist',
  description: 'Flashy and fast: dirty tricks that leave the enemy reeling.',
  tags: ['martial', 'shadow'],
  ability: {
    id: 'dirty-tricks',
    name: 'Dirty Tricks',
    description: 'Every 3rd turn: strike the nearest enemy 3 times for 90% ATK; it loses 2 SPD and 1 DEF.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 0.9 }, hits: 3 },
      { kind: 'debuff', target: 'nearest', stat: 'spd', amount: { flat: 2 } },
      { kind: 'debuff', target: 'nearest', stat: 'def', amount: { flat: 1 } },
    ],
  },
  statWeights: { hp: 2, atk: 4, def: 1, spd: 4 },
  passive: { name: 'Bravado', description: 'Reach: full damage from the back row. On kill, gain +2 ATK and +1 SPD.' },
  modifier: {
    stats: { hp: 8, atk: 2, spd: 2 },
    reach: true,
    triggers: [
      on('onKill', 'Bravado', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('swashbuckler/panache', 'Panache', '+30% ability power, +1 SPD.', { abilityPower: 0.3, stats: { spd: 1 } }),
    talent('swashbuckler/taunting-grin', 'Taunting Grin', 'Start of combat: the enemy front row loses 1 SPD.', trig(
      on('startOfCombat', 'Taunting Grin', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('swashbuckler/lucky-break', 'Lucky Break', 'When bloodied, heal 30% of max HP.', trig(
      on('onBloodied', 'Lucky Break', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    abilityTalent('swashbuckler/pistol-shot', {
      id: 'pistol-shot',
      name: 'Pistol Shot',
      description: 'Every 4th turn: deal 200% ATK piercing to the strongest enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 2 }, pierce: true }],
    }),
  ],
});

export const ROGUE_TERTIARY = [nightblade, shadowdancer, swordmaster, swashbuckler];

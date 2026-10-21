// Ranger tertiary classes (level 7): Sharpshooter → Deadeye / Trapper, Beastmaster → Packlord / Falconer.
import type { SummonDef } from '../../../engine/types.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const deadeye = tertiary({
  id: 'deadeye',
  name: 'Deadeye',
  baseClassId: 'ranger',
  advancedClassId: 'sharpshooter',
  description: 'One shot, one kill: devastating shots at the most dangerous enemy.',
  tags: ['martial'],
  ability: {
    id: 'headshot',
    name: 'Headshot',
    description: 'Every 3rd turn: deal 320% ATK piercing to the strongest enemy.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 3.2 }, pierce: true }],
  },
  passive: { name: 'Lethal Aim', description: 'On kill, your next ability comes 2 turns sooner and you gain +2 ATK.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [
      on('onKill', 'Lethal Aim', [
        { kind: 'cooldown', target: 'self', turns: -2 },
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
      ]),
    ],
  },
  talents: [
    talent('deadeye/scope', 'Scope', '+35% ability power.', { abilityPower: 0.35 }),
    talent('deadeye/double-tap', 'Double Tap', '30% on attack: shoot the target again for 100% ATK.', trig(
      on('onAttack', 'Double Tap', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 1 } }], { chance: 0.3 }),
    )),
    talent('deadeye/sniper-nest', 'Sniper’s Nest', 'Start of combat: shield yourself for 200% ATK.', trig(
      on('startOfCombat', 'Sniper’s Nest', [{ kind: 'shield', target: 'self', amount: { atk: 2 } }]),
    )),
    abilityTalent('deadeye/volley', {
      id: 'volley',
      name: 'Volley',
      description: 'Every 4th turn: deal 80% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } }],
    }),
  ],
});

export const trapper = tertiary({
  id: 'trapper',
  name: 'Trapper',
  baseClassId: 'ranger',
  advancedClassId: 'sharpshooter',
  description: 'Lays snares that slow, weaken and bleed the enemy front line.',
  tags: ['martial', 'wild'],
  ability: {
    id: 'snare-trap',
    name: 'Snare Trap',
    description: 'Every 3rd turn: deal 120% ATK to each enemy in the front row; they lose 2 SPD.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.2 } },
      { kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 2 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 3 },
  passive: { name: 'Caltrops', description: 'Start of combat: the enemy front row loses 2 SPD.' },
  modifier: {
    stats: { hp: 10, atk: 2, spd: 1 },
    triggers: [on('startOfCombat', 'Caltrops', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 2 } }])],
  },
  talents: [
    talent('trapper/barbed-wire', 'Barbed Wire', 'After casting, the enemy front row loses 1 DEF.', trig(
      on('onAbility', 'Barbed Wire', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('trapper/camouflage-net', 'Camouflage Net', 'Start of combat: shield all allies for 6.', trig(
      on('startOfCombat', 'Camouflage Net', [{ kind: 'shield', target: 'allAllies', amount: { flat: 6 } }]),
    )),
    talent('trapper/bear-trap', 'Bear Trap', '+30% ability power, +2 ATK.', { abilityPower: 0.3, stats: { atk: 2 } }),
    abilityTalent('trapper/net-throw', {
      id: 'net-throw',
      name: 'Net Throw',
      description: 'Every 4th turn: the strongest enemy’s ability comes 2 turns later and it loses 2 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'cooldown', target: 'highestAtk', turns: 2 },
        { kind: 'debuff', target: 'highestAtk', stat: 'spd', amount: { flat: 2 } },
      ],
    }),
  ],
});

const wolf: SummonDef = {
  name: 'Wolf',
  classId: 'wolf',
  hp: { maxHp: 0.6 },
  atk: { atk: 0.8 },
  def: 1,
  spd: 13,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

export const packlord = tertiary({
  id: 'packlord',
  name: 'Packlord',
  baseClassId: 'ranger',
  advancedClassId: 'beastmaster',
  description: 'Leads a real pack: wolves join the fight in empty slots.',
  tags: ['wild'],
  ability: {
    id: 'howl',
    name: 'Howl',
    description: 'Every 3rd turn (first on turn 1): summon a Wolf in an empty slot (60% of your max HP, 80% ATK). If the board is full, five strikes at random enemies for 70% ATK each instead.',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: wolf,
        fallback: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.7 }, hits: 5 }],
      },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 1, spd: 2 },
  passive: { name: 'Pack Tactics', description: 'Start of combat: all allies gain +1 ATK and +1 SPD.' },
  modifier: {
    stats: { hp: 12, atk: 2 },
    triggers: [
      on('startOfCombat', 'Pack Tactics', [
        { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('packlord/dire-wolves', 'Dire Wolves', '+40% ability power (stronger wolves).', { abilityPower: 0.4 }),
    talent('packlord/blood-scent', 'Blood Scent', 'When an ally dies, all allies gain +1 ATK.', trig(
      on('onAllyDeath', 'Blood Scent', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('packlord/thick-fur', 'Thick Fur', '+12 HP, +2 DEF.', { stats: { hp: 12, def: 2 } }),
    abilityTalent('packlord/rabid-bite', {
      id: 'rabid-bite',
      name: 'Rabid Bite',
      description: 'Every 4th turn: deal 200% ATK to the nearest enemy; it loses 2 DEF.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 2 } },
        { kind: 'debuff', target: 'nearest', stat: 'def', amount: { flat: 2 } },
      ],
    }),
  ],
});

export const falconer = tertiary({
  id: 'falconer',
  name: 'Falconer',
  baseClassId: 'ranger',
  advancedClassId: 'beastmaster',
  description: 'A hunting falcon dives on the back row again and again.',
  tags: ['wild', 'martial'],
  ability: {
    id: 'falcon-dive',
    name: 'Falcon Dive',
    description: 'Every 3rd turn: the falcon strikes the weakest back-row enemy 4 times for 80% ATK each.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 0.8 }, hits: 4 }],
  },
  passive: { name: 'Keen Talons', description: '30% on attack: the falcon strikes a random enemy for 60% ATK.' },
  modifier: {
    stats: { hp: 8, atk: 2, spd: 2 },
    triggers: [on('onAttack', 'Keen Talons', [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.6 } }], { chance: 0.3 })],
  },
  talents: [
    talent('falconer/swift-wings', 'Swift Wings', '+3 SPD.', { stats: { spd: 3 } }),
    talent('falconer/eye-of-the-hawk', 'Eye of the Hawk', '+30% ability power.', { abilityPower: 0.3 }),
    talent('falconer/harass', 'Harass', 'After casting, the strongest enemy loses 1 SPD.', trig(
      on('onAbility', 'Harass', [{ kind: 'debuff', target: 'highestAtk', stat: 'spd', amount: { flat: 1 } }]),
    )),
    abilityTalent('falconer/screech', {
      id: 'screech',
      name: 'Screech',
      description: 'Every 4th turn: every enemy loses 1 ATK and its ability comes 1 turn later.',
      cooldown: 4,
      effects: [
        { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'cooldown', target: 'allEnemies', turns: 1 },
      ],
    }),
  ],
});

export const RANGER_TERTIARY = [deadeye, trapper, packlord, falconer];

// Warrior tertiary classes (level 7): Knight → Paladin / Vanguard, Berserker → Warlord / Bloodreaver.
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const paladin = tertiary({
  id: 'paladin',
  name: 'Paladin',
  baseClassId: 'warrior',
  advancedClassId: 'knight',
  description: 'Holy champion: shields and heals the whole party while holding the line.',
  tags: ['martial', 'guardian', 'divine'],
  ability: {
    id: 'divine-bulwark',
    name: 'Divine Bulwark',
    description: 'Every 3rd turn: shield all allies for 4 + 70% DEF, heal them for 60% ATK, and taunt for 1 turn.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'allAllies', amount: { flat: 4, def: 0.7 } },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.6 } },
      { kind: 'taunt', target: 'self', turns: 1 },
    ],
  },
  passive: { name: 'Devotion Aura', description: 'Start of combat: all allies gain +1 DEF.' },
  modifier: {
    stats: { hp: 12, def: 2, atk: 1 },
    triggers: [on('startOfCombat', 'Devotion Aura', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }])],
  },
  talents: [
    talent('paladin/consecration', 'Consecration', '+30% ability power.', { abilityPower: 0.3 }),
    talent('paladin/martyrdom', 'Martyrdom', 'When an ally dies, shield all allies for 6.', trig(
      on('onAllyDeath', 'Martyrdom', [{ kind: 'shield', target: 'allAllies', amount: { flat: 6 } }]),
    )),
    talent('paladin/blessed-steel', 'Blessed Steel', '+2 DEF, +12 HP.', { stats: { def: 2, hp: 12 } }),
    abilityTalent('paladin/lay-on-hands', {
      id: 'lay-on-hands',
      name: 'Lay on Hands',
      description: 'Every 4th turn: heal the most wounded ally for 35% of your max HP.',
      cooldown: 4,
      effects: [{ kind: 'heal', target: 'lowestHpAlly', amount: { maxHp: 0.35 } }],
    }),
  ],
});

export const vanguard = tertiary({
  id: 'vanguard',
  name: 'Vanguard',
  baseClassId: 'warrior',
  advancedClassId: 'knight',
  description: 'Unbreakable wall that punishes everyone who swings at it.',
  tags: ['martial', 'guardian'],
  ability: {
    id: 'hold-the-line',
    name: 'Hold the Line',
    description: 'Every 3rd turn: shield yourself for 6 + 150% DEF, taunt for 2 turns, and the enemy front row loses 1 ATK.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'self', amount: { flat: 6, def: 1.5 } },
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } },
    ],
  },
  statWeights: { hp: 5, atk: 1, def: 4, spd: 1 },
  passive: { name: 'Spiked Guard', description: 'When hurt, deal 40% DEF piercing damage to the attacker.' },
  modifier: {
    stats: { hp: 16, def: 3 },
    triggers: [on('onHurt', 'Spiked Guard', [{ kind: 'damage', target: 'triggerSource', amount: { def: 0.4 }, pierce: true }])],
  },
  talents: [
    talent('vanguard/bulwark', 'Bulwark', '+4 DEF, −1 SPD.', { stats: { def: 4, spd: -1 } }),
    talent('vanguard/last-stand', 'Last Stand', 'When bloodied, shield yourself for 40% of max HP.', trig(
      on('onBloodied', 'Last Stand', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.4 } }]),
    )),
    talent('vanguard/provoke', 'Provoke', 'Start of combat: taunt for 2 turns and shield yourself for 10.', trig(
      on('startOfCombat', 'Provoke', [
        { kind: 'taunt', target: 'self', turns: 2 },
        { kind: 'shield', target: 'self', amount: { flat: 10 } },
      ]),
    )),
    abilityTalent('vanguard/shield-slam', {
      id: 'shield-slam',
      name: 'Shield Slam',
      description: 'Every 4th turn: deal 100% ATK + 100% DEF to the nearest enemy, which loses 1 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 1, def: 1 } },
        { kind: 'debuff', target: 'nearest', stat: 'spd', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const warlord = tertiary({
  id: 'warlord',
  name: 'Warlord',
  baseClassId: 'warrior',
  advancedClassId: 'berserker',
  description: 'Battle-hardened leader whose fury spreads to the whole party.',
  tags: ['martial'],
  ability: {
    id: 'rallying-whirlwind',
    name: 'Rallying Whirlwind',
    description: 'Every 3rd turn: deal 100% ATK to every enemy, then all allies gain +1 ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 1 } },
      { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
    ],
  },
  passive: { name: 'Warcry', description: '+10% lifesteal. Start of combat: all allies gain +1 SPD.' },
  modifier: {
    stats: { hp: 12, atk: 3 },
    lifesteal: 0.1,
    triggers: [on('startOfCombat', 'Warcry', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }])],
  },
  talents: [
    talent('warlord/command', 'Command', 'When an ally dies, all allies gain +2 ATK.', trig(
      on('onAllyDeath', 'Command', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } }]),
    )),
    talent('warlord/veteran', 'Veteran', '+3 ATK, +2 DEF.', { stats: { atk: 3, def: 2 } }),
    talent('warlord/press-the-attack', 'Press the Attack', 'On kill, your next ability comes 1 turn sooner.', trig(
      on('onKill', 'Press the Attack', [{ kind: 'cooldown', target: 'self', turns: -1 }]),
    )),
    abilityTalent('warlord/battle-standard', {
      id: 'battle-standard',
      name: 'Battle Standard',
      description: 'Every 5th turn: shield all allies for 100% ATK and they gain +1 DEF.',
      cooldown: 5,
      effects: [
        { kind: 'shield', target: 'allAllies', amount: { atk: 1 } },
        { kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const bloodreaver = tertiary({
  id: 'bloodreaver',
  name: 'Bloodreaver',
  baseClassId: 'warrior',
  advancedClassId: 'berserker',
  description: 'Feeds on carnage: the more blood spilled, the harder to kill.',
  tags: ['martial', 'occult'],
  ability: {
    id: 'blood-storm',
    name: 'Blood Storm',
    description: 'Every 3rd turn: deal 110% ATK to every enemy, then heal yourself for 150% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 1.1 } },
      { kind: 'heal', target: 'self', amount: { atk: 1.5 } },
    ],
  },
  statWeights: { hp: 4, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Bloodbath', description: '+20% lifesteal. On kill, gain +3 ATK.' },
  modifier: {
    stats: { hp: 14, atk: 2 },
    lifesteal: 0.2,
    triggers: [on('onKill', 'Bloodbath', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } }])],
  },
  talents: [
    talent('bloodreaver/hemorrhage', 'Hemorrhage', '25% on attack: strike again for 70% ATK.', trig(
      on('onAttack', 'Hemorrhage', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.7 } }], { chance: 0.25 }),
    )),
    talent('bloodreaver/undying-rage', 'Undying Rage', 'When bloodied, heal 30% of max HP and gain +2 SPD.', trig(
      on('onBloodied', 'Undying Rage', [
        { kind: 'heal', target: 'self', amount: { maxHp: 0.3 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 2 } },
      ]),
    )),
    talent('bloodreaver/thirst', 'Thirst', '+15% lifesteal, +2 ATK.', { lifesteal: 0.15, stats: { atk: 2 } }),
    abilityTalent('bloodreaver/crimson-rite', {
      id: 'crimson-rite',
      name: 'Crimson Rite',
      description: 'Every 4th turn: lose 10% of your max HP, then deal 220% ATK to the weakest enemy.',
      cooldown: 4,
      effects: [
        { kind: 'payHp', amount: { maxHp: 0.1 } },
        { kind: 'damage', target: 'lowestHp', amount: { atk: 2.2 } },
      ],
    }),
  ],
});

export const WARRIOR_TERTIARY = [paladin, vanguard, warlord, bloodreaver];

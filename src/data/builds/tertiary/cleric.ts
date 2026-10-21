// Cleric tertiary classes (level 7): Priest → High Priest / Oracle, Inquisitor → Templar / Zealot.
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const highPriest = tertiary({
  id: 'high-priest',
  name: 'High Priest',
  baseClassId: 'cleric',
  advancedClassId: 'priest',
  description: 'The party’s lifeline: great waves of healing and protection.',
  tags: ['divine'],
  ability: {
    id: 'sacred-hymn',
    name: 'Sacred Hymn',
    description: 'Every 3rd turn: heal all allies for 220% ATK and shield them for 80% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'heal', target: 'allAllies', amount: { atk: 2.2 } },
      { kind: 'shield', target: 'allAllies', amount: { atk: 0.8 } },
    ],
  },
  passive: { name: 'Benediction', description: 'At the start of each of your turns, heal the most wounded ally for 100% ATK.' },
  modifier: {
    stats: { hp: 10, atk: 2 },
    triggers: [on('onTurnStart', 'Benediction', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } }])],
  },
  talents: [
    talent('high-priest/sanctity', 'Sanctity', '+35% ability power.', { abilityPower: 0.35 }),
    talent('high-priest/resolve', 'Resolve', 'Start of combat: all allies gain +1 DEF.', trig(
      on('startOfCombat', 'Resolve', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('high-priest/miracle', 'Miracle', 'When an ally dies, heal all allies for 150% ATK.', trig(
      on('onAllyDeath', 'Miracle', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1.5 } }]),
    )),
    abilityTalent('high-priest/holy-fire', {
      id: 'holy-fire',
      name: 'Holy Fire',
      description: 'Every 4th turn: deal 200% ATK piercing to the strongest enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 2 }, pierce: true }],
    }),
  ],
});

export const oracle = tertiary({
  id: 'oracle',
  name: 'Oracle',
  baseClassId: 'cleric',
  advancedClassId: 'priest',
  description: 'Sees blows before they land: heavy shields and well-timed warnings.',
  tags: ['divine', 'arcane'],
  ability: {
    id: 'prophecy',
    name: 'Prophecy',
    description: 'Every 3rd turn: shield all allies for 110% ATK and heal them for 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'allAllies', amount: { atk: 1.1 } },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.6 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 2, spd: 2 },
  passive: { name: 'Forewarning', description: 'Start of combat: shield all allies for 100% ATK.' },
  modifier: {
    stats: { hp: 10, atk: 1, spd: 1 },
    triggers: [on('startOfCombat', 'Forewarning', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }])],
  },
  talents: [
    talent('oracle/clarity', 'Clarity', '+30% ability power, +1 SPD.', { abilityPower: 0.3, stats: { spd: 1 } }),
    talent('oracle/omen', 'Omen', 'Start of combat: every enemy’s first ability comes 1 turn later.', trig(
      on('startOfCombat', 'Omen', [{ kind: 'cooldown', target: 'allEnemies', turns: 1 }]),
    )),
    talent('oracle/fate-ward', 'Fate Ward', 'When an ally dies, shield all allies for 200% ATK.', trig(
      on('onAllyDeath', 'Fate Ward', [{ kind: 'shield', target: 'allAllies', amount: { atk: 2 } }]),
    )),
    abilityTalent('oracle/vision', {
      id: 'vision',
      name: 'Vision',
      description: 'Every 4th turn: other allies’ abilities come 1 turn sooner (but not sooner than 2 turns away).',
      cooldown: 4,
      effects: [{ kind: 'cooldown', target: 'otherAllies', turns: -1, min: 2 }],
    }),
  ],
});

export const templar = tertiary({
  id: 'templar',
  name: 'Templar',
  baseClassId: 'cleric',
  advancedClassId: 'inquisitor',
  description: 'Holy warrior: judges the strongest foe and shields the party with each verdict.',
  tags: ['divine', 'martial', 'guardian'],
  ability: {
    id: 'verdict',
    name: 'Verdict',
    description: 'Every 3rd turn: deal 200% ATK piercing to the strongest enemy, heal yourself for 100% ATK and shield all allies for 50% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'highestAtk', amount: { atk: 2 }, pierce: true },
      { kind: 'heal', target: 'self', amount: { atk: 1 } },
      { kind: 'shield', target: 'allAllies', amount: { atk: 0.5 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 3, spd: 1 },
  passive: { name: 'Sworn Shield', description: '20% when hurt: taunt for 1 turn and shield yourself for 6.' },
  modifier: {
    stats: { hp: 14, def: 2, atk: 1 },
    triggers: [
      on('onHurt', 'Sworn Shield', [
        { kind: 'taunt', target: 'self', turns: 1 },
        { kind: 'shield', target: 'self', amount: { flat: 6 } },
      ], { chance: 0.2 }),
    ],
  },
  talents: [
    talent('templar/crusade', 'Crusade', '+3 ATK, +2 DEF.', { stats: { atk: 3, def: 2 } }),
    talent('templar/aura', 'Aura of Valor', 'Start of combat: all allies gain +1 ATK and +1 DEF.', trig(
      on('startOfCombat', 'Aura of Valor', [
        { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } },
      ]),
    )),
    talent('templar/penance', 'Penance', 'After casting, the strongest enemy loses 1 ATK.', trig(
      on('onAbility', 'Penance', [{ kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 1 } }]),
    )),
    abilityTalent('templar/consecrate', {
      id: 'consecrate',
      name: 'Consecrate',
      description: 'Every 4th turn: deal 100% ATK to each enemy in the front row and heal all allies for 60% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1 } },
        { kind: 'heal', target: 'allAllies', amount: { atk: 0.6 } },
      ],
    }),
  ],
});

export const zealot = tertiary({
  id: 'zealot',
  name: 'Zealot',
  baseClassId: 'cleric',
  advancedClassId: 'inquisitor',
  description: 'Fervour without limit: every verdict makes the next one harsher.',
  tags: ['divine', 'martial'],
  ability: {
    id: 'righteous-wrath',
    name: 'Righteous Wrath',
    description: 'Every 3rd turn: deal 240% ATK piercing to the strongest enemy, heal yourself for 100% ATK and gain +2 ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'highestAtk', amount: { atk: 2.4 }, pierce: true },
      { kind: 'heal', target: 'self', amount: { atk: 1 } },
      { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
    ],
  },
  passive: { name: 'Fanaticism', description: 'On kill, heal 25% of max HP and gain +1 SPD.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [
      on('onKill', 'Fanaticism', [
        { kind: 'heal', target: 'self', amount: { maxHp: 0.25 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('zealot/fervor', 'Fervor', '+30% ability power.', { abilityPower: 0.3 }),
    talent('zealot/scourge', 'Scourge', '25% on attack: deal 80% ATK piercing to the target.', trig(
      on('onAttack', 'Scourge', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.8 }, pierce: true }], { chance: 0.25 }),
    )),
    talent('zealot/unyielding', 'Unyielding Faith', 'When bloodied, heal 30% of max HP and gain +3 ATK.', trig(
      on('onBloodied', 'Unyielding Faith', [
        { kind: 'heal', target: 'self', amount: { maxHp: 0.3 } },
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } },
      ]),
    )),
    abilityTalent('zealot/excommunicate', {
      id: 'excommunicate',
      name: 'Excommunicate',
      description: 'Every 4th turn: the strongest enemy loses 2 DEF and 1 ATK, then takes 120% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'debuff', target: 'highestAtk', stat: 'def', amount: { flat: 2 } },
        { kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 1 } },
        { kind: 'damage', target: 'highestAtk', amount: { atk: 1.2 } },
      ],
    }),
  ],
});

export const CLERIC_TERTIARY = [highPriest, oracle, templar, zealot];

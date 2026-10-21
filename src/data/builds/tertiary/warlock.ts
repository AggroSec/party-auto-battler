// Warlock tertiary classes (level 7): Hexer → Doombringer / Curseweaver, Demonologist → Pit Lord / Soulbinder.
import type { SummonDef } from '../../../engine/types.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const doombringer = tertiary({
  id: 'doombringer',
  name: 'Doombringer',
  baseClassId: 'warlock',
  advancedClassId: 'hexer',
  description: 'Pays in blood for overwhelming dark power.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'doom',
    name: 'Doom',
    description: 'Every 3rd turn: lose 8% of your max HP, then every enemy loses 1 DEF and takes 140% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'payHp', amount: { maxHp: 0.08 } },
      { kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 1.4 } },
    ],
  },
  passive: { name: 'Dark Hunger', description: '+15% lifesteal. On kill, heal 20% of max HP.' },
  modifier: {
    stats: { hp: 10, atk: 3 },
    lifesteal: 0.15,
    triggers: [on('onKill', 'Dark Hunger', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.2 } }])],
  },
  talents: [
    talent('doombringer/oblivion', 'Oblivion', '+35% ability power.', { abilityPower: 0.35 }),
    talent('doombringer/blood-pact', 'Blood Pact', '+15% lifesteal, +10 HP.', { lifesteal: 0.15, stats: { hp: 10 } }),
    talent('doombringer/despair', 'Despair', 'Start of combat: every enemy loses 1 ATK.', trig(
      on('startOfCombat', 'Despair', [{ kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } }]),
    )),
    abilityTalent('doombringer/soul-rend', {
      id: 'soul-rend',
      name: 'Soul Rend',
      description: 'Every 4th turn: lose 10% of your max HP, then deal 300% ATK piercing to the strongest enemy.',
      cooldown: 4,
      effects: [
        { kind: 'payHp', amount: { maxHp: 0.1 } },
        { kind: 'damage', target: 'highestAtk', amount: { atk: 3 }, pierce: true },
      ],
    }),
  ],
});

export const curseweaver = tertiary({
  id: 'curseweaver',
  name: 'Curseweaver',
  baseClassId: 'warlock',
  advancedClassId: 'hexer',
  description: 'Layers curse on curse until the enemy can barely lift a weapon.',
  tags: ['shadow', 'occult', 'arcane'],
  ability: {
    id: 'curse-of-agony',
    name: 'Curse of Agony',
    description: 'Every 3rd turn: every enemy loses 2 ATK and 1 DEF, then takes 70% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 2 } },
      { kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Lingering Hex', description: 'When an ally dies, every enemy loses 1 ATK.' },
  modifier: {
    stats: { hp: 12, atk: 2 },
    triggers: [on('onAllyDeath', 'Lingering Hex', [{ kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } }])],
  },
  talents: [
    talent('curseweaver/malediction', 'Malediction', '+35% ability power.', { abilityPower: 0.35 }),
    talent('curseweaver/hex-ward', 'Hex Ward', 'Start of combat: shield all allies for 100% ATK.', trig(
      on('startOfCombat', 'Hex Ward', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    talent('curseweaver/sap', 'Sap', 'After casting, every enemy loses 1 SPD.', trig(
      on('onAbility', 'Sap', [{ kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } }]),
    )),
    abilityTalent('curseweaver/silence', {
      id: 'silence',
      name: 'Silence',
      description: 'Every 4th turn: every enemy’s ability comes 2 turns later.',
      cooldown: 4,
      effects: [{ kind: 'cooldown', target: 'allEnemies', turns: 2 }],
    }),
  ],
});

const fiend: SummonDef = {
  name: 'Fiend',
  classId: 'fiend',
  hp: { maxHp: 0.8 },
  atk: { atk: 1 },
  def: 2,
  spd: 10,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

export const pitLord = tertiary({
  id: 'pit-lord',
  name: 'Pit Lord',
  baseClassId: 'warlock',
  advancedClassId: 'demonologist',
  description: 'Calls up fiends from the pit to brawl on the front line.',
  tags: ['arcane', 'occult'],
  ability: {
    id: 'summon-fiend',
    name: 'Summon Fiend',
    description: 'Every 3rd turn (first on turn 1): summon a Fiend in an empty slot (80% of your max HP, 100% ATK). If the board is full, deal 250% ATK to the strongest enemy instead.',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: fiend,
        fallback: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 2.5 } }],
      },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 1, spd: 2 },
  passive: { name: 'Infernal Command', description: 'When an ally dies, gain +2 ATK and heal 15% of max HP.' },
  modifier: {
    stats: { hp: 14, atk: 2 },
    triggers: [
      on('onAllyDeath', 'Infernal Command', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'heal', target: 'self', amount: { maxHp: 0.15 } },
      ]),
    ],
  },
  talents: [
    talent('pit-lord/greater-fiends', 'Greater Fiends', '+40% ability power (stronger fiends).', { abilityPower: 0.4 }),
    talent('pit-lord/brimstone', 'Brimstone', 'When hurt, deal 30% ATK to the attacker.', trig(
      on('onHurt', 'Brimstone', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.3 } }]),
    )),
    talent('pit-lord/demon-skin', 'Demon Skin', '+12 HP, +2 DEF.', { stats: { hp: 12, def: 2 } }),
    abilityTalent('pit-lord/rain-of-fire', {
      id: 'rain-of-fire',
      name: 'Rain of Fire',
      description: 'Every 4th turn: deal 90% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.9 } }],
    }),
  ],
});

export const soulbinder = tertiary({
  id: 'soulbinder',
  name: 'Soulbinder',
  baseClassId: 'warlock',
  advancedClassId: 'demonologist',
  description: 'Binds the souls of the fallen: every death on the field feeds it.',
  tags: ['occult', 'shadow'],
  ability: {
    id: 'soul-lash',
    name: 'Soul Lash',
    description: 'Every 3rd turn: deal 200% ATK to the strongest enemy and shield all allies for 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'highestAtk', amount: { atk: 2 } },
      { kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } },
    ],
  },
  passive: { name: 'Soul Feast', description: 'On kill or when an ally dies, gain +2 ATK.' },
  modifier: {
    stats: { hp: 10, atk: 3 },
    triggers: [
      on('onKill', 'Soul Feast', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }]),
      on('onAllyDeath', 'Soul Feast', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }]),
    ],
  },
  talents: [
    talent('soulbinder/phylactery', 'Phylactery', 'When bloodied, shield yourself for 50% of max HP.', trig(
      on('onBloodied', 'Phylactery', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.5 } }]),
    )),
    talent('soulbinder/soul-well', 'Soul Well', 'On kill, heal all allies for 100% ATK.', trig(
      on('onKill', 'Soul Well', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    talent('soulbinder/eldritch', 'Eldritch Power', '+30% ability power, +2 ATK.', { abilityPower: 0.3, stats: { atk: 2 } }),
    abilityTalent('soulbinder/drain-soul', {
      id: 'drain-soul',
      name: 'Drain Soul',
      description: 'Every 4th turn: deal 180% ATK to the weakest enemy and heal yourself for 180% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'lowestHp', amount: { atk: 1.8 } },
        { kind: 'heal', target: 'self', amount: { atk: 1.8 } },
      ],
    }),
  ],
});

export const WARLOCK_TERTIARY = [doombringer, curseweaver, pitLord, soulbinder];

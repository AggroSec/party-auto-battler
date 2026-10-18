import type { SummonDef } from '../../engine/types.ts';
import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const warlockTalents = [
  talent('warlock/dark-bargain', 'Dark Bargain', '+3 ATK, −6 HP.', { stats: { atk: 3, hp: -6 } }),
  talent('warlock/siphon', 'Siphon', '+15% lifesteal.', { lifesteal: 0.15 }),
  talent('warlock/hex', 'Hex', 'Start of combat: the strongest enemy loses 2 ATK.', trig(
    on('startOfCombat', 'Hex', [{ kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 2 } }]),
  )),
  talent('warlock/soul-shield', 'Soul Shield', 'When bloodied, shield yourself for 40% of max HP.', trig(
    on('onBloodied', 'Soul Shield', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.4 } }]),
  )),
];

export const hexer = advanced({
  id: 'hexer',
  name: 'Hexer',
  baseClassId: 'warlock',
  description: 'Curses the whole enemy party, weakening every one of them.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'withering-curse',
    name: 'Withering Curse',
    description: 'Every 3rd turn: every enemy loses 1 ATK and 1 DEF, then takes 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } },
      { kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } },
    ],
  },
  statWeights: { hp: 2, atk: 4, def: 1, spd: 2 },
  modifier: {
    stats: { atk: 2, hp: 6 },
    triggers: [on('onKill', 'Malice', [{ kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } }])],
  },
  talents: [
    talent('hexer/agony', 'Agony', 'Withering Curse also slows every enemy by 1 SPD.', trig(
      on('onAbility', 'Agony', [{ kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('hexer/doom', 'Doom', '+30% ability power.', { abilityPower: 0.3 }),
    talent('hexer/feedback', 'Feedback', '30% when hurt: the attacker loses 1 ATK.', trig(
      on('onHurt', 'Feedback', [{ kind: 'debuff', target: 'triggerSource', stat: 'atk', amount: { flat: 1 } }], { chance: 0.3 }),
    )),
    talent('hexer/blight', 'Blight', '30% on attack: the target loses 1 DEF.', trig(
      on('onAttack', 'Blight', [{ kind: 'debuff', target: 'triggerTarget', stat: 'def', amount: { flat: 1 } }], { chance: 0.3 }),
    )),
  ],
});

const imp: SummonDef = {
  name: 'Imp',
  classId: 'imp',
  hp: { maxHp: 0.4 },
  atk: { atk: 0.7 },
  def: 0,
  spd: 12,
  range: 'ranged',
  attackTarget: 'randomEnemy',
  row: 'back',
};

export const demonologist = advanced({
  id: 'demonologist',
  name: 'Demonologist',
  baseClassId: 'warlock',
  description: 'Binds imps to fight for them, and feeds on their deaths.',
  tags: ['arcane', 'occult'],
  ability: {
    id: 'summon-imp',
    name: 'Summon Imp',
    description: 'Every 3rd turn (first on turn 2): summon an Imp in an empty slot (40% of your max HP, 70% ATK). If the board is full, deal 180% ATK to the strongest enemy instead.',
    cooldown: 3,
    initialCooldown: 2,
    effects: [{ kind: 'summon', summon: imp, fallback: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 1.8 } }] }],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 1 },
  modifier: {
    stats: { hp: 6, atk: 2 },
    triggers: [on('onAllyDeath', 'Infernal Pact', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }])],
  },
  talents: [
    talent('demonologist/greater-binding', 'Greater Binding', '+40% ability power (stronger imps).', { abilityPower: 0.4 }),
    talent('demonologist/sacrifice', 'Sacrifice', 'When an ally falls, heal 20% of max HP.', trig(
      on('onAllyDeath', 'Sacrifice', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.2 } }]),
    )),
    talent('demonologist/hellfire', 'Hellfire', 'After your ability, deal 50% ATK to every enemy.', trig(
      on('onAbility', 'Hellfire', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } }]),
    )),
    talent('demonologist/dark-ward', 'Dark Ward', 'Start of combat: shield yourself for 30% of max HP.', trig(
      on('startOfCombat', 'Dark Ward', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
  ],
});

export const warlockClass: ClassDef = {
  id: 'warlock',
  name: 'Warlock',
  role: 'caster',
  tags: ['shadow', 'occult'],
  unlockable: false,
  description: 'Pays in blood for huge damage: every bolt costs a slice of their own HP.',
  baseStats: { hp: 26, atk: 7, def: 0, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 2, atk: 4, def: 1, spd: 2 },
  talents: talentIds(warlockTalents),
  advancedClasses: ['hexer', 'demonologist'],
  attackTarget: 'highestAtk',
  ability: {
    id: 'shadow-bolt',
    name: 'Shadow Bolt',
    description: 'Every 3rd turn: deal 200% ATK to the strongest enemy, then lose 8% of your max HP.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'highestAtk', amount: { atk: 2 } },
      { kind: 'payHp', amount: { maxHp: 0.08 } },
    ],
  },
  triggers: [on('onKill', 'Soul Siphon', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.25 } }])],
};

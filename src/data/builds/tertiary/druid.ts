// Druid tertiary classes (level 7): Shapeshifter → Elder Bear / Wildstalker, Grove Warden → Archdruid / Treelord.
import type { SummonDef } from '../../../engine/types.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const elderBear = tertiary({
  id: 'elder-bear',
  name: 'Elder Bear',
  baseClassId: 'druid',
  advancedClassId: 'shapeshifter',
  description: 'A towering bear: soaks the enemy’s attention and mauls whatever comes close.',
  tags: ['wild', 'guardian', 'nature'],
  ability: {
    id: 'crushing-maul',
    name: 'Crushing Maul',
    description: 'Every 3rd turn: deal 200% ATK to the nearest enemy, taunt for 2 turns and heal yourself for 10% of max HP.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 2 } },
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'heal', target: 'self', amount: { maxHp: 0.1 } },
    ],
  },
  statWeights: { hp: 5, atk: 2, def: 3, spd: 1 },
  passive: { name: 'Thick Hide', description: 'When bloodied, gain +4 DEF and heal 20% of max HP.' },
  modifier: {
    stats: { hp: 22, def: 2 },
    triggers: [
      on('onBloodied', 'Thick Hide', [
        { kind: 'buff', target: 'self', stat: 'def', amount: { flat: 4 } },
        { kind: 'heal', target: 'self', amount: { maxHp: 0.2 } },
      ]),
    ],
  },
  talents: [
    talent('elder-bear/hibernation', 'Deep Hibernation', '+20 HP.', { stats: { hp: 20 } }),
    talent('elder-bear/bristle', 'Bristle', 'When hurt, deal 3 piercing damage to the attacker.', trig(
      on('onHurt', 'Bristle', [{ kind: 'damage', target: 'triggerSource', amount: { flat: 3 }, pierce: true }]),
    )),
    talent('elder-bear/den-mother', 'Den Mother', 'Start of combat: shield all allies for 10% of your max HP.', trig(
      on('startOfCombat', 'Den Mother', [{ kind: 'shield', target: 'allAllies', amount: { maxHp: 0.1 } }]),
    )),
    abilityTalent('elder-bear/roar', {
      id: 'earthshaking-roar',
      name: 'Earthshaking Roar',
      description: 'Every 4th turn: every enemy loses 2 ATK.',
      cooldown: 4,
      effects: [{ kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 2 } }],
    }),
  ],
});

export const wildstalker = tertiary({
  id: 'wildstalker',
  name: 'Wildstalker',
  baseClassId: 'druid',
  advancedClassId: 'shapeshifter',
  description: 'A great cat: pounces on the back row and tears through it.',
  tags: ['wild', 'nature'],
  ability: {
    id: 'pounce',
    name: 'Pounce',
    description: 'Every 3rd turn: deal 260% ATK to the weakest back-row enemy, then strike it twice more for 80% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'backlineFirst', amount: { atk: 2.6 } },
      { kind: 'damage', target: 'backlineFirst', amount: { atk: 0.8 }, hits: 2 },
    ],
  },
  statWeights: { hp: 2, atk: 4, def: 1, spd: 4 },
  passive: { name: 'Predator', description: 'On kill, gain +2 ATK and +1 SPD.' },
  modifier: {
    stats: { hp: 6, atk: 3, spd: 3 },
    triggers: [
      on('onKill', 'Predator', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('wildstalker/claws', 'Razor Claws', '+3 ATK.', { stats: { atk: 3 } }),
    talent('wildstalker/prowl', 'Prowl', 'Start of combat: gain +3 SPD.', trig(
      on('startOfCombat', 'Prowl', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 3 } }]),
    )),
    talent('wildstalker/feral-instinct', 'Feral Instinct', 'When bloodied, heal 30% of max HP.', trig(
      on('onBloodied', 'Feral Instinct', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    abilityTalent('wildstalker/shred', {
      id: 'shred',
      name: 'Shred',
      description: 'Every 4th turn: strike the nearest enemy 4 times for 60% ATK; it loses 2 DEF.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 0.6 }, hits: 4 },
        { kind: 'debuff', target: 'nearest', stat: 'def', amount: { flat: 2 } },
      ],
    }),
  ],
});

export const archdruid = tertiary({
  id: 'archdruid',
  name: 'Archdruid',
  baseClassId: 'druid',
  advancedClassId: 'grove-warden',
  description: 'Voice of the wild: the whole party regrows between blows.',
  tags: ['nature', 'divine'],
  ability: {
    id: 'tranquility',
    name: 'Tranquility',
    description: 'Every 3rd turn: heal all allies for 180% ATK and they gain +1 DEF.',
    cooldown: 3,
    effects: [
      { kind: 'heal', target: 'allAllies', amount: { atk: 1.8 } },
      { kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } },
    ],
  },
  passive: { name: 'Lifebloom', description: 'At the start of each of your turns, all allies heal 3.' },
  modifier: {
    stats: { hp: 12, atk: 2 },
    triggers: [on('onTurnStart', 'Lifebloom', [{ kind: 'heal', target: 'allAllies', amount: { flat: 3 } }])],
  },
  talents: [
    talent('archdruid/wild-growth', 'Overgrowth', '+35% ability power.', { abilityPower: 0.35 }),
    talent('archdruid/barkskin-aura', 'Barkskin Aura', 'Start of combat: shield all allies for 100% ATK.', trig(
      on('startOfCombat', 'Barkskin Aura', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    talent('archdruid/cycle', 'Cycle of Life', 'When an ally dies, heal all allies for 120% ATK.', trig(
      on('onAllyDeath', 'Cycle of Life', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1.2 } }]),
    )),
    abilityTalent('archdruid/starfall', {
      id: 'starfall',
      name: 'Starfall',
      description: 'Every 4th turn: deal 100% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 1 } }],
    }),
  ],
});

const ancient: SummonDef = {
  name: 'Ancient',
  classId: 'ancient',
  hp: { maxHp: 1.1 },
  atk: { atk: 0.8 },
  def: 3,
  spd: 7,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

export const treelord = tertiary({
  id: 'treelord',
  name: 'Treelord',
  baseClassId: 'druid',
  advancedClassId: 'grove-warden',
  description: 'Wakes the ancients: huge tree guardians fill the front line.',
  tags: ['nature', 'guardian'],
  ability: {
    id: 'awaken-ancient',
    name: 'Awaken Ancient',
    description: 'Every 3rd turn (first on turn 1): summon an Ancient in an empty slot (110% of your max HP, 80% ATK). If the board is full, heal all allies for 150% ATK instead.',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: ancient,
        fallback: [{ kind: 'heal', target: 'allAllies', amount: { atk: 1.5 } }],
      },
    ],
  },
  statWeights: { hp: 5, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Deep Roots', description: 'At the start of each of your turns, heal the most wounded ally for 5.' },
  modifier: {
    stats: { hp: 16, atk: 1 },
    triggers: [on('onTurnStart', 'Deep Roots', [{ kind: 'heal', target: 'lowestHpAlly', amount: { flat: 5 } }])],
  },
  talents: [
    talent('treelord/heartwood', 'Heartwood', '+40% ability power (stronger Ancients).', { abilityPower: 0.4 }),
    talent('treelord/thornwall', 'Thornwall', 'Start of combat: all allies gain +1 DEF.', trig(
      on('startOfCombat', 'Thornwall', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('treelord/sapling', 'Sapling', '+14 HP, +1 DEF.', { stats: { hp: 14, def: 1 } }),
    abilityTalent('treelord/entangling-roots', {
      id: 'entangling-roots',
      name: 'Entangling Roots',
      description: 'Every 4th turn: deal 80% ATK to each enemy in the front row; they lose 2 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.8 } },
        { kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 2 } },
      ],
    }),
  ],
});

export const DRUID_TERTIARY = [elderBear, wildstalker, archdruid, treelord];

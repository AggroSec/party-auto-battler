import type { SummonDef } from '../../engine/types.ts';
import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const engineerTalents = [
  talent('engineer/overcharge', 'Overcharge', '+30% ability power (stronger turrets).', { abilityPower: 0.3 }),
  talent('engineer/repair-kit', 'Repair Kit', 'The first time you drop below 50% HP, heal 30% of max HP.', trig(
    on('onBloodied', 'Repair Kit', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]),
  )),
  talent('engineer/scrap-plating', 'Scrap Plating', 'Start of combat: shield all allies for 3.', trig(
    on('startOfCombat', 'Scrap Plating', [{ kind: 'shield', target: 'allAllies', amount: { flat: 3 } }]),
  )),
  talent('engineer/rangefinder', 'Rangefinder', '25% on attack: strike again for 50% ATK.', trig(
    on('onAttack', 'Rangefinder', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.5 } }], { chance: 0.25 }),
  )),
];

const turret: SummonDef = {
  name: 'Turret',
  classId: 'turret',
  hp: { maxHp: 0.4 },
  atk: { atk: 0.6 },
  def: 1,
  spd: 9,
  range: 'ranged',
  attackTarget: 'nearest',
  row: 'front',
};

const sentry: SummonDef = { ...turret, name: 'Sentry', classId: 'sentry', hp: { maxHp: 0.5 }, atk: { atk: 0.7 }, def: 2, spd: 11 };

export const machinist = advanced({
  id: 'machinist',
  name: 'Machinist',
  baseClassId: 'engineer',
  description: 'Fills every empty slot with sentries and keeps them running.',
  tags: ['tech'],
  ability: {
    id: 'deploy-sentry',
    name: 'Deploy Sentry',
    description: 'Every 3rd turn (first on turn 1): summon a Sentry in an empty slot (50% of your max HP, 70% ATK). If the board is full, fire a rocket for 150% ATK at the nearest enemy (30% splash).',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: sentry,
        fallback: [{ kind: 'damage', target: 'nearest', amount: { atk: 1.5 }, splash: 0.3 }],
      },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  modifier: {
    stats: { hp: 6, def: 1 },
    triggers: [on('onTurnStart', 'Maintenance', [{ kind: 'heal', target: 'lowestHpAlly', amount: { flat: 3 } }])],
  },
  talents: [
    talent('machinist/hardened-frames', 'Hardened Frames', '+40% ability power (stronger sentries).', { abilityPower: 0.4 }),
    talent('machinist/targeting-array', 'Targeting Array', 'After your ability, all allies gain +1 ATK.', trig(
      on('onAbility', 'Targeting Array', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('machinist/plating', 'Plating', 'Start of combat: shield all allies for 4.', trig(
      on('startOfCombat', 'Plating', [{ kind: 'shield', target: 'allAllies', amount: { flat: 4 } }]),
    )),
    talent('machinist/salvage', 'Salvage', 'When an ally falls, shield yourself for 6.', trig(
      on('onAllyDeath', 'Salvage', [{ kind: 'shield', target: 'self', amount: { flat: 6 } }]),
    )),
  ],
});

export const demolitionist = advanced({
  id: 'demolitionist',
  name: 'Demolitionist',
  baseClassId: 'engineer',
  description: 'Trades turrets for bombs that hit the whole enemy party.',
  tags: ['tech', 'martial'],
  ability: {
    id: 'cluster-bomb',
    name: 'Cluster Bomb',
    description: 'Every 3rd turn: deal 50% ATK to every enemy, twice.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 }, hits: 2 }],
  },
  statWeights: { hp: 2, atk: 4, def: 1, spd: 2 },
  modifier: {
    stats: { atk: 3, hp: 4 },
    triggers: [on('onKill', 'Shrapnel', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.4 } }])],
  },
  talents: [
    talent('demolitionist/big-boom', 'Big Boom', '+40% ability power.', { abilityPower: 0.4 }),
    talent('demolitionist/sticky-bombs', 'Sticky Bombs', 'After your ability, the enemy front row loses 1 SPD.', trig(
      on('onAbility', 'Sticky Bombs', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('demolitionist/blast-shield', 'Blast Shield', 'Start of combat: shield yourself for 10.', trig(
      on('startOfCombat', 'Blast Shield', [{ kind: 'shield', target: 'self', amount: { flat: 10 } }]),
    )),
    talent('demolitionist/short-fuse', 'Short Fuse', 'Ability cooldown −1, −25% ability power.', { abilityCooldown: -1, abilityPower: -0.25 }),
  ],
});

export const engineerClass: ClassDef = {
  id: 'engineer',
  name: 'Engineer',
  role: 'caster',
  tags: ['tech'],
  unlockable: false,
  description: 'Builds turrets in empty slots: leave room on the board and they fill it.',
  baseStats: { hp: 28, atk: 5, def: 2, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 3, def: 2, spd: 1 },
  talents: talentIds(engineerTalents),
  advancedClasses: ['machinist', 'demolitionist'],
  attackTarget: 'nearest',
  ability: {
    id: 'deploy-turret',
    name: 'Deploy Turret',
    description: 'Every 4th turn (first on turn 2): summon a Turret in an empty slot (40% of your max HP, 60% ATK). If the board is full, fire a rocket for 130% ATK at the nearest enemy instead.',
    cooldown: 4,
    initialCooldown: 2,
    effects: [{ kind: 'summon', summon: turret, fallback: [{ kind: 'damage', target: 'nearest', amount: { atk: 1.3 } }] }],
  },
  triggers: [on('onTurnStart', 'Field Repairs', [{ kind: 'heal', target: 'lowestHpAlly', amount: { flat: 3 } }], { chance: 0.3 })],
};

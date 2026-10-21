// Engineer tertiary classes (level 7): Machinist → Artificer / Roboticist, Demolitionist → Bombardier / Siege Master.
import type { SummonDef } from '../../../engine/types.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const artificer = tertiary({
  id: 'artificer',
  name: 'Artificer',
  baseClassId: 'engineer',
  advancedClassId: 'machinist',
  description: 'Tinkers with the whole party’s gear: shields, repairs and upgrades mid-fight.',
  tags: ['tech', 'arcane'],
  ability: {
    id: 'field-upgrade',
    name: 'Field Upgrade',
    description: 'Every 3rd turn: shield all allies for 120% ATK and heal the most wounded ally for 150% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'allAllies', amount: { atk: 1.2 } },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1.5 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 2, spd: 1 },
  passive: { name: 'Overclock', description: 'Start of combat: all allies gain +1 ATK and +1 SPD.' },
  modifier: {
    stats: { hp: 10, atk: 2, def: 1 },
    triggers: [
      on('startOfCombat', 'Overclock', [
        { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('artificer/precision-tools', 'Precision Tools', '+35% ability power.', { abilityPower: 0.35 }),
    talent('artificer/reinforced', 'Reinforced Plating', 'Start of combat: all allies gain +1 DEF.', trig(
      on('startOfCombat', 'Reinforced Plating', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('artificer/emergency-kit', 'Emergency Kit', 'When an ally dies, heal all allies for 100% ATK.', trig(
      on('onAllyDeath', 'Emergency Kit', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    abilityTalent('artificer/arc-cannon', {
      id: 'arc-cannon',
      name: 'Arc Cannon',
      description: 'Every 4th turn: deal 160% ATK to the nearest enemy (50% splash).',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 1.6 }, splash: 0.5 }],
    }),
  ],
});

const golem: SummonDef = {
  name: 'Golem',
  classId: 'golem',
  hp: { maxHp: 1 },
  atk: { atk: 0.9 },
  def: 4,
  spd: 8,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

export const roboticist = tertiary({
  id: 'roboticist',
  name: 'Roboticist',
  baseClassId: 'engineer',
  advancedClassId: 'machinist',
  description: 'Builds clanking steel golems to hold the front line.',
  tags: ['tech'],
  ability: {
    id: 'build-golem',
    name: 'Build Golem',
    description: 'Every 3rd turn (first on turn 1): summon a Golem in an empty slot (100% of your max HP, 90% ATK). If the board is full, fire a rocket for 260% ATK at the nearest enemy (50% splash) instead.',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: golem,
        fallback: [{ kind: 'damage', target: 'nearest', amount: { atk: 2.6 }, splash: 0.5 }],
      },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Auto-Repair', description: 'At the start of each of your turns, heal the most wounded ally for 6.' },
  modifier: {
    stats: { hp: 14, atk: 2 },
    triggers: [on('onTurnStart', 'Auto-Repair', [{ kind: 'heal', target: 'lowestHpAlly', amount: { flat: 6 } }])],
  },
  talents: [
    talent('roboticist/titanium', 'Titanium Frames', '+40% ability power (stronger golems).', { abilityPower: 0.4 }),
    talent('roboticist/scrap-armor', 'Scrap Armor', '+12 HP, +2 DEF.', { stats: { hp: 12, def: 2 } }),
    talent('roboticist/self-destruct', 'Self-Destruct', 'When an ally dies, deal 80% ATK to every enemy.', trig(
      on('onAllyDeath', 'Self-Destruct', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } }]),
    )),
    abilityTalent('roboticist/tesla-coil', {
      id: 'tesla-coil',
      name: 'Tesla Coil',
      description: 'Every 4th turn: deal 50% ATK to random enemies 5 times.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.5 }, hits: 5 }],
    }),
  ],
});

export const bombardier = tertiary({
  id: 'bombardier',
  name: 'Bombardier',
  baseClassId: 'engineer',
  advancedClassId: 'demolitionist',
  description: 'Carpet-bombs the enemy side, again and again.',
  tags: ['tech', 'martial'],
  ability: {
    id: 'carpet-bomb',
    name: 'Carpet Bomb',
    description: 'Every 3rd turn: deal 55% ATK to every enemy, three times.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.55 }, hits: 3 }],
  },
  passive: { name: 'Chain Reaction', description: 'On kill, deal 60% ATK to every enemy.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [on('onKill', 'Chain Reaction', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } }])],
  },
  talents: [
    talent('bombardier/high-explosives', 'High Explosives', '+35% ability power.', { abilityPower: 0.35 }),
    talent('bombardier/shrapnel-vest', 'Shrapnel Vest', 'When hurt, deal 2 piercing damage to the attacker.', trig(
      on('onHurt', 'Shrapnel Vest', [{ kind: 'damage', target: 'triggerSource', amount: { flat: 2 }, pierce: true }]),
    )),
    talent('bombardier/bunker', 'Bunker', 'Start of combat: shield yourself for 200% ATK.', trig(
      on('startOfCombat', 'Bunker', [{ kind: 'shield', target: 'self', amount: { atk: 2 } }]),
    )),
    abilityTalent('bombardier/napalm', {
      id: 'napalm',
      name: 'Napalm',
      description: 'Every 4th turn: deal 130% ATK to each enemy in the front row; they lose 1 DEF.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.3 } },
        { kind: 'debuff', target: 'enemyFrontRow', stat: 'def', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const siegeMaster = tertiary({
  id: 'siege-master',
  name: 'Siege Master',
  baseClassId: 'engineer',
  advancedClassId: 'demolitionist',
  description: 'Brings the heavy artillery: huge piercing shells that crack any armour.',
  tags: ['tech', 'martial'],
  ability: {
    id: 'artillery',
    name: 'Artillery Shell',
    description: 'Every 3rd turn: deal 260% ATK piercing to the strongest enemy (60% splash).',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 2.6 }, pierce: true, splash: 0.6 }],
  },
  statWeights: { hp: 3, atk: 5, def: 2, spd: 1 },
  passive: { name: 'Fortified Position', description: 'Start of combat: shield yourself for 150% ATK.' },
  modifier: {
    stats: { hp: 12, atk: 3, def: 1 },
    triggers: [on('startOfCombat', 'Fortified Position', [{ kind: 'shield', target: 'self', amount: { atk: 1.5 } }])],
  },
  talents: [
    talent('siege-master/calibrate', 'Calibrate', '+3 ATK.', { stats: { atk: 3 } }),
    talent('siege-master/sapper', 'Sapper', 'After casting, the enemy front row loses 1 DEF.', trig(
      on('onAbility', 'Sapper', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('siege-master/entrench', 'Entrench', '+3 DEF, +8 HP, −1 SPD.', { stats: { def: 3, hp: 8, spd: -1 } }),
    abilityTalent('siege-master/mortar', {
      id: 'mortar',
      name: 'Mortar',
      description: 'Every 4th turn: deal 120% ATK to the weakest back-row enemy (60% splash).',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 1.2 }, splash: 0.6 }],
    }),
  ],
});

export const ENGINEER_TERTIARY = [artificer, roboticist, bombardier, siegeMaster];

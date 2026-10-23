// Bard tertiary classes (level 7): Skald → Warchanter / Lorekeeper, Trickster → Illusionist / Harlequin.
import type { SummonDef } from '../../../engine/types.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const warchanter = tertiary({
  id: 'warchanter',
  name: 'Warchanter',
  baseClassId: 'bard',
  advancedClassId: 'skald',
  description: 'War drums that never stop: the whole party hits harder every song.',
  tags: ['martial', 'spirit'],
  ability: {
    id: 'battle-hymn',
    name: 'Battle Hymn',
    description: 'Every 3rd turn: all allies gain +3 ATK and +1 SPD.',
    cooldown: 3,
    effects: [
      { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 3 } },
      { kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } },
    ],
  },
  passive: { name: 'Drums of War', description: 'Start of combat: all allies gain +2 ATK.' },
  modifier: {
    stats: { hp: 10, atk: 1, spd: 1 },
    triggers: [on('startOfCombat', 'Drums of War', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } }])],
  },
  talents: [
    talent('warchanter/crescendo', 'Crescendo', 'After casting, shield all allies for 4.', trig(
      on('onAbility', 'Crescendo', [{ kind: 'shield', target: 'allAllies', amount: { flat: 4 } }]),
    )),
    talent('warchanter/stamina', 'Endless Song', '+12 HP, +2 SPD.', { stats: { hp: 12, spd: 2 } }),
    talent('warchanter/requiem', 'Requiem', 'When an ally dies, all allies gain +2 ATK.', trig(
      on('onAllyDeath', 'Requiem', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } }]),
    )),
    abilityTalent('warchanter/shout', {
      id: 'thunderous-shout',
      name: 'Thunderous Shout',
      description: 'Every 4th turn: deal 80% ATK to every enemy; the enemy front row loses 1 ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
        { kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const lorekeeper = tertiary({
  id: 'lorekeeper',
  name: 'Lorekeeper',
  baseClassId: 'bard',
  advancedClassId: 'skald',
  description: 'Sings the old sagas: steady defence and healing for a long fight.',
  tags: ['spirit', 'divine'],
  ability: {
    id: 'saga',
    name: 'Saga of Heroes',
    description: 'Every 3rd turn: all allies gain +1 ATK and +1 DEF and heal for 80% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
      { kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.8 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 2 },
  passive: { name: 'Legend', description: 'When an ally dies, shield all allies for 150% ATK.' },
  modifier: {
    stats: { hp: 12, atk: 1, def: 1 },
    triggers: [on('onAllyDeath', 'Legend', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1.5 } }])],
  },
  talents: [
    talent('lorekeeper/epic', 'Epic', '+35% ability power.', { abilityPower: 0.35 }),
    talent('lorekeeper/hearth-song', 'Hearth Song', 'At the start of each of your turns, all allies heal 2.', trig(
      on('onTurnStart', 'Hearth Song', [{ kind: 'heal', target: 'allAllies', amount: { flat: 2 } }]),
    )),
    talent('lorekeeper/old-tales', 'Old Tales', 'Start of combat: all allies gain +1 DEF.', trig(
      on('startOfCombat', 'Old Tales', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
    )),
    abilityTalent('lorekeeper/ballad-of-ages', {
      id: 'ballad-of-ages',
      name: 'Ballad of Ages',
      description: 'Every 4th turn: shield all allies for 120% ATK.',
      cooldown: 4,
      effects: [{ kind: 'shield', target: 'allAllies', amount: { atk: 1.2 } }],
    }),
  ],
});

export const mirrorImage: SummonDef = {
  name: 'Mirror Image',
  classId: 'mirror-image',
  hp: { maxHp: 0.5 },
  atk: { atk: 0.5 },
  def: 0,
  spd: 10,
  range: 'ranged',
  attackTarget: 'randomEnemy',
  row: 'front',
};

export const illusionist = tertiary({
  id: 'illusionist',
  name: 'Illusionist',
  baseClassId: 'bard',
  advancedClassId: 'trickster',
  description: 'Fills empty slots with mirror images that soak up blows.',
  tags: ['arcane', 'shadow'],
  ability: {
    id: 'mirror-images',
    name: 'Mirror Images',
    description: 'Every 3rd turn (first on turn 1): summon a Mirror Image in an empty slot (50% of your max HP, 50% ATK). If the board is full, the strongest enemy loses 3 ATK instead.',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: mirrorImage,
        fallback: [{ kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 3 } }],
      },
    ],
  },
  statWeights: { hp: 4, atk: 2, def: 1, spd: 3 },
  passive: { name: 'Misdirect', description: 'Start of combat: every enemy loses 1 SPD.' },
  modifier: {
    stats: { hp: 12, spd: 1 },
    triggers: [on('startOfCombat', 'Misdirect', [{ kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } }])],
  },
  talents: [
    talent('illusionist/phantasm', 'Phantasm', '+40% ability power (sturdier images).', { abilityPower: 0.4 }),
    talent('illusionist/blink', 'Blink', 'When bloodied, shield yourself for 40% of max HP.', trig(
      on('onBloodied', 'Blink', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.4 } }]),
    )),
    talent('illusionist/confusion', 'Confusion', '30% when hurt: the attacker’s ability comes 1 turn later and it loses 1 ATK.', trig(
      on('onHurt', 'Confusion', [
        { kind: 'cooldown', target: 'triggerSource', turns: 1 },
        { kind: 'debuff', target: 'triggerSource', stat: 'atk', amount: { flat: 1 } },
      ], { chance: 0.3 }),
    )),
    abilityTalent('illusionist/mind-spike', {
      id: 'mind-spike',
      name: 'Mind Spike',
      description: 'Every 4th turn: deal 180% ATK piercing to the strongest enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 1.8 }, pierce: true }],
    }),
  ],
});

export const harlequin = tertiary({
  id: 'harlequin',
  name: 'Harlequin',
  baseClassId: 'bard',
  advancedClassId: 'trickster',
  description: 'Chaos with a grin: wrecks enemy timing and laughs at the damage.',
  tags: ['arcane', 'shadow'],
  ability: {
    id: 'pandemonium',
    name: 'Pandemonium',
    description: 'Every 4th turn: every enemy’s ability comes 1 turn later, every enemy loses 1 ATK and takes 80% ATK.',
    cooldown: 4,
    effects: [
      { kind: 'cooldown', target: 'allEnemies', turns: 1 },
      { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
    ],
  },
  passive: { name: 'Pratfall', description: '30% when hurt: the attacker loses 1 SPD.' },
  modifier: {
    stats: { hp: 10, atk: 2, spd: 1 },
    triggers: [on('onHurt', 'Pratfall', [{ kind: 'debuff', target: 'triggerSource', stat: 'spd', amount: { flat: 1 } }], { chance: 0.3 })],
  },
  talents: [
    talent('harlequin/slapstick', 'Slapstick', '+35% ability power.', { abilityPower: 0.35 }),
    talent('harlequin/juggle', 'Juggle', '25% on attack: the target’s ability comes 1 turn later.', trig(
      on('onAttack', 'Juggle', [{ kind: 'cooldown', target: 'triggerTarget', turns: 1 }], { chance: 0.25 }),
    )),
    talent('harlequin/encore', 'Encore', 'On kill, your next ability comes 2 turns sooner.', trig(
      on('onKill', 'Encore', [{ kind: 'cooldown', target: 'self', turns: -2 }]),
    )),
    abilityTalent('harlequin/punchline', {
      id: 'punchline',
      name: 'Punchline',
      description: 'Every 4th turn: deal 150% ATK to the weakest enemy (50% splash).',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'lowestHp', amount: { atk: 1.5 }, splash: 0.5 }],
    }),
  ],
});

export const BARD_TERTIARY = [warchanter, lorekeeper, illusionist, harlequin];

// Runeblade tertiary classes (level 7): Spellblade → Stormblade / Earthwarden,
// Duskblade → Dawnblade / Voidblade. Brandon: two of them fight fully from the
// back row (Stormblade, Dawnblade) to keep the caster feel.
import { CORRUPTION, RUNE } from '../../statuses.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';
import { onDetonate } from '../runeblade.ts';

export const stormblade = tertiary({
  id: 'stormblade',
  name: 'Stormblade',
  baseClassId: 'runeblade',
  advancedClassId: 'spellblade',
  description: 'Lightning from the back row: Runes land everywhere and detonations arc between enemies.',
  tags: ['arcane', 'martial'],
  attackTarget: 'randomEnemy',
  ability: {
    id: 'thunder-rune',
    name: 'Thunder Rune',
    description: 'Every 3rd turn: carve 1 Rune into every enemy, then strike 3 random enemies for 70% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'allEnemies', status: RUNE, stacks: 1 },
      { kind: 'damage', target: 'randomEnemy', amount: { atk: 0.7 }, hits: 3 },
    ],
  },
  statWeights: { hp: 2, atk: 4, def: 1, spd: 3 },
  passive: { name: 'Arc Surge', description: 'Fights at full strength from the back row; basic attacks hit random enemies. Detonations arc to 2 random enemies for 80% ATK.' },
  modifier: {
    stats: { hp: 6, atk: 2, spd: 3 },
    reach: true,
    triggers: [onDetonate('Arc Surge', [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.8 }, hits: 2 }])],
  },
  talents: [
    talent('stormblade/static-charge', 'Static Charge', '+3 SPD, +2 ATK.', { stats: { spd: 3, atk: 2 } }),
    talent('stormblade/storm-surge', 'Storm Surge', 'Each detonation grants +1 SPD.', trig(
      onDetonate('Storm Surge', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('stormblade/conductive-runes', 'Conductive Runes', 'Basic attacks also carve a Rune into another random enemy.', trig(
      on('onAttack', 'Conductive Runes', [{ kind: 'status', target: 'randomEnemy', status: RUNE, stacks: 1 }]),
    )),
    abilityTalent('stormblade/thunderclap', {
      id: 'thunderclap',
      name: 'Thunderclap',
      description: 'Every 4th turn: deal 60% ATK to every enemy and carve 1 Rune into each.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } },
        { kind: 'status', target: 'allEnemies', status: RUNE, stacks: 1 },
      ],
    }),
  ],
});

export const earthwarden = tertiary({
  id: 'earthwarden',
  name: 'Earthwarden',
  baseClassId: 'runeblade',
  advancedClassId: 'spellblade',
  description: 'Rune knight of stone: holds the front line, and every detonation hardens it.',
  tags: ['arcane', 'martial', 'guardian'],
  ability: {
    id: 'quake-rune',
    name: 'Quake Rune',
    description: 'Every 3rd turn: carve 2 Runes into each enemy in the front row, shield yourself for 4 + 80% DEF, and taunt for 1 turn.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'enemyFrontRow', status: RUNE, stacks: 2 },
      { kind: 'shield', target: 'self', amount: { flat: 4, def: 0.8 } },
      { kind: 'taunt', target: 'self', turns: 1 },
    ],
  },
  statWeights: { hp: 5, atk: 2, def: 3, spd: 1 },
  passive: { name: 'Living Stone', description: 'When your Runes detonate, shield yourself for 10% of max HP and the target loses 1 DEF.' },
  modifier: {
    stats: { hp: 12, def: 2 },
    triggers: [
      onDetonate('Living Stone', [
        { kind: 'shield', target: 'self', amount: { maxHp: 0.1 } },
        { kind: 'debuff', target: 'triggerTarget', stat: 'def', amount: { flat: 1 } },
      ]),
    ],
  },
  talents: [
    talent('earthwarden/stone-skin', 'Stone Skin', '+3 DEF, +10 HP.', { stats: { def: 3, hp: 10 } }),
    talent('earthwarden/aftershock', 'Aftershock', 'Detonations also deal 100% DEF to each enemy in the front row.', trig(
      onDetonate('Aftershock', [{ kind: 'damage', target: 'enemyFrontRow', amount: { def: 1 } }]),
    )),
    talent('earthwarden/rooted', 'Rooted', 'Start of combat: taunt for 2 turns and shield yourself for 20% of max HP.', trig(
      on('startOfCombat', 'Rooted', [
        { kind: 'taunt', target: 'self', turns: 2 },
        { kind: 'shield', target: 'self', amount: { maxHp: 0.2 } },
      ]),
    )),
    abilityTalent('earthwarden/tremor', {
      id: 'tremor',
      name: 'Tremor',
      description: 'Every 4th turn: deal 80% ATK to each enemy in the front row; they lose 1 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.8 } },
        { kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const dawnblade = tertiary({
  id: 'dawnblade',
  name: 'Dawnblade',
  baseClassId: 'runeblade',
  advancedClassId: 'duskblade',
  description: 'Rune-priest of the dawn: fights from the back row, and its detonations heal everyone.',
  tags: ['arcane', 'divine'],
  ability: {
    id: 'sunrise-rune',
    name: 'Sunrise Rune',
    description: 'Every 3rd turn: carve 2 Runes into the nearest enemy, heal all allies for 50% ATK, and shield the most wounded ally for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'nearest', status: RUNE, stacks: 2 },
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } },
      { kind: 'shield', target: 'lowestHpAlly', amount: { atk: 1 } },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'First Light', description: 'Fights at full strength from the back row. When your Runes detonate, heal all allies for 50% ATK.' },
  modifier: {
    stats: { hp: 12, atk: 3, def: 1 },
    reach: true,
    triggers: [onDetonate('First Light', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } }])],
  },
  talents: [
    talent('dawnblade/dawnward', 'Dawnward', '+30% ability power.', { abilityPower: 0.3 }),
    talent('dawnblade/sunfire', 'Sunfire', 'Detonations also deal 50% ATK to every enemy.', trig(
      onDetonate('Sunfire', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } }]),
    )),
    talent('dawnblade/beacon', 'Beacon', 'Start of combat: shield all allies for 100% ATK.', trig(
      on('startOfCombat', 'Beacon', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    abilityTalent('dawnblade/solar-flare', {
      id: 'solar-flare',
      name: 'Solar Flare',
      description: 'Every 4th turn: heal the most wounded ally for 150% ATK and carve 1 Rune into every enemy.',
      cooldown: 4,
      effects: [
        { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1.5 } },
        { kind: 'status', target: 'allEnemies', status: RUNE, stacks: 1 },
      ],
    }),
  ],
});

export const voidblade = tertiary({
  id: 'voidblade',
  name: 'Voidblade',
  baseClassId: 'runeblade',
  advancedClassId: 'duskblade',
  description: 'Shadow Runes rot into Corruption: damage over time, lifesteal and executions.',
  tags: ['arcane', 'shadow'],
  ability: {
    id: 'void-rend',
    name: 'Void Rend',
    description: 'Every 3rd turn: deal 120% ATK to the nearest enemy, give it 3 Corruption, and carve 1 Rune into it.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.2 } },
      { kind: 'status', target: 'nearest', status: CORRUPTION, stacks: 3 },
      { kind: 'status', target: 'nearest', status: RUNE, stacks: 1 },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: {
    name: 'Hunger of the Void',
    description: '+20% lifesteal and +30% damage to enemies below half HP. Detonations give the target 3 Corruption (25% ATK damage per stack each turn, for 3 turns).',
  },
  modifier: {
    stats: { hp: 10, atk: 3 },
    lifesteal: 0.2,
    executeBonus: 0.3,
    triggers: [onDetonate('Hunger of the Void', [{ kind: 'status', target: 'triggerTarget', status: CORRUPTION, stacks: 3 }])],
  },
  talents: [
    talent('voidblade/creeping-void', 'Creeping Void', 'Basic attacks also give 1 Corruption.', trig(
      on('onAttack', 'Creeping Void', [{ kind: 'status', target: 'triggerTarget', status: CORRUPTION, stacks: 1 }]),
    )),
    talent('voidblade/devour', 'Devour', 'On kill, heal 30% of max HP.', trig(on('onKill', 'Devour', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]))),
    talent('voidblade/abyssal-edge', 'Abyssal Edge', '+2 ATK and +30% damage to enemies below half HP.', { stats: { atk: 2 }, executeBonus: 0.3 }),
    abilityTalent('voidblade/void-bloom', {
      id: 'void-bloom',
      name: 'Void Bloom',
      description: 'Every 4th turn: give every enemy 2 Corruption.',
      cooldown: 4,
      effects: [{ kind: 'status', target: 'allEnemies', status: CORRUPTION, stacks: 2 }],
    }),
  ],
});

export const RUNEBLADE_TERTIARY = [stormblade, earthwarden, dawnblade, voidblade];

// Sylvan tertiary classes (level 7): Verdant Keeper → Lifebinder / Bloomcaller,
// Thornweaver → Briarheart / Rootwarden.
import { GREATER_RENEWAL, RENEWAL, ROOTED, THORNS } from '../../statuses.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const lifebinder = tertiary({
  id: 'lifebinder',
  name: 'Lifebinder',
  baseClassId: 'sylvan',
  advancedClassId: 'verdant-keeper',
  description: 'Heals so steadily that it overflows: healing past full HP becomes a shield.',
  tags: ['nature', 'spirit'],
  ability: {
    id: 'lifebind',
    name: 'Lifebind',
    description: 'Every 3rd turn: heal every ally for 80% ATK and give each Renewal.',
    cooldown: 3,
    effects: [
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.8 } },
      { kind: 'status', target: 'allAllies', status: RENEWAL, stacks: 1 },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Overflow', description: 'Your healing past full HP becomes a shield (60% of the excess).' },
  modifier: { stats: { hp: 10, atk: 2 }, overhealShield: 0.6 },
  talents: [
    talent('lifebinder/brimming', 'Brimming', 'Overflow converts 100% of the excess instead.', { overhealShield: 0.4 }),
    talent('lifebinder/deep-roots', 'Deep Roots', '+30% ability power.', { abilityPower: 0.3 }),
    talent('lifebinder/vigil', 'Green Vigil', 'Start of combat: heal every ally for 100% ATK (shields at full HP).', trig(
      on('startOfCombat', 'Green Vigil', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }]),
    )),
    abilityTalent('lifebinder/sanctuary-grove', {
      id: 'sanctuary-grove',
      name: 'Sanctuary Grove',
      description: 'Every 4th turn: shield every ally for 80% ATK.',
      cooldown: 4,
      effects: [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.8 } }],
    }),
  ],
});

export const bloomcaller = tertiary({
  id: 'bloomcaller',
  name: 'Bloomcaller',
  baseClassId: 'sylvan',
  advancedClassId: 'verdant-keeper',
  description: 'Calls spring itself: Greater Renewal on everyone, and new growth when an ally falls.',
  tags: ['nature', 'spirit'],
  ability: {
    id: 'spring-rain',
    name: 'Spring Rain',
    description: 'Every 3rd turn: give every ally Greater Renewal (heals 110% ATK at the start of each of its turns, for 3 turns).',
    cooldown: 3,
    effects: [{ kind: 'status', target: 'allAllies', status: GREATER_RENEWAL, stacks: 1 }],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Rebirth Bloom', description: 'When an ally falls, heal every ally for 100% ATK and give each Greater Renewal.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [
      on('onAllyDeath', 'Rebirth Bloom', [
        { kind: 'heal', target: 'allAllies', amount: { atk: 1 } },
        { kind: 'status', target: 'allAllies', status: GREATER_RENEWAL, stacks: 1 },
      ]),
    ],
  },
  talents: [
    talent('bloomcaller/first-bloom', 'First Bloom', 'Start of combat: give every ally Greater Renewal.', trig(
      on('startOfCombat', 'First Bloom', [{ kind: 'status', target: 'allAllies', status: GREATER_RENEWAL, stacks: 1 }]),
    )),
    talent('bloomcaller/pollen', 'Pollen Cloud', 'After your ability, the enemy front row loses 1 ATK.', trig(
      on('onAbility', 'Pollen Cloud', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('bloomcaller/verdance', 'Verdance', '+4 ATK.', { stats: { atk: 4 } }),
    abilityTalent('bloomcaller/petal-storm', {
      id: 'petal-storm',
      name: 'Petal Storm',
      description: 'Every 4th turn: deal 70% ATK to every enemy and heal every ally for 40% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } },
        { kind: 'heal', target: 'allAllies', amount: { atk: 0.4 } },
      ],
    }),
  ],
});

export const briarheart = tertiary({
  id: 'briarheart',
  name: 'Briarheart',
  baseClassId: 'sylvan',
  advancedClassId: 'thornweaver',
  description: 'A walking thicket: draws the blows, bristles with thorns and heals itself from what it takes back.',
  tags: ['nature', 'wild', 'guardian'],
  ability: {
    id: 'heart-of-thorns',
    name: 'Heart of Thorns',
    description: 'Every 3rd turn: taunt for 2 turns, give yourself Renewal and Thorns, and give every other ally Renewal.',
    cooldown: 3,
    effects: [
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'status', target: 'self', status: THORNS, stacks: 1 },
      { kind: 'status', target: 'allAllies', status: RENEWAL, stacks: 1 },
    ],
  },
  statWeights: { hp: 5, atk: 2, def: 3, spd: 1 },
  passive: { name: 'Sapdrinker', description: '+20 HP, +2 DEF and 25% lifesteal (thorns included).' },
  modifier: { stats: { hp: 20, def: 2 }, lifesteal: 0.25 },
  talents: [
    talent('briarheart/ironbark', 'Ironbark', '+3 DEF.', { stats: { def: 3 } }),
    talent('briarheart/wild-thicket', 'Wild Thicket', '+20 HP.', { stats: { hp: 20 } }),
    talent('briarheart/hedge', 'Hedgewall', 'When bloodied, shield every ally for 80% ATK.', trig(
      on('onBloodied', 'Hedgewall', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.8 } }]),
    )),
    abilityTalent('briarheart/thorn-volley', {
      id: 'thorn-volley',
      name: 'Thorn Volley',
      description: 'Every 4th turn: deal 90% ATK to each enemy in the front row.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.9 } }],
    }),
  ],
});

export const rootwarden = tertiary({
  id: 'rootwarden',
  name: 'Rootwarden',
  baseClassId: 'sylvan',
  advancedClassId: 'thornweaver',
  description: 'Holds the line with the forest floor: roots the enemy front row while the party mends.',
  tags: ['nature', 'wild'],
  ability: {
    id: 'grasping-roots',
    name: 'Grasping Roots',
    description: 'Every 3rd turn: give each ally in the front row Renewal and Thorns; each enemy in the front row takes 70% ATK and is Rooted (−3 SPD for 2 turns).',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'allyFrontRow', status: RENEWAL, stacks: 1 },
      { kind: 'status', target: 'allyFrontRow', status: THORNS, stacks: 1 },
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.7 } },
      { kind: 'status', target: 'enemyFrontRow', status: ROOTED, stacks: 1 },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Deep Roots', description: 'Start of combat: the enemy front row is Rooted.' },
  modifier: {
    stats: { hp: 10, atk: 2 },
    triggers: [on('startOfCombat', 'Deep Roots', [{ kind: 'status', target: 'enemyFrontRow', status: ROOTED, stacks: 1 }])],
  },
  talents: [
    talent('rootwarden/strangle', 'Strangleroot', '+30% ability power.', { abilityPower: 0.3 }),
    talent('rootwarden/bramble-ward', 'Bramble Ward', 'Start of combat: shield the front row for 80% ATK.', trig(
      on('startOfCombat', 'Bramble Ward', [{ kind: 'shield', target: 'allyFrontRow', amount: { atk: 0.8 } }]),
    )),
    talent('rootwarden/sapling-guard', 'Sapling Guard', '+12 HP, +1 DEF.', { stats: { hp: 12, def: 1 } }),
    abilityTalent('rootwarden/earthen-grip', {
      id: 'earthen-grip',
      name: 'Earthen Grip',
      description: 'Every 4th turn: every enemy is Rooted and its ability comes 1 turn later.',
      cooldown: 4,
      effects: [
        { kind: 'status', target: 'allEnemies', status: ROOTED, stacks: 1 },
        { kind: 'cooldown', target: 'allEnemies', turns: 1 },
      ],
    }),
  ],
});

export const SYLVAN_TERTIARY = [lifebinder, bloomcaller, briarheart, rootwarden];

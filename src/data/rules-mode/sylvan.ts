// Rules-mode Sylvan (Milestone 15, Brandon): the heal-over-time healer from
// The Hollowing. Renewal before the blows land; Verdant Keeper heals the whole
// party over time, Thornweaver puts thorns on the front line.
import { GREATER_RENEWAL, RENEWAL, ROOTED, THORNS } from './statuses.ts';
import { advancedTier, afflict, allyBelow, baseClass, hit, lacks, rule, skill, tertiaryTier } from './dsl.ts';

const NATURE = ['nature', 'spirit'];

export const sylvan = baseClass({
  id: 'r-sylvan',
  name: 'Sylvan',
  description: 'Forest spirit who heals over time: Renewal on allies before the blows land.',
  tags: NATURE,
  role: 'support',
  look: 'sylvan',
  baseStats: { hp: 30, atk: 5, def: 1, spd: 9 },
  range: 'ranged',
  placement: 4,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  advancedClasses: ['r-verdant-keeper', 'r-thornweaver'],
  skills: [
    skill('r-bloom', 'Bloom', 2, 'ally', 'Renewal on an ally: it heals 70% ATK at the start of each of its turns, for 3 turns.', [afflict(RENEWAL)], {
      talent: 'Bloom gives Greater Renewal.',
      description: 'Greater Renewal on an ally: it heals 110% ATK at the start of each of its turns, for 3 turns.',
      effects: [afflict(GREATER_RENEWAL)],
    }),
    skill('sap-mend', 'Sap Mend', 2, 'ally', 'Heal an ally for 2 + 80% ATK.', [{ kind: 'heal', target: 'focus', amount: { atk: 0.8, flat: 2 } }]),
    skill('thorn-lash', 'Thorn Lash', 2, 'enemy', '90% ATK.', [hit(0.9)]),
  ],
  rules: [rule('sap-mend', allyBelow(45), 'lowestHpAlly'), rule('r-bloom', lacks(RENEWAL), 'lowestHpAlly'), rule('thorn-lash')],
});

export const verdantKeeper = advancedTier({
  id: 'r-verdant-keeper',
  name: 'Verdant Keeper',
  baseClassId: 'r-sylvan',
  description: 'Renewal on the whole party, and moss shields for the worst hurt.',
  tags: NATURE,
  tertiaryClasses: ['r-lifebinder', 'r-bloomcaller'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 8, atk: 2 }, abilityPower: 0.1 },
  skills: [
    skill('r-wild-bloom', 'Wild Bloom', 3, null, 'Heal every ally for 40% ATK and give each Renewal.', [
      { kind: 'heal', target: 'allAllies', amount: { atk: 0.4 } },
      afflict(RENEWAL, 1, 'allAllies'),
    ]),
    skill('r-mossbed', 'Mossbed', 3, 'ally', 'Shield an ally for 120% ATK.', [{ kind: 'shield', target: 'focus', amount: { atk: 1.2 } }]),
  ],
  rules: [rule('r-wild-bloom', allyBelow(80)), rule('r-mossbed', allyBelow(50), 'lowestHpAlly')],
});

export const thornweaver = advancedTier({
  id: 'r-thornweaver',
  name: 'Thornweaver',
  baseClassId: 'r-sylvan',
  description: 'Healing with a bite: Renewal and Thorns on the front line, roots on the enemy.',
  tags: ['nature', 'wild'],
  tertiaryClasses: ['r-briarheart', 'r-rootwarden'],
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  modifier: { stats: { hp: 10, atk: 1, def: 1 } },
  skills: [
    skill(
      'r-bramble-bloom',
      'Bramble Bloom',
      3,
      null,
      'Renewal and Thorns (melee attackers take 40% ATK) on each ally in the front row.',
      [afflict(RENEWAL, 1, 'allyFrontRow'), afflict(THORNS, 1, 'allyFrontRow')],
      {
        talent: 'Bramble Bloom gives Greater Renewal.',
        description: 'Greater Renewal and Thorns (melee attackers take 40% ATK) on each ally in the front row.',
        effects: [afflict(GREATER_RENEWAL, 1, 'allyFrontRow'), afflict(THORNS, 1, 'allyFrontRow')],
      },
    ),
    skill('r-snare', 'Snare', 3, 'enemy', '50% ATK and Rooted (−3 SPD for 2 turns).', [hit(0.5), afflict(ROOTED)]),
  ],
  rules: [rule('r-bramble-bloom', allyBelow(85)), rule('r-snare', lacks(ROOTED), 'highestAtk')],
});

export const lifebinder = tertiaryTier({
  id: 'r-lifebinder',
  name: 'Lifebinder',
  baseClassId: 'r-sylvan',
  advancedClassId: 'r-verdant-keeper',
  description: 'Heals so steadily that it overflows: healing past full HP becomes a shield.',
  tags: NATURE,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Overflow', description: 'Your healing past full HP becomes a shield (40% of the excess).' },
  modifier: { stats: { hp: 10, atk: 2 }, overhealShield: 0.4 },
  skills: [skill('r-lifebind', 'Lifebind', 4, null, 'Heal every ally for 70% ATK.', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.7 } }])],
  rules: [rule('r-lifebind', allyBelow(70))],
});

export const bloomcaller = tertiaryTier({
  id: 'r-bloomcaller',
  name: 'Bloomcaller',
  baseClassId: 'r-sylvan',
  advancedClassId: 'r-verdant-keeper',
  description: 'Calls spring itself: Greater Renewal on everyone.',
  tags: NATURE,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 8, atk: 3 } },
  skills: [
    skill('r-spring-rain', 'Spring Rain', 4, null, 'Greater Renewal on every ally (heals 110% ATK each turn, for 3 turns).', [afflict(GREATER_RENEWAL, 1, 'allAllies')], {
      talent: 'Spring Rain also heals every ally for 40% ATK.',
      description: 'Heal every ally for 40% ATK and give each Greater Renewal (heals 110% ATK each turn, for 3 turns).',
      effects: [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.4 } }, afflict(GREATER_RENEWAL, 1, 'allAllies')],
    }),
  ],
  rules: [rule('r-spring-rain', allyBelow(75))],
});

export const briarheart = tertiaryTier({
  id: 'r-briarheart',
  name: 'Briarheart',
  baseClassId: 'r-sylvan',
  advancedClassId: 'r-thornweaver',
  description: 'A walking thicket: draws the blows and bristles with thorns.',
  tags: ['nature', 'wild', 'guardian'],
  statWeights: { hp: 5, atk: 2, def: 3, spd: 1 },
  modifier: { stats: { hp: 20, def: 2 }, lifesteal: 0.2 },
  passive: { name: 'Sapdrinker', description: '20% lifesteal (thorns included).' },
  skills: [
    skill(
      'r-heart-of-thorns',
      'Heart of Thorns',
      4,
      null,
      'Taunt for 2 turns, Thorns on yourself and Renewal on every ally.',
      [{ kind: 'taunt', target: 'self', turns: 2 }, afflict(THORNS, 1, 'self'), afflict(RENEWAL, 1, 'allAllies')],
      {
        talent: 'Heart of Thorns gives Greater Renewal.',
        description: 'Taunt for 2 turns, Thorns on yourself and Greater Renewal on every ally.',
        effects: [{ kind: 'taunt', target: 'self', turns: 2 }, afflict(THORNS, 1, 'self'), afflict(GREATER_RENEWAL, 1, 'allAllies')],
      },
    ),
  ],
  rules: [rule('r-heart-of-thorns', allyBelow(70))],
});

export const rootwarden = tertiaryTier({
  id: 'r-rootwarden',
  name: 'Rootwarden',
  baseClassId: 'r-sylvan',
  advancedClassId: 'r-thornweaver',
  description: 'Holds the enemy front row in the forest floor.',
  tags: ['nature', 'wild'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 10, atk: 2 } },
  skills: [
    skill('r-grasping-roots', 'Grasping Roots', 4, null, 'Each enemy in the front row takes 60% ATK and is Rooted.', [
      { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.6 } },
      afflict(ROOTED, 1, 'enemyFrontRow'),
    ]),
  ],
  rules: [rule('r-grasping-roots', { kind: 'enemiesAtLeast', count: 2 })],
});

export const SYLVAN_TREE = [sylvan, verdantKeeper, thornweaver, lifebinder, bloomcaller, briarheart, rootwarden];

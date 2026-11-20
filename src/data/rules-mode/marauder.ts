// Rules-mode Marauder (Milestone 15, Brandon): the villains' brawler. Every
// hit it takes is a Grudge; Haymaker spends them all (and staggers at 3+).
// Juggernaut tanks and hardens; Skullsplitter breaks armour and heads.
import type { Effect } from '../../engine/types.ts';
import { BRITTLE, EMPOWERED, ENRAGED, FORTIFIED, GRUDGE, IRONCLAD, STAGGERED } from './statuses.ts';
import { advancedTier, afflict, allyBelow, baseClass, hit, lacks, rule, selfBelow, selfLacks, skill, tertiaryTier } from './dsl.ts';

const BRAWLER = ['martial', 'shadow'];
const selfStacks = (atLeast: number) => ({ kind: 'selfStacks', status: GRUDGE.id, atLeast }) as const;
const gainGrudge = (stacks = 1): Effect => ({ kind: 'status', target: 'self', status: GRUDGE, stacks });
/** Stagger the focus at 3+ Grudge, then hit it for `atk` + `per` × ATK per Grudge, spending them. */
const haymaker = (atk: number, per: number, consume = true): Effect[] => [
  { kind: 'status', target: 'focus', status: STAGGERED, stacks: 1, selfStacks: { status: GRUDGE.id, atLeast: 3 } },
  hit(atk, { perStack: { status: GRUDGE.id, atk: per, consume, self: true } }),
];
const grudgeOnHurt = { label: 'Grudge', on: 'onHurt' as const, effects: [gainGrudge()] };

export const marauder = baseClass({
  id: 'r-marauder',
  name: 'Marauder',
  description: 'A pit-fighting brute: every hit it takes becomes a Grudge, and Haymaker pays them back.',
  tags: BRAWLER,
  role: 'frontline',
  look: 'marauder',
  baseStats: { hp: 44, atk: 6, def: 2, spd: 7 },
  range: 'melee',
  placement: 0,
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  advancedClasses: ['r-juggernaut', 'r-skullsplitter'],
  passive: { name: 'Grudge', description: 'When hurt, gain 1 Grudge (up to 5).' },
  triggers: [grudgeOnHurt],
  skills: [
    skill('r-haymaker', 'Haymaker', 3, 'enemy', '90% ATK + 30% ATK per Grudge, spending them; at 3+ Grudge the target is Staggered (loses its next turn).', haymaker(0.9, 0.3)),
    skill('goad', 'Goad', 3, null, 'Taunt for 2 turns: enemies must target you.', [{ kind: 'taunt', target: 'self', turns: 2 }], {
      talent: 'Goad lasts 3 turns.',
      description: 'Taunt for 3 turns: enemies must target you.',
      effects: [{ kind: 'taunt', target: 'self', turns: 3 }],
    }),
    skill('jab', 'Jab', 1, 'enemy', '60% ATK and gain 1 Grudge.', [hit(0.6), gainGrudge()]),
  ],
  rules: [rule('goad', allyBelow(50)), rule('r-haymaker', selfStacks(3), 'nearest'), rule('jab', undefined, 'nearest')],
});

export const juggernaut = advancedTier({
  id: 'r-juggernaut',
  name: 'Juggernaut',
  baseClassId: 'r-marauder',
  description: 'Draws every blow, and every blow hardens it.',
  tags: ['martial', 'guardian'],
  tertiaryClasses: ['r-ironhide', 'r-siegebreaker'],
  statWeights: { hp: 5, atk: 2, def: 2, spd: 1 },
  passive: { name: 'Iron Grudge', description: 'When hurt, gain 1 Ironclad (+1 DEF, up to 5).' },
  modifier: { stats: { hp: 14, def: 1 }, triggers: [{ label: 'Iron Grudge', on: 'onHurt', effects: [{ kind: 'status', target: 'self', status: IRONCLAD, stacks: 1 }] }] },
  skills: [
    skill('iron-stance', 'Iron Stance', 3, null, 'Fortified (+6 DEF for 3 turns) and taunt for 2 turns.', [afflict(FORTIFIED, 1, 'self'), { kind: 'taunt', target: 'self', turns: 2 }], {
      talent: 'Iron Stance gives +8 DEF.',
      description: 'Fortified (+8 DEF for 3 turns) and taunt for 2 turns.',
      effects: [afflict(EMPOWERED.fortified, 1, 'self'), { kind: 'taunt', target: 'self', turns: 2 }],
    }),
    skill('r-brace', 'Brace', 4, null, 'Shield yourself for 20% of your max HP.', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.2 } }]),
  ],
  rules: [rule('iron-stance', selfLacks(FORTIFIED)), rule('r-brace', selfBelow(60))],
});

export const skullsplitter = advancedTier({
  id: 'r-skullsplitter',
  name: 'Skullsplitter',
  baseClassId: 'r-marauder',
  description: 'Breaks armour and skulls.',
  tags: BRAWLER,
  tertiaryClasses: ['r-headtaker', 'r-warmonger'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 8, atk: 3 } },
  skills: [
    skill('r-skull-crack', 'Skull Crack', 3, 'enemy', '100% ATK and Brittle (−3 DEF), 40% splash to its neighbours.', [hit(1, { splash: 0.4 }), afflict(BRITTLE)]),
    skill('r-headbutt', 'Headbutt', 4, 'enemy', '50% ATK and Staggered: the target loses its next turn.', [hit(0.5), afflict(STAGGERED)]),
  ],
  rules: [rule('r-headbutt', undefined, 'highestAtk'), rule('r-skull-crack', lacks(BRITTLE), 'nearest')],
});

export const ironhide = tertiaryTier({
  id: 'r-ironhide',
  name: 'Ironhide',
  baseClassId: 'r-marauder',
  advancedClassId: 'r-juggernaut',
  description: 'Shields itself and the line behind it.',
  tags: ['martial', 'guardian'],
  statWeights: { hp: 5, atk: 2, def: 2, spd: 1 },
  modifier: { stats: { hp: 18, def: 2 } },
  skills: [
    skill('r-stone-skin', 'Stone Skin', 4, null, 'Shield yourself for 30% of your max HP and every other ally for 50% ATK.', [
      { kind: 'shield', target: 'self', amount: { maxHp: 0.3 } },
      { kind: 'shield', target: 'otherAllies', amount: { atk: 0.5 } },
    ]),
  ],
  rules: [rule('r-stone-skin', selfBelow(70))],
});

export const siegebreaker = tertiaryTier({
  id: 'r-siegebreaker',
  name: 'Siegebreaker',
  baseClassId: 'r-marauder',
  advancedClassId: 'r-juggernaut',
  description: 'Hits back without letting go of the grudge.',
  tags: ['martial', 'guardian'],
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  modifier: { stats: { hp: 14, atk: 2, def: 1 } },
  skills: [skill('r-retaliate', 'Retaliate', 3, 'enemy', '60% ATK + 40% ATK per Grudge, without spending them.', [hit(0.6, { perStack: { status: GRUDGE.id, atk: 0.4, self: true } })])],
  rules: [rule('r-retaliate', selfStacks(3), 'nearest')],
});

export const headtaker = tertiaryTier({
  id: 'r-headtaker',
  name: 'Headtaker',
  baseClassId: 'r-marauder',
  advancedClassId: 'r-skullsplitter',
  description: 'Goes for the weakest and finishes it.',
  tags: BRAWLER,
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { hp: 8, atk: 4 }, executeBonus: 0.3 },
  passive: { name: 'Trophy Hunter', description: '+30% damage to enemies below half HP.' },
  skills: [skill('r-behead', 'Behead', 4, 'enemy', '130% ATK.', [hit(1.3)])],
  rules: [rule('r-behead', { kind: 'targetHpBelow', percent: 50 }, 'lowestHp')],
});

export const warmonger = tertiaryTier({
  id: 'r-warmonger',
  name: 'Warmonger',
  baseClassId: 'r-marauder',
  advancedClassId: 'r-skullsplitter',
  description: 'Fires up the whole war band.',
  tags: BRAWLER,
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  modifier: { stats: { hp: 10, atk: 2 } },
  skills: [
    skill('war-roar', 'Battle Roar', 4, null, 'Every ally is Enraged (+4 ATK for 3 turns).', [afflict(ENRAGED, 1, 'allAllies')], {
      talent: 'Battle Roar gives +5 ATK.',
      description: 'Every ally is Enraged (+5 ATK for 3 turns).',
      effects: [afflict(EMPOWERED.enraged, 1, 'allAllies')],
    }),
  ],
  rules: [rule('war-roar', selfLacks(ENRAGED))],
});

export const MARAUDER_TREE = [marauder, juggernaut, skullsplitter, ironhide, siegebreaker, headtaker, warmonger];

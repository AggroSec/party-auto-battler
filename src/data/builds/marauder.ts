// Marauder (Milestone 15, Brandon): the villains' front-line brawler. Where
// the Berserker grows stronger as it bleeds and the Monk switches stances, the
// Marauder holds a grudge: every hit it takes is a Grudge (up to 5), and its
// Haymaker pays them all back at once (staggering the target at 3+).
// Juggernaut is the tank, Skullsplitter the bruiser. Unlocked by finishing
// The Black Covenant.
import type { ClassDef } from '../class-types.ts';
import type { Effect, TargetSelector } from '../../engine/types.ts';
import { BRITTLE, GRUDGE, IRONCLAD, STAGGERED } from '../rules-mode/statuses.ts';
import { abilityTalent, advanced, on, talent, talentIds, trig } from './dsl.ts';

/** Gain Grudge. */
export const grudge = (stacks = 1): Effect => ({ kind: 'status', target: 'self', status: GRUDGE, stacks });

/** A Haymaker: Stagger the target at 3+ Grudge, then hit it for `atk` + `per` × ATK per Grudge, spending them. */
export function haymaker(atk: number, per: number, target: TargetSelector = 'nearest', extra: Partial<Extract<Effect, { kind: 'damage' }>> = {}): Effect[] {
  return [
    { kind: 'status', target, status: STAGGERED, stacks: 1, selfStacks: { status: GRUDGE.id, atLeast: 3 } },
    { kind: 'damage', target, amount: { atk }, perStack: { status: GRUDGE.id, atk: per, consume: true, self: true }, ...extra },
  ];
}

export const marauderTalents = [
  talent('marauder/thick-skull', 'Thick Skull', '+10 HP, +1 DEF.', { stats: { hp: 10, def: 1 } }),
  talent('marauder/bad-blood', 'Bad Blood', 'When hurt, 30% chance: 1 more Grudge.', trig(on('onHurt', 'Bad Blood', [grudge()], { chance: 0.3 }))),
  talent('marauder/knuckle-dusters', 'Knuckle Dusters', '+3 ATK.', { stats: { atk: 3 } }),
  talent('marauder/dirty-fighting', 'Dirty Fighting', '25% on attack: Brittle on the target (−3 DEF for 4 turns).', trig(
    on('onAttack', 'Dirty Fighting', [{ kind: 'status', target: 'triggerTarget', status: BRITTLE, stacks: 1 }], { chance: 0.25 }),
  )),
];

export const juggernaut = advanced({
  id: 'juggernaut',
  name: 'Juggernaut',
  baseClassId: 'marauder',
  description: 'Draws every blow onto itself, and every blow hardens it.',
  tags: ['martial', 'guardian'],
  ability: {
    id: 'come-at-me',
    name: 'Come At Me',
    description: 'Every 3rd turn: taunt for 2 turns, then a Haymaker: 70% ATK + 30% ATK per Grudge to the nearest enemy (Staggered at 3+ Grudge).',
    cooldown: 3,
    effects: [{ kind: 'taunt', target: 'self', turns: 2 }, ...haymaker(0.7, 0.3)],
  },
  statWeights: { hp: 5, atk: 2, def: 2, spd: 1 },
  passive: { name: 'Iron Grudge', description: 'When hurt, gain 1 Ironclad (+1 DEF, up to 5).' },
  modifier: {
    stats: { hp: 14, def: 1 },
    triggers: [on('onHurt', 'Iron Grudge', [{ kind: 'status', target: 'self', status: IRONCLAD, stacks: 1 }])],
  },
  talents: [
    talent('juggernaut/scar-tissue', 'Scar Tissue', '+15 HP.', { stats: { hp: 15 } }),
    talent('juggernaut/iron-gut', 'Iron Gut', '+2 DEF.', { stats: { def: 2 } }),
    talent('juggernaut/spite', 'Spite', 'When hurt, 20% chance: deal 50% ATK to the attacker.', trig(
      on('onHurt', 'Spite', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.5 } }], { chance: 0.2 }),
    )),
    abilityTalent('juggernaut/brace', {
      id: 'brace',
      name: 'Brace',
      description: 'Every 4th turn: shield yourself for 20% of your max HP.',
      cooldown: 4,
      effects: [{ kind: 'shield', target: 'self', amount: { maxHp: 0.2 } }],
    }),
  ],
});

export const skullsplitter = advanced({
  id: 'skullsplitter',
  name: 'Skullsplitter',
  baseClassId: 'marauder',
  description: 'Cracks skulls: its Haymaker breaks armour and spills onto the neighbours.',
  tags: ['martial', 'shadow'],
  ability: {
    id: 'skull-crack',
    name: 'Skull Crack',
    description:
      'Every 3rd turn: Brittle on the nearest enemy (−3 DEF for 4 turns), then a Haymaker: 100% ATK + 35% ATK per Grudge, 40% splash to its neighbours (Staggered at 3+ Grudge).',
    cooldown: 3,
    effects: [{ kind: 'status', target: 'nearest', status: BRITTLE, stacks: 1 }, ...haymaker(1, 0.35, 'nearest', { splash: 0.4 })],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Blood Feud', description: 'On kill: gain 2 Grudge.' },
  modifier: { stats: { hp: 8, atk: 3 }, triggers: [on('onKill', 'Blood Feud', [grudge(2)])] },
  talents: [
    talent('skullsplitter/heavy-hands', 'Heavy Hands', '+3 ATK.', { stats: { atk: 3 } }),
    talent('skullsplitter/brutality', 'Brutality', '+25% ability power.', { abilityPower: 0.25 }),
    talent('skullsplitter/cheap-shot', 'Cheap Shot', 'Start of combat: Stagger the nearest enemy (it loses its next turn).', trig(
      on('startOfCombat', 'Cheap Shot', [{ kind: 'status', target: 'nearest', status: STAGGERED, stacks: 1 }]),
    )),
    abilityTalent('skullsplitter/headbutt', {
      id: 'headbutt',
      name: 'Headbutt',
      description: 'Every 4th turn: deal 80% ATK to the nearest enemy and Stagger it.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 0.8 } },
        { kind: 'status', target: 'nearest', status: STAGGERED, stacks: 1 },
      ],
    }),
  ],
});

export const marauderClass: ClassDef = {
  id: 'marauder',
  name: 'Marauder',
  role: 'frontline',
  tags: ['martial', 'shadow'],
  unlockable: true,
  description: 'A pit-fighting brute who holds a grudge: every hit it takes, it pays back at once.',
  baseStats: { hp: 44, atk: 6, def: 2, spd: 7 },
  range: 'melee',
  placement: 0,
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  talents: talentIds(marauderTalents),
  advancedClasses: ['juggernaut', 'skullsplitter'],
  attackTarget: 'nearest',
  ability: {
    id: 'haymaker',
    name: 'Haymaker',
    description: 'Every 3rd turn: deal 90% ATK + 30% ATK per Grudge to the nearest enemy, spending them; at 3+ Grudge it’s Staggered (loses its next turn).',
    cooldown: 3,
    effects: haymaker(0.9, 0.3),
  },
  passive: { name: 'Grudge', description: 'When hurt, gain 1 Grudge (up to 5).' },
  triggers: [on('onHurt', 'Grudge', [grudge()])],
};

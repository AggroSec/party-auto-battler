// Mercenary (after the Adventurer, Brandon's design): a hired blade. He breaks
// limbs (Broken Limb: −1 SPD each, up to 4) and gets paid for every win. The
// Brute line builds on Broken Limbs; the Man-at-Arms line builds on weapons.
import type { ClassDef } from '../class-types.ts';
import { BROKEN_LIMB } from '../statuses.ts';
import { abilityTalent, advanced, on, talent, talentIds, trig } from './dsl.ts';

const breakLimb = (target: 'triggerTarget' | 'nearest' | 'enemyFrontRow' | 'allEnemies', stacks = 1) =>
  ({ kind: 'status', target, status: BROKEN_LIMB, stacks }) as const;

export const mercenaryTalents = [
  talent('mercenary/bone-crusher', 'Bone Crusher', 'Basic attacks have a 25% chance to break a limb.', trig(
    on('onAttack', 'Bone Crusher', [breakLimb('triggerTarget')], { chance: 0.25 }),
  )),
  talent('mercenary/dirty-fighting', 'Dirty Fighting', 'Start of combat: break a limb on the nearest enemy.', trig(
    on('startOfCombat', 'Dirty Fighting', [breakLimb('nearest')]),
  )),
  talent('mercenary/hardened', 'Hardened', '+2 DEF, +8 HP.', { stats: { def: 2, hp: 8 } }),
  talent('mercenary/weapon-familiarity', 'Weapon Familiarity', 'Start of combat: gain +1 ATK per weapon you carry.', trig(
    on('startOfCombat', 'Weapon Familiarity', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { weapons: 1 } }]),
  )),
];

export const brute = advanced({
  id: 'brute',
  name: 'Brute',
  baseClassId: 'mercenary',
  description: 'All muscle: hits hard and leaves the enemy with broken bones.',
  tags: ['martial'],
  ability: {
    id: 'crushing-blow',
    name: 'Crushing Blow',
    description: 'Every 3rd turn: deal 180% ATK to the nearest enemy and break 2 of its limbs.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.8 } },
      breakLimb('nearest', 2),
    ],
  },
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  passive: { name: 'Bonebreaker', description: 'Basic attacks have a 30% chance to break a limb.' },
  modifier: {
    stats: { hp: 14, atk: 3 },
    triggers: [on('onAttack', 'Bonebreaker', [breakLimb('triggerTarget')], { chance: 0.3 })],
  },
  talents: [
    talent('brute/heavy-hands', 'Heavy Hands', '+3 ATK.', { stats: { atk: 3 } }),
    talent('brute/kneecapper', 'Kneecapper', 'Basic attacks have another 30% chance to break a limb.', trig(
      on('onAttack', 'Kneecapper', [breakLimb('triggerTarget')], { chance: 0.3 }),
    )),
    talent('brute/thick-hide', 'Thick Hide', '+2 DEF, +10 HP.', { stats: { def: 2, hp: 10 } }),
    talent('brute/pile-on', 'Pile On', 'Basic attacks deal an extra 30% ATK to enemies with 2 or more broken limbs.', trig(
      on('onAttack', 'Pile On', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.3 }, requires: { status: BROKEN_LIMB.id, stacks: 2 } }]),
    )),
  ],
});

export const manAtArms = advanced({
  id: 'man-at-arms',
  name: 'Man-at-Arms',
  baseClassId: 'mercenary',
  description: 'Weapon specialist: trained with every blade, and better for each one he carries.',
  tags: ['martial'],
  ability: {
    id: 'weapon-flurry',
    name: 'Weapon Flurry',
    description: 'Every 3rd turn: hit the nearest enemy twice for 85% ATK + 2 per weapon you carry.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 0.85, weapons: 2 }, hits: 2 }],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Drilled', description: 'Start of combat: gain +1 ATK per weapon you carry.' },
  modifier: {
    stats: { hp: 10, atk: 3, spd: 1 },
    triggers: [on('startOfCombat', 'Drilled', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { weapons: 1 } }])],
  },
  talents: [
    talent('man-at-arms/quick-hands', 'Quick Hands', '+2 SPD.', { stats: { spd: 2 } }),
    talent('man-at-arms/honed-edges', 'Honed Edges', 'Start of combat: gain another +1 ATK per weapon you carry.', trig(
      on('startOfCombat', 'Honed Edges', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { weapons: 1 } }]),
    )),
    talent('man-at-arms/parry', 'Parry', 'When hurt, 25% chance to shield yourself for 4 + 2 per weapon you carry.', trig(
      on('onHurt', 'Parry', [{ kind: 'shield', target: 'self', amount: { flat: 4, weapons: 2 } }], { chance: 0.25 }),
    )),
    abilityTalent('man-at-arms/sweeping-cut', {
      id: 'sweeping-cut',
      name: 'Sweeping Cut',
      description: 'Every 4th turn: deal 70% ATK to each enemy in the front row.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.7 } }],
    }),
  ],
});

export const mercenaryClass: ClassDef = {
  id: 'mercenary',
  name: 'Mercenary',
  role: 'striker',
  tags: ['martial'],
  unlockable: true,
  description: 'Hired blade: breaks limbs, earns gold for every win.',
  baseStats: { hp: 36, atk: 6, def: 1, spd: 9 },
  range: 'melee',
  placement: 1,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  talents: talentIds(mercenaryTalents),
  advancedClasses: ['brute', 'man-at-arms'],
  attackTarget: 'nearest',
  ability: {
    id: 'low-blow',
    name: 'Low Blow',
    description: 'Every 3rd turn: deal 120% ATK to the nearest enemy and break one of its limbs.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.2 } },
      breakLimb('nearest'),
    ],
  },
  passive: { name: 'Hazard Pay', description: '+1 gold after every won fight.' },
  triggers: [],
  goldPerWin: 1,
};

// Mercenary tertiary classes (level 7): Brute → Headsman / Maimer,
// Man-at-Arms → Oathsworn / Walking Armory.
import { BROKEN_LIMB } from '../../statuses.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

const LIMB = BROKEN_LIMB.id;
const breakLimb = (target: 'triggerTarget' | 'nearest' | 'enemyFrontRow' | 'allEnemies', stacks = 1) =>
  ({ kind: 'status', target, status: BROKEN_LIMB, stacks }) as const;
/** Maimer: the target loses a random stat, 1 + 10% of the hit that just landed. */
const maim = (target: 'triggerTarget' | 'nearest' | 'enemyFrontRow') =>
  ({ kind: 'debuff', target, stat: 'random', amount: { flat: 1, lastHit: 0.1 } }) as const;

export const headsman = tertiary({
  id: 'headsman',
  name: 'Headsman',
  baseClassId: 'mercenary',
  advancedClassId: 'brute',
  description: 'Breaks every limb, then takes the head: executes anyone with 4 broken limbs.',
  tags: ['martial'],
  ability: {
    id: 'hamstring',
    name: 'Hamstring',
    description: 'Every 3rd turn: deal 150% ATK to the nearest enemy and break 2 of its limbs.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.5 } },
      breakLimb('nearest', 2),
    ],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Execution', description: 'When a basic attack hits an enemy with 4 broken limbs, use them up to deal another 400% ATK.' },
  modifier: {
    stats: { hp: 12, atk: 3 },
    triggers: [
      on('onAttack', 'Execution', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 4 }, requires: { status: LIMB, stacks: 4, consume: true } }]),
    ],
  },
  talents: [
    talent('headsman/sharpened-axe', 'Sharpened Axe', '+4 ATK.', { stats: { atk: 4 } }),
    talent('headsman/butchers-eye', "Butcher's Eye", 'Basic attacks have a 30% chance to break a limb.', trig(
      on('onAttack', "Butcher's Eye", [breakLimb('triggerTarget')], { chance: 0.3 }),
    )),
    talent('headsman/next', 'Next!', 'On kill, break 2 limbs on the nearest enemy.', trig(on('onKill', 'Next!', [breakLimb('nearest', 2)]))),
    abilityTalent('headsman/wide-swing', {
      id: 'wide-swing',
      name: 'Wide Swing',
      description: 'Every 4th turn: deal 90% ATK to each enemy in the front row and break one limb on each.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.9 } },
        breakLimb('enemyFrontRow'),
      ],
    }),
  ],
});

export const maimer = tertiary({
  id: 'maimer',
  name: 'Maimer',
  baseClassId: 'mercenary',
  advancedClassId: 'brute',
  description: 'Cripples instead of kills: every broken limb also saps a random stat, more for harder hits.',
  tags: ['martial'],
  ability: {
    id: 'shatter',
    name: 'Shatter',
    description: 'Every 3rd turn: deal 140% ATK to the nearest enemy, break one of its limbs, and it loses a random stat (ATK, DEF or SPD): 1 + 10% of the damage dealt.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.4 } },
      breakLimb('nearest'),
      maim('nearest'),
    ],
  },
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  passive: {
    name: 'Crippling Blows',
    description: 'Basic attacks have a 35% chance to break a limb, and the target loses a random stat (ATK, DEF or SPD): 1 + 10% of the damage dealt.',
  },
  modifier: {
    stats: { hp: 12, atk: 2, def: 1 },
    triggers: [on('onAttack', 'Crippling Blows', [breakLimb('triggerTarget'), maim('triggerTarget')], { chance: 0.35 })],
  },
  talents: [
    talent('maimer/savage', 'Savage', '+3 ATK, +6 HP.', { stats: { atk: 3, hp: 6 } }),
    talent('maimer/shattering-blows', 'Shattering Blows', 'Basic attacks deal an extra 30% ATK to enemies with 3 or more broken limbs.', trig(
      on('onAttack', 'Shattering Blows', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.3 }, requires: { status: LIMB, stacks: 3 } }]),
    )),
    talent('maimer/terrifying', 'Terrifying', 'Start of combat: break a limb on every enemy.', trig(on('startOfCombat', 'Terrifying', [breakLimb('allEnemies')]))),
    abilityTalent('maimer/ground-and-pound', {
      id: 'ground-and-pound',
      name: 'Ground and Pound',
      description: 'Every 4th turn: deal 80% ATK to each enemy in the front row; each loses a random stat (ATK, DEF or SPD): 1 + 10% of the damage dealt.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.8 } },
        maim('enemyFrontRow'),
      ],
    }),
  ],
});

export const oathsworn = tertiary({
  id: 'oathsworn',
  name: 'Oathsworn',
  baseClassId: 'mercenary',
  advancedClassId: 'man-at-arms',
  description: 'Sworn to one weapon: a third slot for it, it counts twice, and his hits can be critical.',
  tags: ['martial'],
  ability: {
    id: 'oath-strike',
    name: 'Oath Strike',
    description: 'Every 3rd turn: deal 180% ATK + 3 per weapon you carry to the nearest enemy.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 1.8, weapons: 3 } }],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: {
    name: 'Sworn Weapon',
    description: 'A third item slot, for weapons only. Your first weapon counts twice. 15% chance for each hit to be critical (double damage).',
  },
  modifier: { stats: { hp: 10, atk: 2 }, critChance: 0.15 },
  items: { slots: 3, maxNonWeapons: 2, doubleFirstWeapon: true },
  talents: [
    talent('oathsworn/keen-edge', 'Keen Edge', '+10% critical hit chance.', { critChance: 0.1 }),
    talent('oathsworn/perfect-form', 'Perfect Form', '+3 ATK, +1 SPD.', { stats: { atk: 3, spd: 1 } }),
    talent('oathsworn/riposte', 'Riposte', 'When hurt, 30% chance to deal 100% ATK back to the attacker.', trig(
      on('onHurt', 'Riposte', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 1 } }], { chance: 0.3 }),
    )),
    abilityTalent('oathsworn/flawless-cut', {
      id: 'flawless-cut',
      name: 'Flawless Cut',
      description: 'Every 4th turn: deal 250% ATK to the weakest enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'lowestHp', amount: { atk: 2.5 } }],
    }),
  ],
});

export const walkingArmory = tertiary({
  id: 'walking-armory',
  name: 'Walking Armory',
  baseClassId: 'mercenary',
  advancedClassId: 'man-at-arms',
  description: 'Carries four weapons and keeps switching between them, getting stronger with every swap.',
  tags: ['martial'],
  ability: {
    id: 'arsenal',
    name: 'Arsenal',
    description: 'Every 3rd turn: hit random enemies 4 times for 50% ATK + 1 per weapon you carry.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.5, weapons: 1 }, hits: 4 }],
  },
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  passive: {
    name: 'Weapon Swap',
    description: 'Four item slots, for weapons only (items you already carry stay). Each of your first 4 turns, you switch weapons and gain +1 ATK per weapon you carry.',
  },
  modifier: {
    stats: { hp: 12, atk: 1 },
    triggers: [on('onTurnStart', 'Weapon Swap', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { weapons: 1 } }], { limit: 4 })],
  },
  items: { slots: 4, maxNonWeapons: 0 },
  talents: [
    talent('walking-armory/quick-draw', 'Quick Draw', '+2 SPD.', { stats: { spd: 2 } }),
    talent('walking-armory/spare-blades', 'Spare Blades', 'Start of combat: shield yourself for 3 per weapon you carry.', trig(
      on('startOfCombat', 'Spare Blades', [{ kind: 'shield', target: 'self', amount: { weapons: 3 } }]),
    )),
    talent('walking-armory/heavy-load', 'Heavy Load', '+12 HP, +2 DEF.', { stats: { hp: 12, def: 2 } }),
    abilityTalent('walking-armory/hurl-weapons', {
      id: 'hurl-weapons',
      name: 'Hurl Weapons',
      description: 'Every 4th turn: deal 50% ATK + 3 per weapon you carry to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5, weapons: 3 } }],
    }),
  ],
});

export const MERCENARY_TERTIARY = [headsman, maimer, oathsworn, walkingArmory];

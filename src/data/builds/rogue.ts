import type { ClassDef } from '../class-types.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

export const rogueTalents = [
  talent('rogue/poison', 'Poisoned Blades', 'Basic attacks strip 1 DEF from the target.', trig(
    on('onAttack', 'Poison', [{ kind: 'debuff', target: 'triggerTarget', stat: 'def', amount: { flat: 1 } }]),
  )),
  talent('rogue/shadowstep', 'Shadowstep', 'Fight at full strength from the back row. +2 SPD.', { reach: true, stats: { spd: 2 } }),
  talent('rogue/opportunist', 'Opportunist', 'On kill, your next ability comes 2 turns sooner.', trig(
    on('onKill', 'Opportunist', [{ kind: 'cooldown', target: 'self', turns: -2 }]),
  )),
  talent('rogue/evasion', 'Evasion', 'Start of combat: shield yourself for 6.', trig(
    on('startOfCombat', 'Evasion', [{ kind: 'shield', target: 'self', amount: { flat: 6 } }]),
  )),
];

export const assassin = advanced({
  id: 'assassin',
  name: 'Assassin',
  baseClassId: 'rogue',
  description: 'Burst killer who deletes the back row.',
  tags: ['shadow'],
  ability: {
    id: 'assassinate',
    name: 'Assassinate',
    description: 'Every 3rd turn: deal 320% ATK to the weakest back-row enemy.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 3.2 } }],
  },
  passive: { name: 'Vanish', description: 'On kill, shield yourself for 8.' },
  modifier: {
    stats: { atk: 3, hp: 4, spd: 1 },
    triggers: [on('onKill', 'Vanish', [{ kind: 'shield', target: 'self', amount: { flat: 8 } }])],
  },
  talents: [
    talent('assassin/execute', 'Execute', '+50% ability power.', { abilityPower: 0.5 }),
    talent('assassin/tempo', 'Lethal Tempo', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    talent('assassin/toxin', 'Toxin', 'Basic attacks deal 3 extra piercing damage.', trig(
      on('onAttack', 'Toxin', [{ kind: 'damage', target: 'triggerTarget', amount: { flat: 3 }, pierce: true }]),
    )),
    talent('assassin/smoke-bomb', 'Smoke Bomb', 'When bloodied, shield 30% max HP and gain +3 SPD.', trig(
      on('onBloodied', 'Smoke Bomb', [
        { kind: 'shield', target: 'self', amount: { maxHp: 0.3 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 3 } },
      ]),
    )),
  ],
});

export const duelist = advanced({
  id: 'duelist',
  name: 'Duelist',
  baseClassId: 'rogue',
  description: 'Precise fencer who fights from anywhere and punishes attackers.',
  tags: ['martial'],
  ability: {
    id: 'flurry',
    name: 'Flurry',
    description: 'Every 3rd turn: strike the nearest enemy three times for 80% ATK.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 0.8 }, hits: 3 }],
  },
  passive: { name: 'Riposte', description: 'Reach: full damage from the back row. 35% when hurt: strike the attacker for 80% ATK.' },
  modifier: {
    stats: { def: 2, hp: 4 },
    reach: true,
    triggers: [
      on('onHurt', 'Riposte', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.8 } }], { chance: 0.35 }),
    ],
  },
  talents: [
    talent('duelist/en-garde', 'En Garde', '+3 DEF.', { stats: { def: 3 } }),
    talent('duelist/lunge', 'Lunge', '30% on attack: strike again for 60% ATK.', trig(
      on('onAttack', 'Lunge', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.6 } }], { chance: 0.3 }),
    )),
    talent('duelist/flourish', 'Flourish', 'After Flurry, gain +1 ATK.', trig(
      on('onAbility', 'Flourish', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 1 } }]),
    )),
    talent('duelist/vengeance', 'Vengeance', '25% when hurt: deal 50% ATK piercing to the attacker.', trig(
      on('onHurt', 'Vengeance', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.5 }, pierce: true }], { chance: 0.25 }),
    )),
  ],
});

export const rogueClass: ClassDef = {
  id: 'rogue',
  name: 'Rogue',
  role: 'striker',
  tags: ['martial', 'shadow'],
  unlockable: false,
  description: 'Fast striker who slips past the front line to finish off the back row.',
  baseStats: { hp: 24, atk: 6, def: 1, spd: 13 },
  range: 'melee',
  placement: 1,
  statWeights: { hp: 1, atk: 3, def: 1, spd: 4 },
  talents: talentIds(rogueTalents),
  advancedClasses: ['assassin', 'duelist'],
  attackTarget: 'nearest',
  ability: {
    id: 'backstab',
    name: 'Backstab',
    description: 'Every 3rd turn: deal 200% ATK to the weakest back-row enemy.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 2 } }],
  },
  passive: { name: 'Bloodlust', description: 'On kill, gain +2 ATK.' },
  triggers: [
    {
      label: 'Bloodlust',
      on: 'onKill',
      effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }],
    },
  ],
};

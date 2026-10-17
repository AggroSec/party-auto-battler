import { advanced, on, talent, trig } from './dsl.ts';

export const rangerTalents = [
  talent('ranger/keen-eye', 'Keen Eye', '+2 ATK.', { stats: { atk: 2 } }),
  talent('ranger/rapid-fire', 'Rapid Fire', '20% on attack: your next Volley comes a turn sooner.', trig(
    on('onAttack', 'Rapid Fire', [{ kind: 'cooldown', target: 'self', turns: -1 }], { chance: 0.2 }),
  )),
  talent('ranger/camouflage', 'Camouflage', 'Start of combat: shield yourself for 6.', trig(
    on('startOfCombat', 'Camouflage', [{ kind: 'shield', target: 'self', amount: { flat: 6 } }]),
  )),
  talent('ranger/mark-prey', 'Mark Prey', 'Start of combat: the strongest enemy loses 2 DEF.', trig(
    on('startOfCombat', 'Mark Prey', [{ kind: 'debuff', target: 'highestAtk', stat: 'def', amount: { flat: 2 } }]),
  )),
];

export const sharpshooter = advanced({
  id: 'sharpshooter',
  name: 'Sharpshooter',
  baseClassId: 'ranger',
  description: 'Sniper who picks off the most dangerous enemy.',
  tags: ['martial'],
  ability: {
    id: 'aimed-shot',
    name: 'Aimed Shot',
    description: 'Every 3rd turn: deal 250% ATK piercing to the strongest enemy.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'highestAtk', amount: { atk: 2.5 }, pierce: true }],
  },
  modifier: {
    stats: { atk: 3 },
    triggers: [on('onKill', 'Reload', [{ kind: 'cooldown', target: 'self', turns: -2 }])],
  },
  talents: [
    talent('sharpshooter/deadeye', 'Deadeye', '+50% ability power.', { abilityPower: 0.5 }),
    talent('sharpshooter/piercing', 'Piercing Arrows', 'Basic attacks deal an extra 30% ATK as piercing damage.', trig(
      on('onAttack', 'Piercing Arrows', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.3 }, pierce: true }]),
    )),
    talent('sharpshooter/steady-aim', 'Steady Aim', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    talent('sharpshooter/killshot', 'Killshot', 'On kill, gain +2 ATK.', trig(
      on('onKill', 'Killshot', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }]),
    )),
  ],
});

export const beastmaster = advanced({
  id: 'beastmaster',
  name: 'Beastmaster',
  baseClassId: 'ranger',
  description: 'Leads the pack: many quick strikes and party-wide buffs.',
  tags: ['wild'],
  ability: {
    id: 'call-the-pack',
    name: 'Call the Pack',
    description: 'Every 3rd turn: four strikes at random enemies for 70% ATK each.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.7 }, hits: 4 }],
  },
  modifier: {
    stats: { hp: 6, spd: 1 },
    triggers: [on('startOfCombat', 'Pack Leader', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }])],
  },
  talents: [
    talent('beastmaster/alpha', 'Alpha', 'Start of combat: all allies gain +1 SPD.', trig(
      on('startOfCombat', 'Alpha', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('beastmaster/savage-bite', 'Savage Bite', '30% on attack: strip 1 DEF from the target.', trig(
      on('onAttack', 'Savage Bite', [{ kind: 'debuff', target: 'triggerTarget', stat: 'def', amount: { flat: 1 } }], { chance: 0.3 }),
    )),
    talent('beastmaster/thick-hide', 'Thick Hide', '+8 HP, +1 DEF.', { stats: { hp: 8, def: 1 } }),
    talent('beastmaster/feral-bond', 'Feral Bond', 'When an ally falls, gain +3 ATK.', trig(
      on('onAllyDeath', 'Feral Bond', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } }]),
    )),
  ],
});

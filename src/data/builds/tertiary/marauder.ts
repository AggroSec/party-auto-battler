// Marauder tertiary classes (level 7, Milestone 15): Juggernaut → Ironhide /
// Siegebreaker, Skullsplitter → Headtaker / Warmonger.
import { ENRAGED, THORNS } from '../../rules-mode/statuses.ts';
import { grudge, haymaker } from '../marauder.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const ironhide = tertiary({
  id: 'ironhide',
  name: 'Ironhide',
  baseClassId: 'marauder',
  advancedClassId: 'juggernaut',
  description: 'Shrugs it all off: taunts, shields itself and hits back.',
  tags: ['martial', 'guardian'],
  ability: {
    id: 'iron-wall',
    name: 'Iron Wall',
    description: 'Every 3rd turn: taunt for 2 turns and shield yourself for 100% ATK + 200% DEF, then a Haymaker: 70% ATK + 30% ATK per Grudge.',
    cooldown: 3,
    effects: [
      { kind: 'taunt', target: 'self', turns: 2 },
      { kind: 'shield', target: 'self', amount: { atk: 1, def: 2 } },
      ...haymaker(0.7, 0.3),
    ],
  },
  statWeights: { hp: 5, atk: 2, def: 2, spd: 1 },
  passive: { name: 'Second Skin', description: 'When bloodied, shield yourself for 30% of your max HP.' },
  modifier: { stats: { hp: 18, def: 2 }, triggers: [on('onBloodied', 'Second Skin', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.3 } }])] },
  talents: [
    talent('ironhide/plating', 'Plating', '+3 DEF.', { stats: { def: 3 } }),
    talent('ironhide/bulk', 'Bulk', '+20 HP.', { stats: { hp: 20 } }),
    talent('ironhide/rally', 'Shoulder to Shoulder', 'When bloodied, shield every ally for 80% ATK.', trig(
      on('onBloodied', 'Shoulder to Shoulder', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.8 } }]),
    )),
    abilityTalent('ironhide/stone-skin', {
      id: 'stone-skin',
      name: 'Stone Skin',
      description: 'Every 4th turn: shield yourself for 25% of your max HP.',
      cooldown: 4,
      effects: [{ kind: 'shield', target: 'self', amount: { maxHp: 0.25 } }],
    }),
  ],
});

export const siegebreaker = tertiary({
  id: 'siegebreaker',
  name: 'Siegebreaker',
  baseClassId: 'marauder',
  advancedClassId: 'juggernaut',
  description: 'Punishes everyone who hits it.',
  tags: ['martial', 'guardian'],
  ability: {
    id: 'retaliate',
    name: 'Retaliate',
    description: 'Every 3rd turn: taunt for 2 turns, then a Haymaker: 60% ATK + 40% ATK per Grudge, 30% splash to its neighbours.',
    cooldown: 3,
    effects: [{ kind: 'taunt', target: 'self', turns: 2 }, ...haymaker(0.6, 0.4, 'nearest', { splash: 0.3 })],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Payback', description: 'When hurt, 35% chance: deal 60% ATK to the attacker.' },
  modifier: {
    stats: { hp: 14, atk: 2, def: 1 },
    triggers: [on('onHurt', 'Payback', [{ kind: 'damage', target: 'triggerSource', amount: { atk: 0.6 } }], { chance: 0.35 })],
  },
  talents: [
    talent('siegebreaker/spiked-mail', 'Spiked Mail', '+2 DEF. Start of combat: Thorns on yourself.', {
      stats: { def: 2 },
      triggers: [on('startOfCombat', 'Spiked Mail', [{ kind: 'status', target: 'self', status: THORNS, stacks: 1 }])],
    }),
    talent('siegebreaker/grudge-match', 'Grudge Match', '+3 ATK.', { stats: { atk: 3 } }),
    talent('siegebreaker/never-forget', 'Never Forget', 'Start of combat: gain 3 Grudge.', trig(on('startOfCombat', 'Never Forget', [grudge(3)]))),
    abilityTalent('siegebreaker/ground-slam', {
      id: 'ground-slam',
      name: 'Ground Slam',
      description: 'Every 4th turn: deal 70% ATK to each enemy in the front row.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.7 } }],
    }),
  ],
});

export const headtaker = tertiary({
  id: 'headtaker',
  name: 'Headtaker',
  baseClassId: 'marauder',
  advancedClassId: 'skullsplitter',
  description: 'Finishes what it starts: goes for the weakest, and every kill feeds the grudge.',
  tags: ['martial', 'shadow'],
  ability: {
    id: 'behead',
    name: 'Behead',
    description: 'Every 3rd turn: a Haymaker on the enemy with the lowest HP: 110% ATK + 35% ATK per Grudge (Staggered at 3+ Grudge).',
    cooldown: 3,
    effects: haymaker(1.1, 0.35, 'lowestHp'),
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Trophy Hunter', description: '+50% damage to enemies below half HP.' },
  modifier: { stats: { hp: 8, atk: 4 }, executeBonus: 0.5 },
  talents: [
    talent('headtaker/trophies', 'Trophies', 'On kill: +2 ATK.', trig(on('onKill', 'Trophies', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }]))),
    talent('headtaker/keen-axe', 'Keen Axe', '+15% critical hit chance.', { critChance: 0.15 }),
    talent('headtaker/grim', 'Grim Work', '+3 ATK.', { stats: { atk: 3 } }),
    abilityTalent('headtaker/cleaving-blow', {
      id: 'cleaving-blow',
      name: 'Cleaving Blow',
      description: 'Every 4th turn: deal 90% ATK to the nearest enemy, 50% splash to its neighbours.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 0.9 }, splash: 0.5 }],
    }),
  ],
});

export const warmonger = tertiary({
  id: 'warmonger',
  name: 'Warmonger',
  baseClassId: 'marauder',
  advancedClassId: 'skullsplitter',
  description: 'Every grudge it settles fires up the war band.',
  tags: ['martial', 'shadow'],
  ability: {
    id: 'rallying-blow',
    name: 'Rallying Blow',
    description: 'Every 3rd turn: a Haymaker: 90% ATK + 30% ATK per Grudge to the nearest enemy (Staggered at 3+ Grudge), then every ally gains +1 ATK.',
    cooldown: 3,
    effects: [...haymaker(0.9, 0.3), { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }],
  },
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  passive: { name: 'Warmonger', description: 'Start of combat: every ally gains +2 ATK.' },
  modifier: {
    stats: { hp: 10, atk: 2 },
    triggers: [on('startOfCombat', 'Warmonger', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } }])],
  },
  talents: [
    talent('warmonger/war-paint', 'War Paint', '+25% ability power.', { abilityPower: 0.25 }),
    talent('warmonger/blood-and-thunder', 'Blood and Thunder', 'When an ally falls, gain 3 Grudge.', trig(on('onAllyDeath', 'Blood and Thunder', [grudge(3)]))),
    talent('warmonger/drums', 'War Drums', 'Start of combat: every ally gains +1 SPD.', trig(
      on('startOfCombat', 'War Drums', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }]),
    )),
    abilityTalent('warmonger/battle-roar', {
      id: 'battle-roar',
      name: 'Battle Roar',
      description: 'Every 4th turn: every ally is Enraged (+4 ATK for 3 turns).',
      cooldown: 4,
      effects: [{ kind: 'status', target: 'allAllies', status: ENRAGED, stacks: 1 }],
    }),
  ],
});

export const MARAUDER_TERTIARY = [ironhide, siegebreaker, headtaker, warmonger];

// Sylvan (Milestone 14, Brandon): a healer over time. Where the Cleric heals in
// bursts and the Cultist pays in blood, the Sylvan lays Renewal on allies
// before the damage lands, so it shines in longer fights and against chip
// damage, and is weakest against burst. Unlocked by finishing The Hollowing.
import type { ClassDef } from '../class-types.ts';
import { RENEWAL, ROOTED, THORNS } from '../statuses.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

const renew = (target: 'allyFrontRow' | 'allAllies' | 'lowestHpAlly' | 'self' | 'otherAllies', status = RENEWAL) =>
  ({ kind: 'status', target, status, stacks: 1 }) as const;

export const sylvanTalents = [
  talent('sylvan/sap', 'Rising Sap', '+25% ability power (bigger Renewals).', { abilityPower: 0.25 }),
  talent('sylvan/dewfall', 'Dewfall', 'Start of combat: shield all allies for 50% ATK.', trig(
    on('startOfCombat', 'Dewfall', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.5 } }]),
  )),
  talent('sylvan/seed-of-life', 'Seed of Life', 'When an ally falls, give every ally Renewal.', trig(
    on('onAllyDeath', 'Seed of Life', [renew('allAllies')]),
  )),
  talent('sylvan/heartwood-bark', 'Heartwood Bark', '+10 HP, +1 DEF.', { stats: { hp: 10, def: 1 } }),
];

export const verdantKeeper = advanced({
  id: 'verdant-keeper',
  name: 'Verdant Keeper',
  baseClassId: 'sylvan',
  description: 'Pure healing over time: Renewal on the whole party, and a little mending every turn.',
  tags: ['nature', 'spirit'],
  ability: {
    id: 'wild-bloom',
    name: 'Wild Bloom',
    description: 'Every 3rd turn: heal every ally for 50% ATK and give each Renewal (heals 70% ATK at the start of each of its turns, for 3 turns).',
    cooldown: 3,
    effects: [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } }, renew('allAllies')],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Overgrowth', description: 'At the start of each of your turns, heal the most wounded ally for 30% ATK.' },
  modifier: {
    stats: { hp: 8, atk: 2 },
    triggers: [on('onTurnStart', 'Overgrowth', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.3 } }])],
  },
  talents: [
    talent('verdant-keeper/lush', 'Lush Growth', '+30% ability power.', { abilityPower: 0.3 }),
    talent('verdant-keeper/early-spring', 'Early Spring', 'Start of combat: give every ally Renewal.', trig(
      on('startOfCombat', 'Early Spring', [renew('allAllies')]),
    )),
    talent('verdant-keeper/perennial', 'Perennial', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    talent('verdant-keeper/mossbed', 'Mossbed', 'After your ability, shield the most wounded ally for 60% ATK.', trig(
      on('onAbility', 'Mossbed', [{ kind: 'shield', target: 'lowestHpAlly', amount: { atk: 0.6 } }]),
    )),
  ],
});

export const thornweaver = advanced({
  id: 'thornweaver',
  name: 'Thornweaver',
  baseClassId: 'sylvan',
  description: 'Healing with a bite: Renewal and Thorns on the front line, so whoever hits it bleeds for it.',
  tags: ['nature', 'wild'],
  ability: {
    id: 'bramble-bloom',
    name: 'Bramble Bloom',
    description: 'Every 3rd turn: give each ally in the front row Renewal and Thorns (melee attackers take 40% ATK, for 3 turns), then deal 80% ATK to the nearest enemy.',
    cooldown: 3,
    effects: [
      renew('allyFrontRow'),
      { kind: 'status', target: 'allyFrontRow', status: THORNS, stacks: 1 },
      { kind: 'damage', target: 'nearest', amount: { atk: 0.8 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Briar Skin', description: 'Start of combat: Thorns on every ally in the front row.' },
  modifier: {
    stats: { hp: 10, atk: 1, def: 1 },
    triggers: [on('startOfCombat', 'Briar Skin', [{ kind: 'status', target: 'allyFrontRow', status: THORNS, stacks: 1 }])],
  },
  talents: [
    talent('thornweaver/barbs', 'Barbed Vines', '+3 ATK (sharper Thorns, bigger Renewals).', { stats: { atk: 3 } }),
    talent('thornweaver/snare', 'Snaring Growth', 'After your ability, Root the nearest enemy (−3 SPD for 2 turns).', trig(
      on('onAbility', 'Snaring Growth', [{ kind: 'status', target: 'nearest', status: ROOTED, stacks: 1 }]),
    )),
    talent('thornweaver/sap-armor', 'Sap Armor', 'Start of combat: the front row gains +1 DEF.', trig(
      on('startOfCombat', 'Sap Armor', [{ kind: 'buff', target: 'allyFrontRow', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('thornweaver/regrowth', 'Thorny Regrowth', 'When hurt, 25% chance: give yourself Renewal.', trig(
      on('onHurt', 'Thorny Regrowth', [renew('self')], { chance: 0.25 }),
    )),
  ],
});

export const sylvanClass: ClassDef = {
  id: 'sylvan',
  name: 'Sylvan',
  role: 'support',
  tags: ['nature', 'spirit'],
  unlockable: true,
  description: 'Forest spirit who heals over time: Renewal on allies before the blows land.',
  baseStats: { hp: 30, atk: 5, def: 1, spd: 9 },
  range: 'ranged',
  placement: 4,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  talents: talentIds(sylvanTalents),
  advancedClasses: ['verdant-keeper', 'thornweaver'],
  attackTarget: 'nearest',
  ability: {
    id: 'bloom',
    name: 'Bloom',
    description: 'Every 2nd turn: give each ally in the front row Renewal (heals 70% ATK at the start of each of its turns, for 3 turns).',
    cooldown: 2,
    effects: [renew('allyFrontRow')],
  },
  passive: { name: 'Rootbound', description: 'Start of combat: Renewal on the most wounded ally and yourself.' },
  triggers: [on('startOfCombat', 'Rootbound', [renew('lowestHpAlly'), renew('self')])],
};

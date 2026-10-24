// Runeblade (post-M7, Brandon's design): an arcane warrior that carves Runes
// into enemies; at 5 Runes they detonate. Each path changes what the
// detonation does: Spellblade spreads it, Duskblade heals with it.
import type { ClassDef } from '../class-types.ts';
import { RUNE, SEARING } from '../statuses.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

/** A Runeblade's onBurst trigger: fires when Runes it carved detonate. */
export const onDetonate = (label: string, effects: Parameters<typeof on>[2], opts: Parameters<typeof on>[3] = {}) => ({
  ...on('onBurst', label, effects, opts),
  status: RUNE.id,
});

export const runebladeTalents = [
  talent('runeblade/searing-runes', 'Searing Runes', 'Basic attacks also sear the target: 20% ATK damage per turn, stacking up to 5, for 3 turns.', trig(
    on('onAttack', 'Searing Runes', [{ kind: 'status', target: 'triggerTarget', status: SEARING, stacks: 1 }]),
  )),
  talent('runeblade/deep-carving', 'Deep Carving', 'After casting, carve 1 more Rune into the nearest enemy.', trig(
    on('onAbility', 'Deep Carving', [{ kind: 'status', target: 'nearest', status: RUNE, stacks: 1 }]),
  )),
  talent('runeblade/runic-ward', 'Runic Ward', 'When your Runes detonate, shield yourself for 100% ATK.', trig(
    onDetonate('Runic Ward', [{ kind: 'shield', target: 'self', amount: { atk: 1 } }]),
  )),
  talent('runeblade/volatile-runes', 'Volatile Runes', 'Detonations also deal 60% ATK to the target and its row neighbours.', trig(
    onDetonate('Volatile Runes', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.6 }, splash: 1 }]),
  )),
];

export const spellblade = advanced({
  id: 'spellblade',
  name: 'Spellblade',
  baseClassId: 'runeblade',
  description: 'Elemental Runes: every detonation spills onto the target’s neighbours.',
  tags: ['arcane', 'martial'],
  ability: {
    id: 'elemental-edge',
    name: 'Elemental Edge',
    description: 'Every 3rd turn: carve 1 Rune into each enemy in the front row, then deal 120% ATK to the nearest enemy.',
    cooldown: 3,
    effects: [
      { kind: 'status', target: 'enemyFrontRow', status: RUNE, stacks: 1 },
      { kind: 'damage', target: 'nearest', amount: { atk: 1.2 } },
    ],
  },
  passive: { name: 'Elemental Runes', description: 'Detonations also deal 50% ATK to the target and its row neighbours.' },
  modifier: {
    stats: { hp: 6, atk: 2 },
    triggers: [onDetonate('Elemental Runes', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.5 }, splash: 1 }])],
  },
  talents: [
    talent('spellblade/arc-runes', 'Arc Runes', 'When your Runes detonate, your next ability comes 1 turn sooner.', trig(
      onDetonate('Arc Runes', [{ kind: 'cooldown', target: 'self', turns: -1 }]),
    )),
    talent('spellblade/frost-runes', 'Frost Runes', 'Detonations chill the target: it loses 2 SPD.', trig(
      onDetonate('Frost Runes', [{ kind: 'debuff', target: 'triggerTarget', stat: 'spd', amount: { flat: 2 } }]),
    )),
    talent('spellblade/runic-focus', 'Runic Focus', '+30% ability power.', { abilityPower: 0.3 }),
    talent('spellblade/quick-carving', 'Quick Carving', 'Basic attacks have a 35% chance to carve an extra Rune.', trig(
      on('onAttack', 'Quick Carving', [{ kind: 'status', target: 'triggerTarget', status: RUNE, stacks: 1 }], { chance: 0.35 }),
    )),
  ],
});

export const duskblade = advanced({
  id: 'duskblade',
  name: 'Duskblade',
  baseClassId: 'runeblade',
  description: 'Twilight Runes: light and shadow at once. Detonations mend the party.',
  // Both divine and shadow: counts as Light and as Dark.
  tags: ['arcane', 'divine', 'shadow'],
  ability: {
    id: 'twilight-edge',
    name: 'Twilight Edge',
    description: 'Every 3rd turn: deal 120% ATK to the nearest enemy and carve 2 Runes into it, then heal the most wounded ally for 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.2 } },
      { kind: 'status', target: 'nearest', status: RUNE, stacks: 2 },
      { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.6 } },
    ],
  },
  passive: { name: 'Balance', description: 'When your Runes detonate, heal the most wounded ally for 100% ATK.' },
  modifier: {
    stats: { hp: 6, atk: 2 },
    triggers: [onDetonate('Balance', [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1 } }])],
  },
  talents: [
    talent('duskblade/dusk-ward', 'Dusk Ward', 'When your Runes detonate, shield the most wounded ally for 100% ATK.', trig(
      onDetonate('Dusk Ward', [{ kind: 'shield', target: 'lowestHpAlly', amount: { atk: 1 } }]),
    )),
    talent('duskblade/shadow-edge', 'Shadow Edge', '+15% lifesteal.', { lifesteal: 0.15 }),
    talent('duskblade/waning-light', 'Waning Light', 'When an ally falls, carve 2 Runes into every enemy.', trig(
      on('onAllyDeath', 'Waning Light', [{ kind: 'status', target: 'allEnemies', status: RUNE, stacks: 2 }]),
    )),
    talent('duskblade/twin-runes', 'Twin Runes', 'After casting, carve 1 Rune into a random enemy.', trig(
      on('onAbility', 'Twin Runes', [{ kind: 'status', target: 'randomEnemy', status: RUNE, stacks: 1 }]),
    )),
  ],
});

export const runebladeClass: ClassDef = {
  id: 'runeblade',
  name: 'Runeblade',
  role: 'striker',
  tags: ['arcane', 'martial'],
  unlockable: true,
  description: 'Arcane warrior: every hit carves a Rune, and 5 Runes detonate.',
  baseStats: { hp: 36, atk: 6, def: 2, spd: 10 },
  range: 'melee',
  placement: 1,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  talents: talentIds(runebladeTalents),
  advancedClasses: ['spellblade', 'duskblade'],
  attackTarget: 'nearest',
  ability: {
    id: 'runestrike',
    name: 'Runestrike',
    description: 'Every 3rd turn: deal 110% ATK to the nearest enemy and carve 2 Runes into it.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'nearest', amount: { atk: 1.1 } },
      { kind: 'status', target: 'nearest', status: RUNE, stacks: 2 },
    ],
  },
  passive: { name: 'Runic Detonation', description: 'Basic attacks carve 1 Rune. At 5 Runes they detonate for 250% ATK.' },
  triggers: [
    on('onAttack', 'Runic Detonation', [{ kind: 'status', target: 'triggerTarget', status: RUNE, stacks: 1 }]),
    onDetonate('Runic Detonation', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 2.5 } }]),
  ],
};

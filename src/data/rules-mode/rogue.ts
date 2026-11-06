// Rules-mode Rogue: Assassin (nuke: Nightblade, Phantom) or Venomancer
// (afflictions: Plaguebringer spreads them, Envenomer cashes them in).
import { FEVER, HASTED, MARKED, POISON, WEAKNESS } from './statuses.ts';
import { advancedTier, afflict, afflictions, baseClass, hit, lacks, rule, selfBelow, selfLacks, selfStatus, skill, tertiaryTier } from './dsl.ts';

export const rogue = baseClass({
  id: 'r-rogue',
  name: 'Rogue',
  description: 'Fast striker: backstabs the weak and poisons the rest.',
  tags: ['shadow'],
  role: 'striker',
  look: 'rogue',
  baseStats: { hp: 26, atk: 6, def: 1, spd: 13 },
  range: 'melee',
  placement: 1,
  statWeights: { hp: 2, atk: 4, def: 1, spd: 3 },
  advancedClasses: ['r-assassin', 'venomancer'],
  skills: [
    skill('backstab', 'Backstab', 2, 'enemy', '150% ATK.', [hit(1.5)]),
    skill('poison-blade', 'Poison Blade', 2, 'enemy', '50% ATK and Poison.', [hit(0.5), afflict(POISON)]),
    skill('vanish', 'Vanish', 5, null, 'Shield yourself for 100% ATK + 10% max HP.', [{ kind: 'shield', target: 'self', amount: { atk: 1, maxHp: 0.1 } }]),
  ],
  rules: [rule('vanish', selfBelow(50)), rule('poison-blade', lacks(POISON)), rule('backstab', undefined, 'lowestHp')],
});

export const assassin = advancedTier({
  id: 'r-assassin',
  name: 'Assassin',
  baseClassId: 'r-rogue',
  description: 'Marks a target, then deletes it.',
  tags: ['shadow'],
  tertiaryClasses: ['nightblade', 'phantom'],
  statWeights: { hp: 2, atk: 5, def: 1, spd: 2 },
  modifier: { stats: { atk: 3, spd: 1 } },
  skills: [
    skill('death-mark', 'Death Mark', 3, 'enemy', 'Marked: +25% damage taken for 3 turns.', [afflict(MARKED)]),
    skill('assassinate', 'Assassinate', 3, 'enemy', '200% ATK.', [hit(2)]),
  ],
  rules: [rule('assassinate', { kind: 'targetHas', status: MARKED.id }, 'lowestHp'), rule('death-mark', lacks(MARKED), 'lowestHp')],
});

export const venomancer = advancedTier({
  id: 'venomancer',
  name: 'Venomancer',
  baseClassId: 'r-rogue',
  description: 'Toxins that weaken and stack up afflictions for the party.',
  tags: ['shadow'],
  tertiaryClasses: ['plaguebringer', 'envenomer'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { atk: 1, hp: 6 } },
  skills: [
    skill('toxin', 'Toxin', 2, 'enemy', '40% ATK and 2 Poison.', [hit(0.4), afflict(POISON, 2)]),
    skill('cripple', 'Cripple', 2, 'enemy', '40% ATK and Weakness (−3 ATK).', [hit(0.4), afflict(WEAKNESS)]),
  ],
  rules: [rule('cripple', lacks(WEAKNESS), 'highestAtk'), rule('toxin', undefined, 'mostAfflicted')],
});

export const nightblade = tertiaryTier({
  id: 'nightblade',
  name: 'Nightblade',
  baseClassId: 'r-rogue',
  advancedClassId: 'r-assassin',
  description: 'One strike from the shadows, straight through armour.',
  tags: ['shadow'],
  statWeights: { hp: 2, atk: 6, def: 0, spd: 2 },
  modifier: { stats: { atk: 4 } },
  skills: [skill('shadowstrike', 'Shadowstrike', 4, 'enemy', '320% ATK, ignoring DEF.', [hit(3.2, { pierce: true })])],
  rules: [rule('shadowstrike', { kind: 'targetHas', status: MARKED.id }, 'lowestHp')],
});

export const phantom = tertiaryTier({
  id: 'phantom',
  name: 'Phantom',
  baseClassId: 'r-rogue',
  advancedClassId: 'r-assassin',
  description: 'Everywhere at once: knives for everyone, and blinding speed.',
  tags: ['shadow'],
  statWeights: { hp: 2, atk: 4, def: 1, spd: 3 },
  modifier: { stats: { atk: 2, spd: 2 } },
  skills: [
    skill('fan-of-knives', 'Fan of Knives', 3, null, '70% ATK to every enemy.', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }]),
    skill('shadow-dance', 'Shadow Dance', 4, null, 'Hasted: +4 SPD for 3 turns.', [selfStatus(HASTED)]),
  ],
  rules: [rule('shadow-dance', selfLacks(HASTED)), rule('fan-of-knives', { kind: 'enemiesAtLeast', count: 3 })],
});

export const plaguebringer = tertiaryTier({
  id: 'plaguebringer',
  name: 'Plaguebringer',
  baseClassId: 'r-rogue',
  advancedClassId: 'venomancer',
  description: 'Spreads poison and fever through the whole enemy line.',
  tags: ['shadow'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 8, atk: 1 } },
  skills: [
    skill('toxic-cloud', 'Toxic Cloud', 4, null, '30% ATK and Poison to every enemy.', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.3 } }, afflict(POISON, 1, 'allEnemies')]),
    skill('fever-dart', 'Fever Dart', 2, 'enemy', '40% ATK and Fever (heals on it are halved).', [hit(0.4), afflict(FEVER)]),
  ],
  rules: [rule('toxic-cloud'), rule('fever-dart', lacks(FEVER), 'mostAfflicted')],
});

export const envenomer = tertiaryTier({
  id: 'envenomer',
  name: 'Envenomer',
  baseClassId: 'r-rogue',
  advancedClassId: 'venomancer',
  description: 'Lets the venom work, then strikes for every affliction it finds.',
  tags: ['shadow'],
  statWeights: { hp: 2, atk: 5, def: 1, spd: 2 },
  modifier: { stats: { atk: 3 } },
  skills: [skill('virulent-strike', 'Virulent Strike', 3, 'enemy', '80% ATK + 40% ATK per affliction on the target.', [hit(0.8, { perAffliction: 0.4 })])],
  rules: [rule('virulent-strike', afflictions(2), 'mostAfflicted')],
});

export const ROGUE_TREE = [rogue, assassin, venomancer, nightblade, phantom, plaguebringer, envenomer];

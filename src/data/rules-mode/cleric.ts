// Rules-mode Cleric: Priest (healer: Oracle prevents, Saint saves) or
// Inquisitor (damage and afflictions: Zealot nukes, Templar silences).
import { BLESSED, BRITTLE, BURN, HUSH, MARKED } from './statuses.ts';
import { advancedTier, afflict, afflictions, allyBelow, baseClass, hit, lacks, rule, skill, tertiaryTier } from './dsl.ts';

const healAlly = (atk: number, flat = 0) => ({ kind: 'heal' as const, target: 'focus' as const, amount: { atk, flat } });

export const cleric = baseClass({
  id: 'r-cleric',
  name: 'Cleric',
  description: 'Healer: mends wounds, purges afflictions and smites.',
  tags: ['divine'],
  role: 'support',
  look: 'cleric',
  baseStats: { hp: 30, atk: 4, def: 2, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  advancedClasses: ['r-priest', 'r-inquisitor'],
  skills: [
    skill('heal', 'Heal', 1, 'ally', 'Heal an ally for 4 + 120% ATK.', [healAlly(1.2, 4)]),
    skill('purify', 'Purify', 2, 'ally', 'Remove an affliction from an ally and heal it for 40% ATK.', [{ kind: 'cure', target: 'focus', count: 1 }, healAlly(0.4)]),
    skill('smite', 'Smite', 2, 'enemy', '110% ATK.', [hit(1.1)]),
  ],
  rules: [rule('heal', allyBelow(60)), rule('purify', afflictions(1), 'mostAfflictedAlly'), rule('smite')],
});

export const priest = advancedTier({
  id: 'r-priest',
  name: 'Priest',
  baseClassId: 'r-cleric',
  description: 'Keeps everyone standing with group heals and wards.',
  tags: ['divine'],
  tertiaryClasses: ['r-oracle', 'saint'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 10, atk: 1 }, abilityPower: 0.2 },
  skills: [
    skill('mend', 'Mend', 3, null, 'Heal every ally for 80% ATK.', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.8 } }]),
    skill('ward', 'Ward', 2, 'ally', 'Shield an ally for 4 + 170% ATK.', [{ kind: 'shield', target: 'focus', amount: { flat: 4, atk: 1.7 } }]),
  ],
  rules: [rule('mend', allyBelow(70)), rule('ward', allyBelow(85))],
});

export const inquisitor = advancedTier({
  id: 'r-inquisitor',
  name: 'Inquisitor',
  baseClassId: 'r-cleric',
  description: 'Holy fire and condemnation: afflicts heretics for the party.',
  tags: ['divine'],
  tertiaryClasses: ['zealot', 'r-templar'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 3, hp: 10 } },
  skills: [
    skill('condemn', 'Condemn', 2, 'enemy', '90% ATK and Brittle (−3 DEF).', [hit(0.9), afflict(BRITTLE)]),
    skill('holy-fire', 'Holy Fire', 2, 'enemy', '70% ATK and Burn.', [hit(0.7), afflict(BURN)]),
  ],
  rules: [rule('condemn', lacks(BRITTLE), 'mostAfflicted'), rule('holy-fire', lacks(BURN), 'mostAfflicted')],
});

export const oracle = tertiaryTier({
  id: 'r-oracle',
  name: 'Oracle',
  baseClassId: 'r-cleric',
  advancedClassId: 'r-priest',
  description: 'Sees harm coming: shields the party and cleanses everyone at once.',
  tags: ['divine'],
  statWeights: { hp: 3, atk: 4, def: 2, spd: 1 },
  modifier: { stats: { hp: 10, def: 1 } },
  skills: [
    skill('sanctuary', 'Sanctuary', 4, null, 'Shield every ally for 90% ATK.', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.9 } }]),
    skill('cleanse', 'Cleanse', 3, null, 'Remove an affliction from every ally.', [{ kind: 'cure', target: 'allAllies', count: 1 }]),
  ],
  rules: [rule('cleanse', afflictions(2), 'mostAfflictedAlly'), rule('sanctuary')],
});

export const saint = tertiaryTier({
  id: 'saint',
  name: 'Saint',
  baseClassId: 'r-cleric',
  advancedClassId: 'r-priest',
  description: 'Miracles: huge heals, and an angel that won’t let an ally die.',
  tags: ['divine'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { hp: 8, atk: 2 } },
  skills: [
    skill('miracle', 'Miracle', 3, 'ally', 'Heal an ally for 300% ATK.', [healAlly(3)]),
    skill('guardian-angel', 'Guardian Angel', 5, 'ally', 'Blessed: the ally can’t drop below 1 HP for 2 turns.', [afflict(BLESSED)]),
  ],
  rules: [rule('guardian-angel', { kind: 'targetHpBelow', percent: 30 }), rule('miracle', allyBelow(45))],
});

export const zealot = tertiaryTier({
  id: 'zealot',
  name: 'Zealot',
  baseClassId: 'r-cleric',
  advancedClassId: 'r-inquisitor',
  description: 'Righteous wrath that grows with every sin on the target.',
  tags: ['divine'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 4, hp: 10 } },
  skills: [
    skill('wrath', 'Wrath', 3, 'enemy', '140% ATK + 60% ATK per affliction on the target.', [hit(1.4, { perAffliction: 0.6 })]),
    skill('judgment', 'Judgment', 4, null, '60% ATK to every enemy.', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } }]),
  ],
  rules: [rule('wrath', afflictions(2), 'mostAfflicted'), rule('judgment', { kind: 'enemiesAtLeast', count: 3 })],
});

export const templar = tertiaryTier({
  id: 'r-templar',
  name: 'Templar',
  baseClassId: 'r-cleric',
  advancedClassId: 'r-inquisitor',
  description: 'Silences casters and marks heretics for the party to punish.',
  tags: ['divine', 'guardian'],
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  modifier: { stats: { hp: 12, atk: 1 } },
  skills: [
    skill('silence-heretic', 'Silence Heretic', 4, 'enemy', '50% ATK and Hush: no skills or abilities for 2 turns.', [hit(0.5), afflict(HUSH)]),
    skill('penance', 'Penance', 3, 'enemy', '60% ATK and Marked: +25% damage taken for 3 turns.', [hit(0.6), afflict(MARKED)]),
  ],
  rules: [rule('silence-heretic', lacks(HUSH), 'highestAtk'), rule('penance', lacks(MARKED), 'mostAfflicted')],
});

export const CLERIC_TREE = [cleric, priest, inquisitor, oracle, saint, zealot, templar];

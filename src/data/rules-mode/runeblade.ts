// Rules-mode Runeblade: carves Runes into enemies and detonates them.
// Spellblade (damage: Stormblade, Blademaster) or Runecarver (afflictions:
// Runelord detonates everyone, Spellbreaker shuts casters down).
import { BRITTLE, ENCHANTED, HUSH, RUNE_MARK } from './statuses.ts';
import { advancedTier, afflict, afflictions, baseClass, hit, lacks, rule, selfLacks, selfStatus, skill, tertiaryTier } from './dsl.ts';

const runes = (atLeast: number) => ({ kind: 'targetStacks' as const, status: RUNE_MARK.id, atLeast });
const detonate = (atk: number, perRune: number) => hit(atk, { perStack: { status: RUNE_MARK.id, atk: perRune, consume: true } });

export const runeblade = baseClass({
  id: 'r-runeblade',
  name: 'Runeblade',
  description: 'Spellsword: carves Runes with every strike and detonates them.',
  tags: ['martial', 'arcane'],
  role: 'striker',
  look: 'runeblade',
  baseStats: { hp: 36, atk: 6, def: 2, spd: 10 },
  range: 'melee',
  placement: 1,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  advancedClasses: ['r-spellblade', 'runecarver'],
  skills: [
    skill('rune-strike', 'Rune Strike', 1, 'enemy', '80% ATK and a Rune (up to 5).', [hit(0.8), afflict(RUNE_MARK)]),
    skill('detonate', 'Detonate', 3, 'enemy', '50% ATK + 40% ATK per Rune on the target; the Runes are used up.', [detonate(0.5, 0.4)]),
    skill('enchant', 'Enchant Blade', 4, null, 'Enchanted: +3 ATK for 3 turns.', [selfStatus(ENCHANTED)]),
  ],
  rules: [rule('enchant', selfLacks(ENCHANTED)), rule('detonate', runes(3)), rule('rune-strike')],
});

export const spellblade = advancedTier({
  id: 'r-spellblade',
  name: 'Spellblade',
  baseClassId: 'r-runeblade',
  description: 'Arcane steel that cuts through armour and sows Runes down the line.',
  tags: ['martial', 'arcane'],
  tertiaryClasses: ['r-stormblade', 'blademaster'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 3, hp: 6 } },
  skills: [
    skill('arcane-slash', 'Arcane Slash', 2, 'enemy', '130% ATK, ignoring DEF.', [hit(1.3, { pierce: true })]),
    skill('rune-burst', 'Rune Burst', 3, null, '40% ATK and a Rune to each enemy in the front row.', [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.4 } }, afflict(RUNE_MARK, 1, 'enemyFrontRow')]),
  ],
  rules: [rule('rune-burst', { kind: 'enemiesAtLeast', count: 2 }), rule('arcane-slash')],
});

export const runecarver = advancedTier({
  id: 'runecarver',
  name: 'Runecarver',
  baseClassId: 'r-runeblade',
  description: 'Runes that weaken and bind: afflictions for the whole party to use.',
  tags: ['martial', 'arcane'],
  tertiaryClasses: ['runelord', 'r-spellbreaker'],
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  modifier: { stats: { hp: 12, def: 2, atk: 1 } },
  skills: [
    skill('sigil-of-frailty', 'Sigil of Frailty', 2, 'enemy', '40% ATK, Brittle (−3 DEF) and a Rune.', [hit(0.4), afflict(BRITTLE), afflict(RUNE_MARK)]),
    skill('binding-rune', 'Binding Rune', 4, 'enemy', 'Hush (no skills or abilities for 2 turns) and a Rune.', [afflict(HUSH), afflict(RUNE_MARK)]),
  ],
  rules: [rule('binding-rune', lacks(HUSH), 'highestAtk'), rule('sigil-of-frailty', lacks(BRITTLE), 'mostAfflicted')],
});

export const stormblade = tertiaryTier({
  id: 'r-stormblade',
  name: 'Stormblade',
  baseClassId: 'r-runeblade',
  advancedClassId: 'r-spellblade',
  description: 'Lightning leaps from its blade across the enemy line.',
  tags: ['martial', 'arcane'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 3 } },
  skills: [skill('chain-lightning', 'Chain Lightning', 3, null, 'Hit random enemies 4 times for 50% ATK.', [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.5 }, hits: 4 }])],
  rules: [rule('chain-lightning')],
});

export const blademaster = tertiaryTier({
  id: 'blademaster',
  name: 'Blademaster',
  baseClassId: 'r-runeblade',
  advancedClassId: 'r-spellblade',
  description: 'A flurry of cuts on one target.',
  tags: ['martial', 'arcane'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 3, spd: 1 } },
  skills: [skill('thousand-cuts', 'Thousand Cuts', 4, 'enemy', 'Hit the target 5 times for 45% ATK.', [hit(0.45, { hits: 5 })])],
  rules: [rule('thousand-cuts', undefined, 'lowestHp')],
});

export const runelord = tertiaryTier({
  id: 'runelord',
  name: 'Runelord',
  baseClassId: 'r-runeblade',
  advancedClassId: 'runecarver',
  description: 'Detonates every Rune on the field at once.',
  tags: ['martial', 'arcane'],
  statWeights: { hp: 3, atk: 4, def: 2, spd: 1 },
  modifier: { stats: { atk: 2, hp: 8 } },
  skills: [
    skill('glyph-burst', 'Glyph Burst', 4, null, 'Each enemy takes 30% ATK + 45% ATK per Rune on it; the Runes are used up.', [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.3 }, perStack: { status: RUNE_MARK.id, atk: 0.45, consume: true } },
    ]),
  ],
  rules: [rule('glyph-burst', runes(2), 'mostAfflicted')],
});

export const spellbreaker = tertiaryTier({
  id: 'r-spellbreaker',
  name: 'Spellbreaker',
  baseClassId: 'r-runeblade',
  advancedClassId: 'runecarver',
  description: 'Punishes the afflicted: hits harder for every affliction on its target.',
  tags: ['martial', 'arcane'],
  statWeights: { hp: 3, atk: 4, def: 2, spd: 1 },
  modifier: { stats: { atk: 2, def: 1 } },
  skills: [skill('nullify', 'Nullify', 3, 'enemy', '90% ATK + 40% ATK per affliction on the target.', [hit(0.9, { perAffliction: 0.4 })])],
  rules: [rule('nullify', afflictions(2), 'mostAfflicted')],
});

export const RUNEBLADE_TREE = [runeblade, spellblade, runecarver, stormblade, blademaster, runelord, spellbreaker];

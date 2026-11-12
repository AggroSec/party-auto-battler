// Rules-mode Mage: Pyromancer (fire: Flamecaller nukes, Ashbringer burns and
// cashes in afflictions) or Chronomancer (time: Timeweaver supports, Riftmage locks).
import { BIND, BRITTLE, BURN, HASTED, SLOWED, EMPOWERED } from './statuses.ts';
import { advancedTier, afflict, afflictions, allyBelow, baseClass, hit, lacks, rule, selfBelow, skill, tertiaryTier } from './dsl.ts';

export const mage = baseClass({
  id: 'r-mage',
  name: 'Mage',
  description: 'Ranged caster: firebolts, burns and a mana shield.',
  tags: ['arcane'],
  role: 'caster',
  look: 'mage',
  baseStats: { hp: 24, atk: 7, def: 0, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 5, def: 0, spd: 2 },
  advancedClasses: ['r-pyromancer', 'r-chronomancer'],
  skills: [
    skill('firebolt', 'Firebolt', 1, 'enemy', '100% ATK.', [hit(1)]),
    skill('ignite', 'Ignite', 2, 'enemy', '40% ATK and Burn.', [hit(0.4), afflict(BURN)]),
    skill('mana-shield', 'Mana Shield', 4, null, 'Shield yourself for 150% ATK.', [{ kind: 'shield', target: 'self', amount: { atk: 1.5 } }]),
  ],
  rules: [rule('mana-shield', selfBelow(60)), rule('ignite', lacks(BURN)), rule('firebolt')],
});

export const pyromancer = advancedTier({
  id: 'r-pyromancer',
  name: 'Pyromancer',
  baseClassId: 'r-mage',
  description: 'Fireballs and infernos: damage for everyone.',
  tags: ['arcane'],
  tertiaryClasses: ['flamecaller', 'ashbringer'],
  statWeights: { hp: 3, atk: 5, def: 0, spd: 2 },
  modifier: { stats: { atk: 3 } },
  skills: [
    skill('fireball', 'Fireball', 3, 'enemy', '140% ATK, and 50% of it to the target’s row neighbours.', [hit(1.4, { splash: 0.5 })]),
    skill('inferno', 'Inferno', 4, null, '70% ATK to every enemy.', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }]),
  ],
  rules: [rule('inferno', { kind: 'enemiesAtLeast', count: 3 }), rule('fireball')],
});

export const chronomancer = advancedTier({
  id: 'r-chronomancer',
  name: 'Chronomancer',
  baseClassId: 'r-mage',
  description: 'Bends time: slows enemies and hastens friends.',
  tags: ['arcane'],
  tertiaryClasses: ['timeweaver', 'riftmage'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { spd: 3, hp: 10, atk: 1 } },
  skills: [
    skill('slow', 'Slow', 2, 'enemy', '60% ATK and Slowed (−4 SPD).', [hit(0.6), afflict(SLOWED)]),
    skill('haste', 'Haste', 3, 'ally', 'Hasted: +4 SPD for 3 turns.', [afflict(HASTED)], {
      talent: 'Haste gives +5 SPD.',
      description: 'Hasted: +5 SPD for 3 turns.',
      effects: [afflict(EMPOWERED.hasted)],
    }),
  ],
  rules: [rule('haste', { kind: 'targetLacks', status: HASTED.id }, 'self'), rule('slow', lacks(SLOWED), 'highestAtk')],
});

export const flamecaller = tertiaryTier({
  id: 'flamecaller',
  name: 'Flamecaller',
  baseClassId: 'r-mage',
  advancedClassId: 'r-pyromancer',
  description: 'Calls down meteors.',
  tags: ['arcane'],
  statWeights: { hp: 2, atk: 6, def: 0, spd: 2 },
  modifier: { stats: { atk: 4 } },
  skills: [skill('meteor', 'Meteor', 5, 'enemy', '260% ATK, and 50% of it to the target’s row neighbours.', [hit(2.6, { splash: 0.5 })])],
  rules: [rule('meteor')],
});

export const ashbringer = tertiaryTier({
  id: 'ashbringer',
  name: 'Ashbringer',
  baseClassId: 'r-mage',
  advancedClassId: 'r-pyromancer',
  description: 'Scorches armour away, then combusts everything that’s burning.',
  tags: ['arcane'],
  statWeights: { hp: 3, atk: 5, def: 0, spd: 2 },
  modifier: { stats: { atk: 2, hp: 6 } },
  skills: [
    skill('scorch', 'Scorch', 2, 'enemy', '40% ATK and Brittle (−3 DEF).', [hit(0.4), afflict(BRITTLE)]),
    skill('combust', 'Combust', 3, 'enemy', '70% ATK + 60% ATK per affliction on the target.', [hit(0.7, { perAffliction: 0.6 })]),
  ],
  rules: [rule('combust', afflictions(3), 'mostAfflicted'), rule('scorch', lacks(BRITTLE), 'mostAfflicted')],
});

export const timeweaver = tertiaryTier({
  id: 'timeweaver',
  name: 'Timeweaver',
  baseClassId: 'r-mage',
  advancedClassId: 'r-chronomancer',
  description: 'Speeds up the whole party and rewinds wounds.',
  tags: ['arcane'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { spd: 1, hp: 6 } },
  skills: [
    skill('time-warp', 'Time Warp', 5, null, 'Every ally is Hasted: +4 SPD for 3 turns.', [afflict(HASTED, 1, 'allAllies')], {
      talent: 'Time Warp gives every ally +5 SPD.',
      description: 'Every ally is Hasted: +5 SPD for 3 turns.',
      effects: [afflict(EMPOWERED.hasted, 1, 'allAllies')],
    }),
    skill('rewind', 'Rewind', 3, 'ally', 'Heal an ally for 160% ATK.', [{ kind: 'heal', target: 'focus', amount: { atk: 1.6 } }]),
  ],
  rules: [rule('rewind', allyBelow(50)), rule('time-warp', { kind: 'targetLacks', status: HASTED.id }, 'self')],
});

export const riftmage = tertiaryTier({
  id: 'riftmage',
  name: 'Riftmage',
  baseClassId: 'r-mage',
  advancedClassId: 'r-chronomancer',
  description: 'Freezes enemies in time and unravels them.',
  tags: ['arcane'],
  statWeights: { hp: 3, atk: 5, def: 0, spd: 2 },
  modifier: { stats: { atk: 3 } },
  skills: [
    skill('time-stop', 'Time Stop', 5, 'enemy', 'Bind: it loses its next turn.', [afflict(BIND)], {
      talent: 'Time Stop also Slows the target (−4 SPD).',
      description: 'Bind: it loses its next turn. Slowed: −4 SPD for 3 turns.',
      effects: [afflict(BIND), afflict(SLOWED)],
    }),
    skill('unravel', 'Unravel', 3, 'enemy', '60% ATK + 35% ATK per affliction on the target.', [hit(0.6, { perAffliction: 0.35 })]),
  ],
  rules: [rule('time-stop', undefined, 'highestAtk'), rule('unravel', afflictions(2), 'mostAfflicted')],
});

export const MAGE_TREE = [mage, pyromancer, chronomancer, flamecaller, ashbringer, timeweaver, riftmage];

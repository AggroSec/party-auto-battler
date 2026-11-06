// Rules-mode Warrior: Guardian (tank) or Berserker (damage). Berserkers become
// Reavers (bleeds and damage per affliction) or Slayers (more damage).
import { BIND, BLEED, ENRAGED, FORTIFIED } from './statuses.ts';
import { advancedTier, afflict, afflictions, allyBelow, baseClass, hit, rule, selfBelow, selfLacks, selfStatus, skill, tertiaryTier } from './dsl.ts';

export const warrior = baseClass({
  id: 'r-warrior',
  name: 'Warrior',
  description: 'Front-line fighter: cleaves, draws fire and shrugs off wounds.',
  tags: ['martial', 'guardian'],
  role: 'frontline',
  look: 'warrior',
  baseStats: { hp: 42, atk: 6, def: 3, spd: 8 },
  range: 'melee',
  placement: 0,
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  advancedClasses: ['guardian', 'r-berserker'],
  skills: [
    skill('cleave', 'Cleave', 2, null, '70% ATK to each enemy in the front row.', [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.7 } }]),
    skill('provoke', 'Provoke', 4, null, 'Taunt for 2 turns: enemies must target you.', [{ kind: 'taunt', target: 'self', turns: 2 }]),
    skill('second-wind', 'Second Wind', 5, null, 'Heal 25% of your max HP.', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.25 } }]),
  ],
  rules: [rule('second-wind', selfBelow(50)), rule('provoke', allyBelow(60)), rule('cleave', { kind: 'enemiesAtLeast', count: 2 })],
});

export const guardian = advancedTier({
  id: 'guardian',
  name: 'Guardian',
  baseClassId: 'r-warrior',
  description: 'The wall: fortifies itself and shields whoever is in trouble.',
  tags: ['martial', 'guardian'],
  tertiaryClasses: ['bulwark', 'warden'],
  statWeights: { hp: 4, atk: 1, def: 3, spd: 1 },
  modifier: { stats: { hp: 14, def: 2 } },
  skills: [
    skill('shield-wall', 'Shield Wall', 3, null, 'Fortified: +6 DEF for 3 turns.', [selfStatus(FORTIFIED)]),
    skill('intercept', 'Intercept', 3, 'ally', 'Shield an ally for 8 + 150% DEF.', [{ kind: 'shield', target: 'focus', amount: { flat: 8, def: 1.5 } }]),
  ],
  rules: [rule('intercept', allyBelow(60)), rule('shield-wall', selfLacks(FORTIFIED))],
});

export const berserker = advancedTier({
  id: 'r-berserker',
  name: 'Berserker',
  baseClassId: 'r-warrior',
  description: 'All offence: rampages and pays blood for rage.',
  tags: ['martial'],
  tertiaryClasses: ['reaver', 'slayer'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 4, hp: 12 } },
  skills: [
    skill('rampage', 'Rampage', 2, 'enemy', '160% ATK.', [hit(1.6)]),
    skill('blood-rage', 'Blood Rage', 4, null, 'Lose 10% max HP; Enraged: +4 ATK for 3 turns.', [{ kind: 'payHp', amount: { maxHp: 0.1 } }, selfStatus(ENRAGED)]),
  ],
  rules: [rule('blood-rage', selfLacks(ENRAGED)), rule('rampage')],
});

export const bulwark = tertiaryTier({
  id: 'bulwark',
  name: 'Bulwark',
  baseClassId: 'r-warrior',
  advancedClassId: 'guardian',
  description: 'Unbreakable: rallies the whole party behind its shield.',
  tags: ['martial', 'guardian'],
  statWeights: { hp: 5, atk: 1, def: 3, spd: 1 },
  modifier: { stats: { hp: 20, def: 3 } },
  skills: [skill('rally', 'Rally', 4, null, 'Shield every ally for 6 + 100% DEF.', [{ kind: 'shield', target: 'allAllies', amount: { flat: 6, def: 1 } }])],
  rules: [rule('rally', allyBelow(75))],
});

export const warden = tertiaryTier({
  id: 'warden',
  name: 'Warden',
  baseClassId: 'r-warrior',
  advancedClassId: 'guardian',
  description: 'A tank that controls: bashes the biggest threat off its feet.',
  tags: ['martial', 'guardian'],
  statWeights: { hp: 4, atk: 2, def: 3, spd: 1 },
  modifier: { stats: { hp: 14, def: 2, atk: 4 } },
  skills: [skill('shield-bash', 'Shield Bash', 4, 'enemy', '80% ATK and Bind: it loses its next turn.', [hit(0.8), afflict(BIND)])],
  rules: [rule('shield-bash', undefined, 'highestAtk')],
});

export const reaver = tertiaryTier({
  id: 'reaver',
  name: 'Reaver',
  baseClassId: 'r-warrior',
  advancedClassId: 'r-berserker',
  description: 'Bleeds its prey, then gores it for every wound it carries.',
  tags: ['martial'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 2, hp: 8 } },
  skills: [
    skill('rend', 'Rend', 1, 'enemy', '50% ATK and 2 Bleed.', [hit(0.5), afflict(BLEED, 2)]),
    skill('gore', 'Gore', 3, 'enemy', '80% ATK + 35% ATK per affliction on the target.', [hit(0.8, { perAffliction: 0.35 })]),
  ],
  rules: [rule('gore', afflictions(2), 'mostAfflicted'), rule('rend', { kind: 'targetStacks', status: BLEED.id, atLeast: 1 }), rule('rend', undefined, 'mostAfflicted')],
});

export const slayer = tertiaryTier({
  id: 'slayer',
  name: 'Slayer',
  baseClassId: 'r-warrior',
  advancedClassId: 'r-berserker',
  description: 'Pure damage: whirls through the line and beheads the wounded.',
  tags: ['martial'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 4 } },
  skills: [
    skill('decapitate', 'Decapitate', 4, 'enemy', '250% ATK.', [hit(2.5)]),
    skill('whirlwind', 'Whirlwind', 3, null, '80% ATK to every enemy.', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } }]),
  ],
  rules: [rule('decapitate', { kind: 'targetHpBelow', percent: 50 }, 'lowestHp'), rule('whirlwind', { kind: 'enemiesAtLeast', count: 3 })],
});

export const WARRIOR_TREE = [warrior, guardian, berserker, bulwark, warden, reaver, slayer];

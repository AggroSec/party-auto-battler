// Rules-mode Apostate (Milestone 15, Brandon): the villains' lock. Anathema
// halves the target's healing, Hush stops its skills, and Forsake makes a
// target with both Forsaken (+25% damage taken). Blasphemer turns the
// target's healing into harm; Desecrator rots it and spreads its curses.
import { ANATHEMA, DEFILED, FORSAKEN, HUSH, LONG_HUSH, PROFANE_ANATHEMA, VOID_HUSH } from './statuses.ts';
import { advancedTier, afflict, afflictions, baseClass, hit, lacks, rule, skill, tertiaryTier } from './dsl.ts';
import type { Effect } from '../../engine/types.ts';

const DARK = ['shadow', 'occult'];
const has = (s: { id: string }) => ({ kind: 'targetHas', status: s.id }) as const;
/** Forsaken, only on a target that has Anathema and Hush. */
const forsake = (target: 'focus' | 'allEnemies' = 'focus'): Effect => ({ kind: 'status', target, status: FORSAKEN, stacks: 1, requires: [ANATHEMA.id, HUSH.id] });
/** Contagion of Sin: when an enemy dies Forsaken, its afflictions jump to the nearest enemy. */
const contagion = (label: string, requires: readonly string[] = [FORSAKEN.id], target: 'nearest' | 'lowestHp' = 'nearest') => {
  const spread: Effect = { kind: 'spread', target, from: 'triggerTarget', ...(requires.length > 0 ? { requires } : {}) };
  return [
    { label, on: 'onKill' as const, effects: [spread] },
    { label, on: 'onAllyKill' as const, effects: [spread] },
  ];
};

export const apostate = baseClass({
  id: 'r-apostate',
  name: 'Apostate',
  description: 'Curses that stop healing and silence skills, then marks the victim Forsaken.',
  tags: DARK,
  role: 'caster',
  look: 'apostate',
  baseStats: { hp: 28, atk: 6, def: 1, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  advancedClasses: ['r-blasphemer', 'r-desecrator'],
  skills: [
    skill('anathema', 'Anathema', 2, 'enemy', '40% ATK and Anathema (heals on it are halved, for 3 turns).', [hit(0.4), afflict(ANATHEMA)]),
    skill('heretic-hush', 'Hush the Faithful', 3, 'enemy', '30% ATK and Hush: no skills or abilities for 2 turns.', [hit(0.3), afflict(HUSH)]),
    skill('forsake', 'Forsake', 2, 'enemy', '50% ATK. With Anathema and Hush the target is Forsaken (+25% damage taken for 2 turns).', [hit(0.5), forsake()]),
  ],
  rules: [
    rule('forsake', has(HUSH), 'mostAfflicted'),
    rule('heretic-hush', has(ANATHEMA), 'mostAfflicted'),
    rule('anathema', lacks(ANATHEMA), 'mostAfflicted'),
    rule('forsake', undefined, 'mostAfflicted'),
  ],
});

export const blasphemer = advancedTier({
  id: 'r-blasphemer',
  name: 'Blasphemer',
  baseClassId: 'r-apostate',
  description: 'Turns the enemy’s healing against it, and silences them all.',
  tags: DARK,
  tertiaryClasses: ['r-heresiarch', 'r-voidspeaker'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 10, atk: 3 } },
  skills: [
    skill('profane-anathema', 'Profane Anathema', 2, 'enemy', '60% ATK and Profane Anathema: heals on it are cancelled, and half of each hurts instead (3 turns).', [hit(0.6), afflict(PROFANE_ANATHEMA)]),
    skill('excommunicate', 'Excommunicate', 4, null, 'Hush every enemy that has Anathema.', [{ kind: 'status', target: 'allEnemies', status: HUSH, stacks: 1, requires: [ANATHEMA.id] }], {
      talent: 'Excommunicate also makes them Forsaken.',
      description: 'Hush every enemy that has Anathema; each is Forsaken too.',
      effects: [{ kind: 'status', target: 'allEnemies', status: HUSH, stacks: 1, requires: [ANATHEMA.id] }, forsake('allEnemies')],
    }),
  ],
  rules: [rule('excommunicate', { kind: 'enemiesAtLeast', count: 2 }), rule('profane-anathema', undefined, 'lowestHp')],
});

export const desecrator = advancedTier({
  id: 'r-desecrator',
  name: 'Desecrator',
  baseClassId: 'r-apostate',
  description: 'Rots the victim, and passes its curses on to the rest.',
  tags: DARK,
  tertiaryClasses: ['r-defiler', 'r-profaner'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { hp: 6, atk: 3 }, triggers: contagion('Contagion of Sin') },
  passive: { name: 'Contagion of Sin', description: 'When an enemy dies Forsaken, its afflictions jump to the nearest enemy.' },
  skills: [
    skill('r-defile', 'Defile', 2, 'enemy', '40% ATK and 2 Defiled (30% ATK damage per stack each turn, up to 3).', [hit(0.4), afflict(DEFILED, 2)]),
    skill('r-desecrate', 'Desecrate', 4, 'enemy', '30% ATK, then copy the target’s afflictions onto the next enemy.', [hit(0.3), { kind: 'spread', target: 'allEnemies', from: 'focus', limit: 1 }]),
  ],
  rules: [rule('r-desecrate', afflictions(3), 'mostAfflicted'), rule('r-defile', lacks(DEFILED), 'mostAfflicted')],
});

export const heresiarch = tertiaryTier({
  id: 'r-heresiarch',
  name: 'Heresiarch',
  baseClassId: 'r-apostate',
  advancedClassId: 'r-blasphemer',
  description: 'Closes the whole lock in one breath.',
  tags: DARK,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 10, atk: 3 } },
  skills: [
    skill('grand-heresy', 'Grand Heresy', 5, 'enemy', '40% ATK, then Profane Anathema and a 3-turn Hush at once.', [
      hit(0.4),
      afflict(PROFANE_ANATHEMA),
      afflict(LONG_HUSH),
    ]),
  ],
  rules: [rule('grand-heresy', lacks(HUSH), 'highestAtk')],
});

export const voidspeaker = tertiaryTier({
  id: 'r-voidspeaker',
  name: 'Voidspeaker',
  baseClassId: 'r-apostate',
  advancedClassId: 'r-blasphemer',
  description: 'Silences everyone at once, and dooms the cursed.',
  tags: [...DARK, 'arcane'],
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { hp: 8, atk: 3 } },
  skills: [
    skill(
      'void-word',
      'Word of the Void',
      5,
      null,
      'Hush every enemy that has Anathema for 1 turn, and make it Forsaken.',
      [{ kind: 'status', target: 'allEnemies', status: VOID_HUSH, stacks: 1, requires: [ANATHEMA.id] }, forsake('allEnemies')],
      {
        talent: 'Word of the Void’s Hush lasts 2 turns.',
        description: 'Hush every enemy that has Anathema for 2 turns, and make it Forsaken.',
        effects: [{ kind: 'status', target: 'allEnemies', status: HUSH, stacks: 1, requires: [ANATHEMA.id] }, forsake('allEnemies')],
      },
    ),
  ],
  rules: [rule('void-word', { kind: 'enemiesAtLeast', count: 2 })],
});

export const defiler = tertiaryTier({
  id: 'r-defiler',
  name: 'Defiler',
  baseClassId: 'r-apostate',
  advancedClassId: 'r-desecrator',
  description: 'A walking plague: rot on everyone, and every death passes it on.',
  tags: DARK,
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { hp: 8, atk: 1 }, triggers: contagion('Pandemic', [DEFILED.id], 'lowestHp') },
  passive: { name: 'Pandemic', description: 'When an enemy dies Defiled, its afflictions jump to the enemy with the lowest HP.' },
  skills: [
    skill('pandemic', 'Plague Wind', 5, null, '1 Defiled on every enemy.', [afflict(DEFILED, 1, 'allEnemies')]),
  ],
  rules: [rule('pandemic', { kind: 'enemiesAtLeast', count: 2 })],
});

export const profaner = tertiaryTier({
  id: 'r-profaner',
  name: 'Profaner',
  baseClassId: 'r-apostate',
  advancedClassId: 'r-desecrator',
  description: 'Burns the Forsaken out of the world.',
  tags: DARK,
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { hp: 8, atk: 4 } },
  skills: [
    skill('pyre', 'Profane Pyre', 3, 'enemy', '60% ATK, and 90% ATK more if the target is Forsaken.', [
      hit(0.6),
      hit(0.9, { requires: { status: FORSAKEN.id, stacks: 1 } }),
    ]),
  ],
  rules: [rule('pyre', has(FORSAKEN), 'mostAfflicted'), rule('pyre', { kind: 'targetHpBelow', percent: 40 }, 'lowestHp')],
});

export const APOSTATE_TREE = [apostate, blasphemer, desecrator, heresiarch, voidspeaker, defiler, profaner];

// Apostate tertiary classes (level 7, Milestone 15): Blasphemer → Heresiarch /
// Voidspeaker, Desecrator → Defiler / Profaner.
import { ANATHEMA, DEFILED, FORSAKEN, HUSH, LONG_HUSH, PROFANE_ANATHEMA, VOID_HUSH } from '../../rules-mode/statuses.ts';
import { contagion, curse, lock } from '../apostate.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const heresiarch = tertiary({
  id: 'heresiarch',
  name: 'Heresiarch',
  baseClassId: 'apostate',
  advancedClassId: 'blasphemer',
  description: 'Closes the lock in one breath and holds it: longer silences, and healing that only hurts.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'grand-heresy',
    name: 'Grand Heresy',
    description:
      'Every 3rd turn: deal 80% ATK to the most afflicted enemy, then Profane Anathema, a 3-turn Hush and Forsaken on it at once.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.8 } },
      curse(PROFANE_ANATHEMA),
      curse(LONG_HUSH),
      curse(FORSAKEN),
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Unbroken Silence', description: 'Start of combat: Hush the enemy with the highest ATK.' },
  modifier: { stats: { hp: 10, atk: 3 }, triggers: [on('startOfCombat', 'Unbroken Silence', [curse(HUSH, 'highestAtk')])] },
  talents: [
    talent('heresiarch/zeal', 'Heretic’s Zeal', '+4 ATK.', { stats: { atk: 4 } }),
    talent('heresiarch/creed', 'Black Creed', '+30% ability power.', { abilityPower: 0.3 }),
    talent('heresiarch/no-absolution', 'No Absolution', 'After your ability, Profane Anathema on the enemy with the lowest HP.', trig(
      on('onAbility', 'No Absolution', [curse(PROFANE_ANATHEMA, 'lowestHp')]),
    )),
    abilityTalent('heresiarch/damnation', {
      id: 'damnation',
      name: 'Damnation',
      description: 'Every 4th turn: deal 60% ATK + 50% ATK per affliction to the most afflicted enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.6 }, perAffliction: 0.5 }],
    }),
  ],
});

export const voidspeaker = tertiary({
  id: 'voidspeaker',
  name: 'Voidspeaker',
  baseClassId: 'apostate',
  advancedClassId: 'blasphemer',
  description: 'Speaks the word that silences everyone at once.',
  tags: ['shadow', 'occult', 'arcane'],
  ability: {
    id: 'word-of-the-void',
    name: 'Word of the Void',
    description: 'Every 4th turn: deal 50% ATK to every enemy and Hush each for 1 turn; every enemy with Anathema is Forsaken.',
    cooldown: 4,
    effects: [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } },
      curse(VOID_HUSH, 'allEnemies'),
      { ...curse(FORSAKEN, 'allEnemies'), requires: [ANATHEMA.id, HUSH.id] },
    ],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Echoing Void', description: 'Start of combat: Anathema on every enemy.' },
  modifier: { stats: { hp: 8, atk: 3 }, triggers: [on('startOfCombat', 'Echoing Void', [curse(ANATHEMA, 'allEnemies')])] },
  talents: [
    talent('voidspeaker/whispers', 'Whispers', '+30% ability power.', { abilityPower: 0.3 }),
    talent('voidspeaker/hollow-voice', 'Hollow Voice', '+8 HP, +2 SPD.', { stats: { hp: 8, spd: 2 } }),
    talent('voidspeaker/null', 'Null Litany', 'After your ability, every enemy’s ability comes 1 turn later.', trig(
      on('onAbility', 'Null Litany', [{ kind: 'cooldown', target: 'allEnemies', turns: 1 }]),
    )),
    abilityTalent('voidspeaker/profane-chorus', {
      id: 'profane-chorus',
      name: 'Profane Chorus',
      description: 'Every 4th turn: Profane Anathema on every enemy (healing on it hurts instead).',
      cooldown: 4,
      effects: [curse(PROFANE_ANATHEMA, 'allEnemies')],
    }),
  ],
});

export const defiler = tertiary({
  id: 'defiler',
  name: 'Defiler',
  baseClassId: 'apostate',
  advancedClassId: 'desecrator',
  description: 'A walking plague: rot on everyone, and every death passes it on.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'defile',
    name: 'Defile',
    description:
      'Every 3rd turn: deal 70% ATK to the most afflicted enemy, 2 Defiled on it and 1 on every other enemy, and Anathema on it. Hush it if it already had Anathema; with both it’s Forsaken.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.7 } },
      curse(DEFILED, 'allEnemies'),
      curse(DEFILED),
      ...lock(),
    ],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Pandemic', description: 'When any enemy dies, its afflictions jump to the enemy with the lowest HP.' },
  modifier: { stats: { hp: 8, atk: 3 }, triggers: contagion('Pandemic', [], 'lowestHp') },
  talents: [
    talent('defiler/virulence', 'Virulence', '+30% ability power.', { abilityPower: 0.3 }),
    talent('defiler/carrion', 'Carrion Feast', '+4 ATK.', { stats: { atk: 4 } }),
    talent('defiler/miasma', 'Miasma', 'Start of combat: 1 Defiled on every enemy.', trig(on('startOfCombat', 'Miasma', [curse(DEFILED, 'allEnemies')]))),
    abilityTalent('defiler/rot-sermon', {
      id: 'rot-sermon',
      name: 'Rot Sermon',
      description: 'Every 4th turn: every enemy takes 40% ATK + 30% ATK per affliction on it.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.4 }, perAffliction: 0.3 }],
    }),
  ],
});

export const profaner = tertiary({
  id: 'profaner',
  name: 'Profaner',
  baseClassId: 'apostate',
  advancedClassId: 'desecrator',
  description: 'Burns the Forsaken out of the world.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'profane-pyre',
    name: 'Profane Pyre',
    description:
      'Every 3rd turn: deal 70% ATK to the most afflicted enemy, and 100% ATK more if it’s Forsaken. Then Anathema on it, a Hush if it already had Anathema, and Forsaken with both.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.7 } },
      { kind: 'damage', target: 'mostAfflicted', amount: { atk: 1 }, requires: { status: FORSAKEN.id, stacks: 1 } },
      ...lock(),
    ],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Last Rites', description: '+30% damage to enemies below half HP.' },
  modifier: { stats: { hp: 8, atk: 4 }, executeBonus: 0.3 },
  talents: [
    talent('profaner/kindling', 'Kindling', '+30% ability power.', { abilityPower: 0.3 }),
    talent('profaner/ashen-vow', 'Ashen Vow', '+10 HP, +1 DEF.', { stats: { hp: 10, def: 1 } }),
    talent('profaner/zealous', 'Pyre-Zeal', 'On kill: your ability comes 1 turn sooner.', trig(
      on('onKill', 'Pyre-Zeal', [{ kind: 'cooldown', target: 'self', turns: -1 }]),
    )),
    abilityTalent('profaner/heretics-fire', {
      id: 'heretics-fire',
      name: 'Heretic’s Fire',
      description: 'Every 4th turn: deal 120% ATK to the enemy with the lowest HP.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'lowestHp', amount: { atk: 1.2 } }],
    }),
  ],
});

export const APOSTATE_TERTIARY = [heresiarch, voidspeaker, defiler, profaner];

// Apostate (Milestone 15, Brandon): a priest who turned on the light, and the
// villains' affliction caster. Where the Shaman counts afflictions and cashes
// them in, the Apostate shuts things off: Anathema halves the victim's
// healing, Hush stops its abilities, and a victim with both is Forsaken
// (+25% damage taken). Blasphemer holds the lock and turns healing into harm;
// Desecrator rots the victim and spreads its curses when it dies. Unlocked by
// finishing The Black Covenant.
import type { ClassDef } from '../class-types.ts';
import { ANATHEMA, DEFILED, FORSAKEN, HUSH, PROFANE_ANATHEMA } from '../rules-mode/statuses.ts';
import type { Effect, StatusDef, TargetSelector } from '../../engine/types.ts';
import { abilityTalent, advanced, on, talent, talentIds, trig } from './dsl.ts';

type Curse = Extract<Effect, { kind: 'status' }>;

/** A curse on the most afflicted enemy (or another target). */
export const curse = (status: StatusDef, target: TargetSelector = 'mostAfflicted', stacks = 1): Curse => ({ kind: 'status', target, status, stacks });

/**
 * The lock, in order: Hush only lands on a target that already has Anathema,
 * then the Anathema (`anathema`, plain or Profane) goes on, then a target
 * with both is Forsaken. So the first cast curses and the second one locks.
 */
export function lock(anathema: StatusDef = ANATHEMA, hush: StatusDef = HUSH, target: TargetSelector = 'mostAfflicted'): Curse[] {
  return [
    { ...curse(hush, target), requires: [ANATHEMA.id] },
    curse(anathema, target),
    { ...curse(FORSAKEN, target), requires: [ANATHEMA.id, HUSH.id] },
  ];
}

/** Contagion of Sin: when an enemy dies Forsaken (whoever kills it), its curses jump to the nearest enemy. */
export const contagion = (label: string, requires: readonly string[] = [FORSAKEN.id], target: TargetSelector = 'nearest') => {
  const spread: Effect = { kind: 'spread', target, from: 'triggerTarget', ...(requires.length > 0 ? { requires } : {}) };
  return [on('onKill', label, [spread]), on('onAllyKill', label, [spread])];
};

export const apostateTalents = [
  talent('apostate/dark-litany', 'Dark Litany', '+30% ability power.', { abilityPower: 0.3 }),
  talent('apostate/false-prophet', 'False Prophet', 'Start of combat: Anathema on the enemy with the highest ATK.', trig(
    on('startOfCombat', 'False Prophet', [curse(ANATHEMA, 'highestAtk')]),
  )),
  talent('apostate/unholy-zeal', 'Unholy Zeal', '+2 ATK, +1 SPD.', { stats: { atk: 2, spd: 1 } }),
  talent('apostate/vow-of-silence', 'Vow of Silence', 'On kill: Hush the most afflicted enemy.', trig(on('onKill', 'Vow of Silence', [curse(HUSH)]))),
];

export const blasphemer = advanced({
  id: 'blasphemer',
  name: 'Blasphemer',
  baseClassId: 'apostate',
  description: 'Holds the lock, and turns the enemy’s healing against it.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'blasphemy',
    name: 'Blasphemy',
    description:
      'Every 3rd turn: deal 60% ATK to the most afflicted enemy and give it Profane Anathema (healing on it is cancelled and half of it hurts instead, for 3 turns). Hush it if it already had Anathema; with both it’s Forsaken.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.6 } }, ...lock(PROFANE_ANATHEMA)],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Sacrilege', description: 'Start of combat: Profane Anathema on every enemy in the front row.' },
  modifier: {
    stats: { hp: 8, atk: 2 },
    triggers: [on('startOfCombat', 'Sacrilege', [curse(PROFANE_ANATHEMA, 'enemyFrontRow')])],
  },
  talents: [
    talent('blasphemer/black-mass', 'Black Mass', '+30% ability power.', { abilityPower: 0.3 }),
    talent('blasphemer/stolen-grace', 'Stolen Grace', '+15% lifesteal and +6 HP.', { lifesteal: 0.15, stats: { hp: 6 } }),
    talent('blasphemer/endless-litany', 'Endless Litany', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    abilityTalent('blasphemer/excommunicate', {
      id: 'excommunicate',
      name: 'Excommunicate',
      description: 'Every 4th turn: Anathema on every enemy (healing on it is halved, for 3 turns).',
      cooldown: 4,
      effects: [curse(ANATHEMA, 'allEnemies')],
    }),
  ],
});

export const desecrator = advanced({
  id: 'desecrator',
  name: 'Desecrator',
  baseClassId: 'apostate',
  description: 'Rots the victim, and when it dies Forsaken its curses jump to the next.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'desecrate',
    name: 'Desecrate',
    description:
      'Every 3rd turn: deal 70% ATK to the most afflicted enemy and give it 2 Defiled (30% ATK damage per stack each turn, up to 3) and Anathema. Hush it if it already had Anathema; with both it’s Forsaken.',
    cooldown: 3,
    effects: [{ kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.7 } }, curse(DEFILED, 'mostAfflicted', 2), ...lock()],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Contagion of Sin', description: 'When an enemy dies Forsaken, its afflictions jump to the nearest enemy.' },
  modifier: { stats: { hp: 6, atk: 3 }, triggers: contagion('Contagion of Sin') },
  talents: [
    talent('desecrator/foul-rites', 'Foul Rites', '+30% ability power.', { abilityPower: 0.3 }),
    talent('desecrator/plague-sermon', 'Plague Sermon', '30% on attack: 1 Defiled on the target.', trig(
      on('onAttack', 'Plague Sermon', [curse(DEFILED, 'triggerTarget')], { chance: 0.3 }),
    )),
    talent('desecrator/grave-dust', 'Grave Dust', '+8 HP, +1 DEF.', { stats: { hp: 8, def: 1 } }),
    abilityTalent('desecrator/black-litany', {
      id: 'black-litany',
      name: 'Black Litany',
      description: 'Every 4th turn: 1 Defiled on every enemy.',
      cooldown: 4,
      effects: [curse(DEFILED, 'allEnemies')],
    }),
  ],
});

export const apostateClass: ClassDef = {
  id: 'apostate',
  name: 'Apostate',
  role: 'caster',
  tags: ['shadow', 'occult'],
  unlockable: true,
  description: 'A priest who turned on the light: curses that stop healing and silence abilities, then the kill.',
  baseStats: { hp: 28, atk: 6, def: 1, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  talents: talentIds(apostateTalents),
  advancedClasses: ['blasphemer', 'desecrator'],
  attackTarget: 'mostAfflicted',
  ability: {
    id: 'profane-word',
    name: 'Profane Word',
    description:
      'Every 2nd turn: deal 50% ATK to the most afflicted enemy and give it Anathema (healing on it is halved, for 3 turns). Hush it (no abilities for 2 turns) if it already had Anathema; with both it’s Forsaken (+25% damage taken for 2 turns).',
    cooldown: 2,
    effects: [{ kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.5 } }, ...lock()],
  },
  passive: { name: 'Heresy', description: '30% on attack: Anathema on the target.' },
  triggers: [on('onAttack', 'Heresy', [curse(ANATHEMA, 'triggerTarget')], { chance: 0.3 })],
};

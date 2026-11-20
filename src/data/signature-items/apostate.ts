// Signature items (Milestone 15) for the Apostate's tertiary classes.
import { curse } from '../builds/apostate.ts';
import { on, signature } from '../builds/dsl.ts';
import { DEFILED, HUSH, PROFANE_ANATHEMA, VOID_HUSH } from '../rules-mode/statuses.ts';

export const APOSTATE_SIGNATURES = [
  signature('heresiarch', 'tongue-of-heresy', 'Tongue of Heresy', '+2 ATK. Start of combat: Profane Anathema and Hush on the enemy with the highest ATK.', {
    stats: { atk: 2 },
    triggers: [on('startOfCombat', 'Tongue of Heresy', [curse(PROFANE_ANATHEMA, 'highestAtk'), curse(HUSH, 'highestAtk')])],
  }),
  signature('voidspeaker', 'void-psalter', 'Void Psalter', '+20% ability power. Start of combat: Hush every enemy for 1 turn.', {
    abilityPower: 0.2,
    triggers: [on('startOfCombat', 'Void Psalter', [curse(VOID_HUSH, 'allEnemies')])],
  }),
  signature('defiler', 'censer-of-rot', 'Censer of Rot', 'Start of combat: 2 Defiled on every enemy.', {
    triggers: [on('startOfCombat', 'Censer of Rot', [curse(DEFILED, 'allEnemies', 2)])],
  }),
  signature('profaner', 'pyre-brand', 'Pyre Brand', '+3 ATK and +20% damage to enemies below half HP.', { stats: { atk: 3 }, executeBonus: 0.2 }),
];

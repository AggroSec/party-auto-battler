// Signature items (M7) for the Ranger's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const RANGER_SIGNATURES = [
  signature('deadeye', 'hawkeye-scope', 'Hawkeye Scope', '+1 ATK. Deal 60% more damage to enemies below half HP.', { stats: { atk: 1 }, executeBonus: 0.6 }, 8),
  signature('trapper', 'spiked-snares', 'Spiked Snares', 'Start of combat: the enemy front row loses 2 DEF. After casting, the enemy front row takes 40% ATK piercing.', {
    triggers: [
      on('startOfCombat', 'Spiked Snares', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'def', amount: { flat: 2 } }]),
      on('onAbility', 'Spiked Snares', [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.4 }, pierce: true }]),
    ],
  }),
  signature('packlord', 'alphas-fang', "Alpha's Fang", '+30% ability power (stronger wolves). When an ally falls, your next ability comes 1 turn sooner.', {
    abilityPower: 0.3,
    triggers: [on('onAllyDeath', "Alpha's Fang", [{ kind: 'cooldown', target: 'self', turns: -1 }])],
  }),
  signature('falconer', 'hooded-falcon', 'Hooded Falcon', '40% on attack: the falcon strikes the weakest back-row enemy for 100% ATK.', {
    triggers: [on('onAttack', 'Hooded Falcon', [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 1 } }], { chance: 0.4 })],
  }),
];

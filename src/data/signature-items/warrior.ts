// Signature items (M7) for the Warrior's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const WARRIOR_SIGNATURES = [
  signature('paladin', 'dawnbringer', 'Dawnbringer', '+10 HP. At the start of each of your turns, all allies heal 3.', {
    stats: { hp: 10 },
    triggers: [on('onTurnStart', 'Dawnbringer', [{ kind: 'heal', target: 'allAllies', amount: { flat: 3 } }])],
  }),
  signature('vanguard', 'aegis-of-the-unbroken', 'Aegis of the Unbroken', '+3 DEF. When hurt, the attacker loses 1 ATK (up to 6 times per fight).', {
    stats: { def: 3 },
    triggers: [on('onHurt', 'Unbroken', [{ kind: 'debuff', target: 'triggerSource', stat: 'atk', amount: { flat: 1 } }], { limit: 6 })],
  }),
  signature('warlord', 'horde-banner', 'Horde Banner', 'On kill, all allies gain +1 ATK and +1 SPD.', {
    triggers: [
      on('onKill', 'Horde Banner', [
        { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  }),
  signature('bloodreaver', 'crimson-chalice', 'Crimson Chalice', '+15% lifesteal. When bloodied, deal 100% ATK to every enemy.', {
    lifesteal: 0.15,
    triggers: [on('onBloodied', 'Crimson Chalice', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 1 } }])],
  }),
];

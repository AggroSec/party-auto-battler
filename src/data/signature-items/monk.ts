// Signature items (M7) for the Monk's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const MONK_SIGNATURES = [
  signature('stormfist', 'thunder-wraps', 'Thunder Wraps', 'After casting, deal 60% ATK to every enemy.', {
    triggers: [on('onAbility', 'Thunder Wraps', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } }])],
  }),
  signature('mistwalker', 'jade-lotus', 'Jade Lotus', '30% when hurt: heal all allies for 50% ATK.', {
    triggers: [on('onHurt', 'Jade Lotus', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.5 } }], { chance: 0.3 })],
  }),
  signature('stoneguard', 'mountain-heart', 'Mountain Heart', '+16 HP. When bloodied, taunt for 2 turns and shield yourself for 50% of max HP.', {
    stats: { hp: 16 },
    triggers: [
      on('onBloodied', 'Mountain Heart', [
        { kind: 'taunt', target: 'self', turns: 2 },
        { kind: 'shield', target: 'self', amount: { maxHp: 0.5 } },
      ]),
    ],
  }),
  signature(
    'grandmaster',
    'grandmasters-sash',
    "Grandmaster's Sash",
    '+1 DEF, +1 SPD. 30% when hurt: strike the attacker for 100% ATK piercing.',
    {
      stats: { def: 1, spd: 1 },
      triggers: [on('onHurt', "Grandmaster's Sash", [{ kind: 'damage', target: 'triggerSource', amount: { atk: 1 }, pierce: true }], { chance: 0.3 })],
    },
    8,
  ),
];

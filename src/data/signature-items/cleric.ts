// Signature items (M7) for the Cleric's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const CLERIC_SIGNATURES = [
  signature('high-priest', 'chalice-of-mercy', 'Chalice of Mercy', 'At the start of each of your turns, shield the most wounded ally for 100% ATK.', {
    triggers: [on('onTurnStart', 'Chalice of Mercy', [{ kind: 'shield', target: 'lowestHpAlly', amount: { atk: 1 } }])],
  }),
  signature('oracle', 'eye-of-fate', 'Eye of Fate', "Start of combat: all allies gain +1 SPD and every enemy's first ability comes 1 turn later.", {
    triggers: [
      on('startOfCombat', 'Eye of Fate', [
        { kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } },
        { kind: 'cooldown', target: 'allEnemies', turns: 1 },
      ]),
    ],
  }),
  signature('templar', 'crusaders-oath', "Crusader's Oath", '+8 HP. After casting, taunt for 1 turn and gain +1 DEF (up to 5 times per fight).', {
    stats: { hp: 8 },
    triggers: [
      on(
        'onAbility',
        "Crusader's Oath",
        [
          { kind: 'taunt', target: 'self', turns: 1 },
          { kind: 'buff', target: 'self', stat: 'def', amount: { flat: 1 } },
        ],
        { limit: 5 },
      ),
    ],
  }),
  signature('zealot', 'brand-of-zeal', 'Brand of Zeal', 'On kill, gain +2 ATK and your next ability comes 1 turn sooner.', {
    triggers: [
      on('onKill', 'Brand of Zeal', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'cooldown', target: 'self', turns: -1 },
      ]),
    ],
  }),
];

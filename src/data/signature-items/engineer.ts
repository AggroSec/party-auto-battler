// Signature items (M7) for the Engineer's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const ENGINEER_SIGNATURES = [
  signature('artificer', 'master-toolkit', 'Master Toolkit', 'After casting, all allies gain +1 ATK (up to 4 times per fight).', {
    triggers: [on('onAbility', 'Master Toolkit', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } }], { limit: 4 })],
  }),
  signature(
    'roboticist',
    'master-schematic',
    'Master Schematic',
    'After casting, repair the party: heal all allies for 60% ATK and shield them for 40% ATK.',
    {
      triggers: [
        on('onAbility', 'Master Schematic', [
          { kind: 'heal', target: 'allAllies', amount: { atk: 0.6 } },
          { kind: 'shield', target: 'allAllies', amount: { atk: 0.4 } },
        ]),
      ],
    },
    8,
  ),
  signature('bombardier', 'payload-detonator', 'Payload Detonator', 'Start of combat: deal 60% ATK to every enemy.', {
    triggers: [on('startOfCombat', 'Payload Detonator', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } }])],
  }),
  signature('siege-master', 'siege-plans', 'Siege Plans', 'After casting, the strongest enemy loses 2 DEF and 1 SPD.', {
    triggers: [
      on('onAbility', 'Siege Plans', [
        { kind: 'debuff', target: 'highestAtk', stat: 'def', amount: { flat: 2 } },
        { kind: 'debuff', target: 'highestAtk', stat: 'spd', amount: { flat: 1 } },
      ]),
    ],
  }),
];

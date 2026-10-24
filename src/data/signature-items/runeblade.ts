// Signature items (post-M7) for the Runeblade's tertiary classes.
import { on, signature } from '../builds/dsl.ts';
import { onDetonate } from '../builds/runeblade.ts';
import { CORRUPTION, RUNE } from '../statuses.ts';

export const RUNEBLADE_SIGNATURES = [
  signature('stormblade', 'tempest-edge', 'Tempest Edge', '+2 SPD. Start of combat: carve 2 Runes into every enemy.', {
    stats: { spd: 2 },
    triggers: [on('startOfCombat', 'Tempest Edge', [{ kind: 'status', target: 'allEnemies', status: RUNE, stacks: 2 }])],
  }),
  signature('earthwarden', 'heart-of-the-mountain', 'Heart of the Mountain', '+20 HP. When your Runes detonate, shield all allies for 5.', {
    stats: { hp: 20 },
    triggers: [onDetonate('Heart of the Mountain', [{ kind: 'shield', target: 'allAllies', amount: { flat: 5 } }])],
  }),
  signature('dawnblade', 'sunforged-sigil', 'Sunforged Sigil', 'Start of combat: shield all allies for 100% ATK. Detonations heal all allies for another 30% ATK.', {
    triggers: [
      on('startOfCombat', 'Sunforged Sigil', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }]),
      onDetonate('Sunforged Sigil', [{ kind: 'heal', target: 'allAllies', amount: { atk: 0.3 } }]),
    ],
  }),
  signature('voidblade', 'abyssal-fang', 'Abyssal Fang', '+10% lifesteal. Basic attacks give 1 Corruption.', {
    lifesteal: 0.1,
    triggers: [on('onAttack', 'Abyssal Fang', [{ kind: 'status', target: 'triggerTarget', status: CORRUPTION, stacks: 1 }])],
  }),
];

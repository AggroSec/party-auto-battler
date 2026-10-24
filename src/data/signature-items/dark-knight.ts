// Signature items (post-M7) for the Dark Knight's tertiary classes.
import { on, signature } from '../builds/dsl.ts';
import { DREAD, HELLFIRE } from '../statuses.ts';

export const DARK_KNIGHT_SIGNATURES = [
  signature('crimson-lord', 'sanguine-crown', 'Sanguine Crown', '+15% lifesteal. When an enemy falls, heal 10% of max HP.', {
    lifesteal: 0.15,
    triggers: [
      on('onKill', 'Sanguine Crown', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.1 } }]),
      on('onAllyKill', 'Sanguine Crown', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.1 } }]),
    ],
  }),
  signature('hellknight', 'brand-of-the-pit', 'Brand of the Pit', '+2 DEF. Start of combat: every enemy gains 2 Hellfire.', {
    stats: { def: 2 },
    triggers: [on('startOfCombat', 'Brand of the Pit', [{ kind: 'status', target: 'allEnemies', status: HELLFIRE, stacks: 2 }])],
  }),
  signature('tyrant', 'crown-of-dread', 'Crown of Dread', '+3 DEF. Basic attacks give the target 1 Dread.', {
    stats: { def: 3 },
    triggers: [on('onAttack', 'Crown of Dread', [{ kind: 'status', target: 'triggerTarget', status: DREAD, stacks: 1 }])],
  }),
  signature('revenant', 'gravebound-plate', 'Gravebound Plate', '+10 HP. Rise one more time, at 30% HP.', { stats: { hp: 10 }, revive: 0.3 }),
];

// Signature items (M7) for the Rogue's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const ROGUE_SIGNATURES = [
  signature('nightblade', 'shadowfang', 'Shadowfang', 'Deal 50% more damage to enemies below half HP. On kill, shield yourself for 100% ATK.', {
    executeBonus: 0.5,
    triggers: [on('onKill', 'Shadowfang', [{ kind: 'shield', target: 'self', amount: { atk: 1 } }])],
  }),
  signature('shadowdancer', 'veil-of-night', 'Veil of Night', '+2 SPD. On kill, your next ability comes 2 turns sooner.', {
    stats: { spd: 2 },
    triggers: [on('onKill', 'Veil of Night', [{ kind: 'cooldown', target: 'self', turns: -2 }])],
  }),
  signature(
    'swordmaster',
    'kensei-blade',
    'Kensei Blade',
    '+2 ATK. 40% on attack: strike the target again for 100% ATK.',
    {
      stats: { atk: 2 },
      triggers: [on('onAttack', 'Kensei Blade', [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 1 } }], { chance: 0.4 })],
    },
    8,
  ),
  {
    ...signature('swashbuckler', 'lucky-doubloon', 'Lucky Doubloon', '+2 ATK. +1 gold after every won fight. On kill, the enemy front row loses 1 SPD.', {
      stats: { atk: 2 },
      triggers: [on('onKill', 'Lucky Doubloon', [{ kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 1 } }])],
    }),
    goldPerWin: 1,
  },
];

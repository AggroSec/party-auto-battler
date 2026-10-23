// Signature items (M7) for the Necromancer's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const NECROMANCER_SIGNATURES = [
  signature(
    'archlich',
    'phylactery-crystal',
    'Phylactery Crystal',
    'The first time you would fall, rise again at 30% HP and deal 150% ATK to every enemy.',
    { revive: 0.3, triggers: [on('onRevive', 'Phylactery Crystal', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 1.5 } }])] },
    8,
  ),
  signature('soul-reaper', 'reapers-scythe', "Reaper's Scythe", 'Deal 50% more damage to enemies below half HP. On kill, heal 15% of your max HP.', {
    executeBonus: 0.5,
    triggers: [on('onKill', "Reaper's Scythe", [{ kind: 'heal', target: 'self', amount: { maxHp: 0.15 } }])],
  }),
  signature('blightlord', 'plague-censer', 'Plague Censer', 'At the start of each of your turns, every enemy takes 20% ATK.', {
    triggers: [on('onTurnStart', 'Plague Censer', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.2 } }])],
  }),
  signature('rotcaller', 'grave-banner', 'Grave Banner', '+20% ability power. When an ally falls, it bursts: deal 70% ATK to every enemy.', {
    abilityPower: 0.2,
    triggers: [on('onAllyDeath', 'Grave Banner', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }])],
  }),
];

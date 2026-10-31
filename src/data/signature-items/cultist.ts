// Signature items (post-M8) for the Cultist's tertiary classes.
import { on, signature } from '../builds/dsl.ts';
import { BLIGHT } from '../statuses.ts';

export const CULTIST_SIGNATURES = [
  signature('sanguine-bishop', 'reliquary-of-blood', 'Reliquary of Blood', '+2 ATK. Start of combat: shield all allies for 60% ATK.', {
    stats: { atk: 2 },
    triggers: [on('startOfCombat', 'Reliquary of Blood', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } }])],
  }),
  signature('vampire-lord', 'vampires-signet', 'Vampire’s Signet', '+15% lifesteal, +2 SPD.', { lifesteal: 0.15, stats: { spd: 2 } }),
  signature('pestilent-saint', 'censer-of-flies', 'Censer of Flies', '+8 HP. Start of combat: every enemy gains 1 Blight.', {
    stats: { hp: 8 },
    triggers: [on('startOfCombat', 'Censer of Flies', [{ kind: 'status', target: 'allEnemies', status: BLIGHT, stacks: 1 }])],
  }),
  signature('rot-mother', 'mothers-locket', 'Mother’s Locket', '+10 HP. When an ally falls, heal all other allies for 100% ATK.', {
    stats: { hp: 10 },
    triggers: [on('onAllyDeath', 'Mother’s Locket', [{ kind: 'heal', target: 'otherAllies', amount: { atk: 1 } }])],
  }),
];

// Signature items (Milestone 15) for the Marauder's tertiary classes.
import { grudge } from '../builds/marauder.ts';
import { on, signature } from '../builds/dsl.ts';
import { IRONCLAD } from '../rules-mode/statuses.ts';

export const MARAUDER_SIGNATURES = [
  signature('ironhide', 'ironbound-plate', 'Ironbound Plate', '+4 DEF. Start of combat: gain 3 Ironclad (+1 DEF each).', {
    stats: { def: 4 },
    triggers: [on('startOfCombat', 'Ironbound Plate', [{ kind: 'status', target: 'self', status: IRONCLAD, stacks: 3 }])],
  }),
  signature('siegebreaker', 'grudgebearers-knuckles', 'Grudgebearer’s Knuckles', '+2 ATK. When hurt, 50% chance: 1 more Grudge.', {
    stats: { atk: 2 },
    triggers: [on('onHurt', 'Grudgebearer’s Knuckles', [grudge()], { chance: 0.5 })],
  }),
  signature('headtaker', 'headtakers-cleaver', 'Headtaker’s Cleaver', '+3 ATK and +15% critical hit chance.', { stats: { atk: 3 }, critChance: 0.15 }),
  signature('warmonger', 'warmongers-horn', 'Warmonger’s Horn', 'Start of combat: every ally gains +2 ATK.', {
    triggers: [on('startOfCombat', 'Warmonger’s Horn', [{ kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } }])],
  }),
];

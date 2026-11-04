// Signature items for the Mercenary's tertiary classes. The Maimer's, the
// Oathsworn's and the Walking Armory's are weapons, so they fill weapon slots.
import type { ItemDef } from '../../engine/run/content-types.ts';
import { on, signature } from '../builds/dsl.ts';
import { BROKEN_LIMB } from '../statuses.ts';

const weapon = (item: ItemDef): ItemDef => ({ ...item, weapon: true });

export const MERCENARY_SIGNATURES = [
  signature('headsman', 'executioners-hood', "Executioner's Hood", '+2 ATK, +6 HP. Start of combat: break a limb on every enemy.', {
    stats: { atk: 2, hp: 6 },
    triggers: [on('startOfCombat', "Executioner's Hood", [{ kind: 'status', target: 'allEnemies', status: BROKEN_LIMB, stacks: 1 }])],
  }),
  weapon(signature('maimer', 'spiked-knuckles', 'Spiked Knuckles', 'Weapon. +3 ATK. Basic attacks have a 25% chance to break a limb.', {
    stats: { atk: 3 },
    triggers: [on('onAttack', 'Spiked Knuckles', [{ kind: 'status', target: 'triggerTarget', status: BROKEN_LIMB, stacks: 1 }], { chance: 0.25 })],
  })),
  weapon(signature('oathsworn', 'oathblade', 'Oathblade', 'Weapon. +4 ATK, +10% critical hit chance.', { stats: { atk: 4 }, critChance: 0.1 })),
  weapon(signature('walking-armory', 'bandolier-of-blades', 'Bandolier of Blades', 'Weapon. +2 ATK. Start of combat: deal 40% ATK to every enemy.', {
    stats: { atk: 2 },
    triggers: [on('startOfCombat', 'Bandolier of Blades', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.4 } }])],
  })),
];

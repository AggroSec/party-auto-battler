import type { ItemDef } from '../engine/run/content-types.ts';
import type { Effect, TriggerEvent } from '../engine/types.ts';

/**
 * Consumables (post-1.0, Brandon's idea): every unit has one consumable slot
 * beside its items. A consumable's effect fires once, when its trigger
 * happens, and then it's used up; if the trigger never happens it stays for
 * the next fight. The shop always has one on offer, and won fights sometimes
 * drop one for free.
 */
function consumable(id: string, name: string, description: string, cost: number, on: TriggerEvent, effects: Effect[]): ItemDef {
  return { id, name, description, cost, consumable: true, modifier: { triggers: [{ label: name, on, effects, limit: 1, consumable: true }] } };
}

export const CONSUMABLE_LIST: ItemDef[] = [
  consumable('healing-potion', 'Healing Potion', 'When you drop below 50% HP: heal 30% of your max HP.', 1, 'onBloodied', [
    { kind: 'heal', target: 'self', amount: { maxHp: 0.3 } },
  ]),
  consumable('swiftness-draught', 'Swiftness Draught', 'Start of combat: +3 SPD.', 1, 'startOfCombat', [{ kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 3 } }]),
  consumable('ironskin-tonic', 'Ironskin Tonic', 'Start of combat: shield yourself for 15 + 10% of your max HP.', 1, 'startOfCombat', [
    { kind: 'shield', target: 'self', amount: { flat: 15, maxHp: 0.1 } },
  ]),
  consumable('throwing-knives', 'Throwing Knives', 'Start of combat: deal 8 + 60% ATK to the weakest enemy.', 1, 'startOfCombat', [
    { kind: 'damage', target: 'lowestHp', amount: { flat: 8, atk: 0.6 } },
  ]),
  consumable('purifying-salts', 'Purifying Salts', 'When you drop below 50% HP: remove 2 afflictions and heal 10% of your max HP.', 1, 'onBloodied', [
    { kind: 'cure', target: 'self', count: 2 },
    { kind: 'heal', target: 'self', amount: { maxHp: 0.1 } },
  ]),
  consumable('fire-bomb', 'Fire Bomb', 'Start of combat: deal 6 + 40% ATK to each enemy in the front row.', 2, 'startOfCombat', [
    { kind: 'damage', target: 'enemyFrontRow', amount: { flat: 6, atk: 0.4 } },
  ]),
  consumable('elixir-of-fury', 'Elixir of Fury', 'When you drop below 50% HP: +4 ATK.', 2, 'onBloodied', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 4 } }]),
  consumable('focus-draught', 'Focus Draught', 'After your first ability: your abilities are ready 2 turns sooner.', 2, 'onAbility', [
    { kind: 'cooldown', target: 'self', turns: -2 },
  ]),
  consumable('last-rites', 'Last Rites', 'When an ally falls: shield every ally for 12 + 50% ATK.', 2, 'onAllyDeath', [
    { kind: 'shield', target: 'allAllies', amount: { flat: 12, atk: 0.5 } },
  ]),
];

export const CONSUMABLE_IDS = CONSUMABLE_LIST.map((c) => c.id);

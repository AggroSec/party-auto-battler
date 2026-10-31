// Every tertiary class's signature item (M7), one per class.
import type { ItemDef } from '../../engine/run/content-types.ts';
import { BARD_SIGNATURES } from './bard.ts';
import { CLERIC_SIGNATURES } from './cleric.ts';
import { CULTIST_SIGNATURES } from './cultist.ts';
import { DARK_KNIGHT_SIGNATURES } from './dark-knight.ts';
import { DRUID_SIGNATURES } from './druid.ts';
import { ENGINEER_SIGNATURES } from './engineer.ts';
import { MAGE_SIGNATURES } from './mage.ts';
import { MONK_SIGNATURES } from './monk.ts';
import { NECROMANCER_SIGNATURES } from './necromancer.ts';
import { RANGER_SIGNATURES } from './ranger.ts';
import { ROGUE_SIGNATURES } from './rogue.ts';
import { RUNEBLADE_SIGNATURES } from './runeblade.ts';
import { WARLOCK_SIGNATURES } from './warlock.ts';
import { WARRIOR_SIGNATURES } from './warrior.ts';

export const SIGNATURE_ITEMS: ItemDef[] = [
  ...WARRIOR_SIGNATURES,
  ...ROGUE_SIGNATURES,
  ...MAGE_SIGNATURES,
  ...CLERIC_SIGNATURES,
  ...RANGER_SIGNATURES,
  ...MONK_SIGNATURES,
  ...BARD_SIGNATURES,
  ...DRUID_SIGNATURES,
  ...WARLOCK_SIGNATURES,
  ...ENGINEER_SIGNATURES,
  ...NECROMANCER_SIGNATURES,
  ...RUNEBLADE_SIGNATURES,
  ...DARK_KNIGHT_SIGNATURES,
  ...CULTIST_SIGNATURES,
];

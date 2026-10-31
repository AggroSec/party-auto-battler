import type { AdvancedClassDef, TalentDef, TertiaryClassDef } from '../../engine/run/content-types.ts';
import type { ClassDef, ClassId } from '../class-types.ts';
import { bardClass, bardTalents, skald, trickster } from './bard.ts';
import { blackguard, darkKnightClass, darkKnightTalents, dreadknight } from './dark-knight.ts';
import { cultistClass, cultistTalents, hemomancer, plagueDoctor } from './cultist.ts';
import { clericClass, clericTalents, inquisitor, priest } from './cleric.ts';
import { druidClass, druidTalents, groveWarden, shapeshifter } from './druid.ts';
import { demolitionist, engineerClass, engineerTalents, machinist } from './engineer.ts';
import { chronomancer, mageClass, mageTalents, pyromancer } from './mage.ts';
import { ironFist, monkClass, monkTalents, windwalker } from './monk.ts';
import { lich, necromancerClass, necromancerTalents, plaguelord } from './necromancer.ts';
import { beastmaster, rangerClass, rangerTalents, sharpshooter } from './ranger.ts';
import { assassin, duelist, rogueClass, rogueTalents } from './rogue.ts';
import { duskblade, runebladeClass, runebladeTalents, spellblade } from './runeblade.ts';
import { demonologist, hexer, warlockClass, warlockTalents } from './warlock.ts';
import { BARD_TERTIARY } from './tertiary/bard.ts';
import { CLERIC_TERTIARY } from './tertiary/cleric.ts';
import { CULTIST_TERTIARY } from './tertiary/cultist.ts';
import { DARK_KNIGHT_TERTIARY } from './tertiary/dark-knight.ts';
import { DRUID_TERTIARY } from './tertiary/druid.ts';
import { ENGINEER_TERTIARY } from './tertiary/engineer.ts';
import { MAGE_TERTIARY } from './tertiary/mage.ts';
import { MONK_TERTIARY } from './tertiary/monk.ts';
import { NECROMANCER_TERTIARY } from './tertiary/necromancer.ts';
import { RANGER_TERTIARY } from './tertiary/ranger.ts';
import { ROGUE_TERTIARY } from './tertiary/rogue.ts';
import { RUNEBLADE_TERTIARY } from './tertiary/runeblade.ts';
import { WARLOCK_TERTIARY } from './tertiary/warlock.ts';
import { WARRIOR_TERTIARY } from './tertiary/warrior.ts';
import { berserker, knight, warriorClass, warriorTalents } from './warrior.ts';

export const BASE_CLASSES: Record<ClassId, ClassDef> = {
  warrior: warriorClass,
  rogue: rogueClass,
  mage: mageClass,
  cleric: clericClass,
  ranger: rangerClass,
  monk: monkClass,
  bard: bardClass,
  druid: druidClass,
  warlock: warlockClass,
  engineer: engineerClass,
  necromancer: necromancerClass,
  runeblade: runebladeClass,
  'dark-knight': darkKnightClass,
  cultist: cultistClass,
};

/** Level-2 talent pools by base class. */
export const BASE_TALENTS: Record<ClassId, readonly TalentDef[]> = {
  warrior: warriorTalents,
  rogue: rogueTalents,
  mage: mageTalents,
  cleric: clericTalents,
  ranger: rangerTalents,
  monk: monkTalents,
  bard: bardTalents,
  druid: druidTalents,
  warlock: warlockTalents,
  engineer: engineerTalents,
  necromancer: necromancerTalents,
  runeblade: runebladeTalents,
  'dark-knight': darkKnightTalents,
  cultist: cultistTalents,
};

const ADVANCED = [
  knight, berserker, assassin, duelist, pyromancer, chronomancer, priest, inquisitor, sharpshooter, beastmaster,
  windwalker, ironFist, skald, trickster, shapeshifter, groveWarden, hexer, demonologist, machinist, demolitionist,
  lich, plaguelord, spellblade, duskblade, blackguard, dreadknight, hemomancer, plagueDoctor,
];

const TERTIARY: { cls: TertiaryClassDef; talents: TalentDef[] }[] = [
  ...WARRIOR_TERTIARY,
  ...ROGUE_TERTIARY,
  ...MAGE_TERTIARY,
  ...CLERIC_TERTIARY,
  ...RANGER_TERTIARY,
  ...MONK_TERTIARY,
  ...BARD_TERTIARY,
  ...DRUID_TERTIARY,
  ...WARLOCK_TERTIARY,
  ...ENGINEER_TERTIARY,
  ...NECROMANCER_TERTIARY,
  ...RUNEBLADE_TERTIARY,
  ...DARK_KNIGHT_TERTIARY,
  ...CULTIST_TERTIARY,
];

/** Advanced classes, each listing the tertiary classes that name it as their parent. */
export const ADVANCED_CLASSES: Record<string, AdvancedClassDef> = Object.fromEntries(
  ADVANCED.map((a) => [
    a.cls.id,
    { ...a.cls, tertiaryClasses: TERTIARY.filter((t) => t.cls.advancedClassId === a.cls.id).map((t) => t.cls.id) },
  ]),
);

export const TERTIARY_CLASSES: Record<string, TertiaryClassDef> = Object.fromEntries(TERTIARY.map((t) => [t.cls.id, t.cls]));

export const TALENTS: Record<string, TalentDef> = Object.fromEntries(
  [...Object.values(BASE_TALENTS).flat(), ...ADVANCED.flatMap((a) => a.talents), ...TERTIARY.flatMap((t) => t.talents)].map((t) => [t.id, t]),
);

import type { AdvancedClassDef, TalentDef, TertiaryClassDef } from '../../engine/run/content-types.ts';
import type { ClassDef, ClassId } from '../class-types.ts';
import { bardClass, bardTalents, skald, trickster } from './bard.ts';
import { clericClass, clericTalents, inquisitor, priest } from './cleric.ts';
import { druidClass, druidTalents, groveWarden, shapeshifter } from './druid.ts';
import { demolitionist, engineerClass, engineerTalents, machinist } from './engineer.ts';
import { chronomancer, mageClass, mageTalents, pyromancer } from './mage.ts';
import { ironFist, monkClass, monkTalents, windwalker } from './monk.ts';
import { lich, necromancerClass, necromancerTalents, plaguelord } from './necromancer.ts';
import { beastmaster, rangerClass, rangerTalents, sharpshooter } from './ranger.ts';
import { assassin, duelist, rogueClass, rogueTalents } from './rogue.ts';
import { demonologist, hexer, warlockClass, warlockTalents } from './warlock.ts';
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
};

const ADVANCED = [
  knight, berserker, assassin, duelist, pyromancer, chronomancer, priest, inquisitor, sharpshooter, beastmaster,
  windwalker, ironFist, skald, trickster, shapeshifter, groveWarden, hexer, demonologist, machinist, demolitionist,
  lich, plaguelord,
];

export const ADVANCED_CLASSES: Record<string, AdvancedClassDef> = Object.fromEntries(ADVANCED.map((a) => [a.cls.id, a.cls]));

const TERTIARY: { cls: TertiaryClassDef; talents: TalentDef[] }[] = [];

export const TERTIARY_CLASSES: Record<string, TertiaryClassDef> = Object.fromEntries(TERTIARY.map((t) => [t.cls.id, t.cls]));

export const TALENTS: Record<string, TalentDef> = Object.fromEntries(
  [...Object.values(BASE_TALENTS).flat(), ...ADVANCED.flatMap((a) => a.talents), ...TERTIARY.flatMap((t) => t.talents)].map((t) => [t.id, t]),
);

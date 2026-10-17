import type { AdvancedClassDef, TalentDef } from '../../engine/run/content-types.ts';
import { clericTalents, inquisitor, priest } from './cleric.ts';
import { chronomancer, mageTalents, pyromancer } from './mage.ts';
import { lich, necromancerTalents, plaguelord } from './necromancer.ts';
import { beastmaster, rangerTalents, sharpshooter } from './ranger.ts';
import { assassin, duelist, rogueTalents } from './rogue.ts';
import { berserker, knight, warriorTalents } from './warrior.ts';

/** Level-2 talent pools by base class. */
export const BASE_TALENTS = {
  warrior: warriorTalents,
  rogue: rogueTalents,
  mage: mageTalents,
  cleric: clericTalents,
  ranger: rangerTalents,
  necromancer: necromancerTalents,
};

const ADVANCED = [knight, berserker, assassin, duelist, pyromancer, chronomancer, priest, inquisitor, sharpshooter, beastmaster, lich, plaguelord];

export const ADVANCED_CLASSES: Record<string, AdvancedClassDef> = Object.fromEntries(ADVANCED.map((a) => [a.cls.id, a.cls]));

export const TALENTS: Record<string, TalentDef> = Object.fromEntries(
  [...Object.values(BASE_TALENTS).flat(), ...ADVANCED.flatMap((a) => a.talents)].map((t) => [t.id, t]),
);

export const talentIds = (talents: readonly TalentDef[]) => talents.map((t) => t.id);

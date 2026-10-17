// XP, level-ups, stat growth rolls and level-up choices.
import type { Rng } from '../rng.ts';
import type { StatKey } from '../types.ts';
import { classFor } from './build.ts';
import type { ProgressionConfig } from './content-types.ts';
import type { OwnedUnit, PendingChoice, RunContent } from './types.ts';

const STATS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd'];

export function maxLevel(cfg: ProgressionConfig): number {
  return cfg.xpForLevel.length;
}

/** Pick up to n distinct items in random order. */
export function sample<T>(rng: Rng, items: readonly T[], n: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) out.push(pool.splice(rng.int(pool.length), 1)[0]!);
  return out;
}

/** Roll one level's worth of stat growth from the class's weighted ranges. */
export function rollGrowth(unit: OwnedUnit, content: RunContent, rng: Rng): void {
  const growth = classFor(content, unit.classId).growth;
  for (const k of STATS) {
    const [min, max] = growth[k];
    unit.growth[k] += min + rng.int(max - min + 1);
  }
}

/** Talent options for a level-up, or null if the pool is exhausted or the advanced class is still undecided. */
export function talentOptions(
  unit: OwnedUnit,
  level: number,
  content: RunContent,
  cfg: ProgressionConfig,
  rng: Rng,
): string[] | null {
  let pool: readonly string[];
  if (level < cfg.advanceLevel) {
    pool = classFor(content, unit.classId).talents;
  } else {
    if (!unit.advancedClassId) return null;
    pool = content.advancedClasses[unit.advancedClassId]?.talents ?? [];
  }
  const fresh = pool.filter((id) => !unit.talents.includes(id) && content.talents[id]);
  return fresh.length > 0 ? sample(rng, fresh, cfg.talentChoices) : [];
}

/**
 * Add XP and process any level-ups: roll stat growth and queue choices.
 * Mutates `unit` and returns the new pending choices (in level order).
 */
export function grantXp(
  unit: OwnedUnit,
  amount: number,
  content: RunContent,
  cfg: ProgressionConfig,
  rng: Rng,
): PendingChoice[] {
  const choices: PendingChoice[] = [];
  unit.xp += amount;
  while (unit.level < maxLevel(cfg) && unit.xp >= cfg.xpForLevel[unit.level]!) {
    unit.level += 1;
    rollGrowth(unit, content, rng);
    if (unit.level === cfg.advanceLevel) {
      const options = classFor(content, unit.classId).advancedClasses.filter((id) => content.advancedClasses[id]);
      if (options.length > 0) choices.push({ uid: unit.uid, level: unit.level, kind: 'advance', options: [...options] });
    } else {
      // Options for post-advance levels are rolled once the advanced class is chosen (null = placeholder).
      const options = talentOptions(unit, unit.level, content, cfg, rng);
      if (options === null || options.length > 0) {
        choices.push({ uid: unit.uid, level: unit.level, kind: 'talent', options: options ?? [] });
      }
    }
  }
  return choices;
}

/** Apply a chosen option to its unit. Returns false if the option is invalid. */
export function applyChoice(unit: OwnedUnit, choice: PendingChoice, option: number): boolean {
  const pick = choice.options[option];
  if (pick === undefined) return false;
  if (choice.kind === 'advance') unit.advancedClassId = pick;
  else unit.talents.push(pick);
  return true;
}

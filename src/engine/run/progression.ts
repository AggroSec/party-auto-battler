// XP, level-ups, stat points and level-up choices.
import type { Rng } from '../rng.ts';
import type { StatKey } from '../types.ts';
import { classFor } from './build.ts';
import type { ProgressionConfig, StatWeights } from './content-types.ts';
import type { OwnedUnit, PendingChoice, RunContent } from './types.ts';

export const STATS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd'];

export type StatPoints = Record<StatKey, number>;

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

export function isMaxLevel(unit: OwnedUnit, cfg: ProgressionConfig): boolean {
  return unit.level >= maxLevel(cfg);
}

/** The recommended spread for a unit: its advanced class's, else its base class's. */
export function statWeights(unit: OwnedUnit, content: RunContent): StatWeights {
  const adv = unit.advancedClassId ? content.advancedClasses[unit.advancedClassId] : undefined;
  return adv?.statWeights ?? classFor(content, unit.classId).statWeights;
}

/** Points already spent per stat. */
export function spentPoints(unit: OwnedUnit, cfg: ProgressionConfig): StatPoints {
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const k of STATS) out[k] = Math.round(unit.growth[k] / cfg.statPointValue[k]);
  return out;
}

/**
 * Where the recommended spread puts `points` more points: one at a time, to
 * the stat furthest below its weighted share of everything spent so far, so
 * a unit stays on its class's spread across levels. Deterministic.
 */
export function recommendedAllocation(unit: OwnedUnit, content: RunContent, cfg: ProgressionConfig, points = unit.statPoints): StatPoints {
  const weights = statWeights(unit, content);
  const totalWeight = STATS.reduce((s, k) => s + weights[k], 0);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  if (totalWeight <= 0) return out;
  const spent = spentPoints(unit, cfg);
  let total = STATS.reduce((s, k) => s + spent[k], 0);
  for (let i = 0; i < points; i++) {
    total += 1;
    let best: StatKey = 'hp';
    let bestGap = -Infinity;
    for (const k of STATS) {
      if (weights[k] <= 0) continue;
      const gap = (weights[k] / totalWeight) * total - (spent[k] + out[k]);
      if (gap > bestGap) {
        best = k;
        bestGap = gap;
      }
    }
    out[best] += 1;
  }
  return out;
}

/** Spend points on a unit. Returns false (changing nothing) if the allocation is invalid. */
export function allocatePoints(unit: OwnedUnit, points: Partial<StatPoints>, cfg: ProgressionConfig): boolean {
  let sum = 0;
  for (const k of STATS) {
    const n = points[k] ?? 0;
    if (!Number.isInteger(n) || n < 0) return false;
    sum += n;
  }
  if (sum > unit.statPoints) return false;
  for (const k of STATS) unit.growth[k] += (points[k] ?? 0) * cfg.statPointValue[k];
  unit.statPoints -= sum;
  return true;
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
 * Add XP and process any level-ups: grant stat points and queue choices.
 * Units at the level cap gain no XP. Mutates `unit` and returns the new
 * pending choices (in level order).
 */
export function grantXp(
  unit: OwnedUnit,
  amount: number,
  content: RunContent,
  cfg: ProgressionConfig,
  rng: Rng,
): PendingChoice[] {
  const choices: PendingChoice[] = [];
  if (isMaxLevel(unit, cfg)) return choices;
  unit.xp += amount;
  while (unit.level < maxLevel(cfg) && unit.xp >= cfg.xpForLevel[unit.level]!) {
    unit.level += 1;
    unit.statPoints += cfg.statPointsByLevel[unit.level - 1] ?? 0;
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

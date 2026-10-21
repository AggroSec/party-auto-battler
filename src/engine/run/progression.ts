// XP, level-ups, stat points and level-up choices.
import type { Rng } from '../rng.ts';
import type { StatKey } from '../types.ts';
import { classFor, classTiers } from './build.ts';
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

/** The recommended spread for a unit: its most advanced class's that sets one, else its base class's. */
export function statWeights(unit: OwnedUnit, content: RunContent): StatWeights {
  const { adv, tert } = classTiers(unit, content);
  return tert?.statWeights ?? adv?.statWeights ?? classFor(content, unit.classId).statWeights;
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

/**
 * Talent options for a level-up, or null if the class tier the level draws
 * from is still undecided. Levels below the advance level draw from the base
 * class's pool, then the advanced class's, then (from the ascend level) the
 * tertiary class's. When the current pool has fewer unpicked talents than a
 * full offer, it's topped up with unpicked talents from earlier tiers.
 */
export function talentOptions(
  unit: OwnedUnit,
  level: number,
  content: RunContent,
  cfg: ProgressionConfig,
  rng: Rng,
): string[] | null {
  const { adv, tert } = classTiers(unit, content);
  const tiers: (readonly string[])[] = [classFor(content, unit.classId).talents];
  if (level > cfg.advanceLevel) {
    if (!adv) return null;
    tiers.unshift(adv.talents);
  }
  // A tier with no classes to pick (none defined) is skipped rather than waited on.
  if (level > cfg.ascendLevel && (classOptions(unit, 'ascend', content)?.length ?? 0) > 0) {
    if (!tert) return null;
    tiers.unshift(tert.talents);
  }
  const fresh = (pool: readonly string[]) => pool.filter((id) => !unit.talents.includes(id) && content.talents[id]);
  const options = sample(rng, fresh(tiers[0]!), cfg.talentChoices);
  const leftovers = tiers.slice(1).flatMap(fresh);
  return [...options, ...sample(rng, leftovers, cfg.talentChoices - options.length)];
}

/** Class options for an advance (level 3) or ascend (level 7) choice; null if the previous tier is undecided. */
export function classOptions(unit: OwnedUnit, kind: 'advance' | 'ascend', content: RunContent): string[] | null {
  if (kind === 'advance') return classFor(content, unit.classId).advancedClasses.filter((id) => content.advancedClasses[id]);
  const { adv } = classTiers(unit, content);
  if (!adv) return null;
  return (adv.tertiaryClasses ?? []).filter((id) => content.tertiaryClasses[id]);
}

/** Options for a pending choice, rolling them if it was queued before an earlier class choice was made. */
export function choiceOptions(unit: OwnedUnit, choice: PendingChoice, content: RunContent, cfg: ProgressionConfig, rng: Rng): string[] | null {
  if (choice.options.length > 0) return choice.options;
  return choice.kind === 'talent' ? talentOptions(unit, choice.level, content, cfg, rng) : classOptions(unit, choice.kind, content);
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
    // Options that depend on a class choice not yet made are rolled once it is (null → empty placeholder).
    const kind = unit.level === cfg.advanceLevel ? 'advance' : unit.level === cfg.ascendLevel ? 'ascend' : 'talent';
    const options = kind === 'talent' ? talentOptions(unit, unit.level, content, cfg, rng) : classOptions(unit, kind, content);
    if (options === null || options.length > 0) choices.push({ uid: unit.uid, level: unit.level, kind, options: options ?? [] });
  }
  return choices;
}

/** Apply a chosen option to its unit. Returns false if the option is invalid. */
export function applyChoice(unit: OwnedUnit, choice: PendingChoice, option: number): boolean {
  const pick = choice.options[option];
  if (pick === undefined) return false;
  if (choice.kind === 'advance') unit.advancedClassId = pick;
  else if (choice.kind === 'ascend') unit.tertiaryClassId = pick;
  else unit.talents.push(pick);
  return true;
}

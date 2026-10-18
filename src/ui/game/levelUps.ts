// Which units levelled up between two boards, and the stats each gained.
import type { Stats } from '../../engine/index.ts';
import { boardUnits, type Board } from '../../engine/run/index.ts';

export interface LevelUp {
  uid: number;
  name: string;
  from: number;
  to: number;
  /** Stats rolled from class growth across those levels. */
  gained: Stats;
}

const STAT_KEYS = ['hp', 'atk', 'def', 'spd'] as const;

/** Level-ups from `before` to `after`, matched by uid (a sold unit can't level up). */
export function levelUps(before: Board, after: Board): LevelUp[] {
  const prev = new Map(boardUnits(before).map((u) => [u.uid, u]));
  const out: LevelUp[] = [];
  for (const u of boardUnits(after)) {
    const old = prev.get(u.uid);
    if (!old || u.level <= old.level) continue;
    const gained = { hp: 0, atk: 0, def: 0, spd: 0 };
    for (const k of STAT_KEYS) gained[k] = u.growth[k] - old.growth[k];
    out.push({ uid: u.uid, name: u.name, from: old.level, to: u.level, gained });
  }
  return out;
}

/** Later level-ups replace earlier ones for the same unit. */
export function mergeLevelUps(current: readonly LevelUp[], next: readonly LevelUp[]): LevelUp[] {
  const ids = new Set(next.map((l) => l.uid));
  return [...current.filter((l) => !ids.has(l.uid)), ...next];
}

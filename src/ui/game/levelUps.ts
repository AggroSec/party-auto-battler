// Which units levelled up between two boards, and the stat points that earned them.
import { boardUnits, type Board, type ProgressionConfig } from '../../engine/run/index.ts';

export interface LevelUp {
  uid: number;
  name: string;
  from: number;
  to: number;
  /** Stat points granted across those levels. */
  points: number;
}

/** Level-ups from `before` to `after`, matched by uid (a sold unit can't level up). */
export function levelUps(before: Board, after: Board, cfg: ProgressionConfig): LevelUp[] {
  const prev = new Map(boardUnits(before).map((u) => [u.uid, u]));
  const out: LevelUp[] = [];
  for (const u of boardUnits(after)) {
    const old = prev.get(u.uid);
    if (!old || u.level <= old.level) continue;
    let points = 0;
    for (let level = old.level + 1; level <= u.level; level++) points += cfg.statPointsByLevel[level - 1] ?? 0;
    out.push({ uid: u.uid, name: u.name, from: old.level, to: u.level, points });
  }
  return out;
}

/** Later level-ups replace earlier ones for the same unit. */
export function mergeLevelUps(current: readonly LevelUp[], next: readonly LevelUp[]): LevelUp[] {
  const ids = new Set(next.map((l) => l.uid));
  return [...current.filter((l) => !ids.has(l.uid)), ...next];
}

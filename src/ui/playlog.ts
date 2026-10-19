import type { PlayLogEntry } from '../engine/run/index.ts';
import { load, save } from './game/storage.ts';

type WithoutAt<T> = T extends unknown ? Omit<T, 'at'> : never;

const STORE_KEY = 'playlog';
/** The browser keeps the newest few runs so they can be exported later. */
export const MAX_RUNS = 5;
const MAX_CHARS = 500_000;

const isEntries = (x: unknown): x is PlayLogEntry[] => Array.isArray(x);

/**
 * Record a play-log entry. Every build keeps recent runs in localStorage for
 * "Export play log"; the dev server also gets each entry, which it appends to
 * playlogs/. Failures are ignored.
 */
export function logPlay(entry: WithoutAt<PlayLogEntry>): void {
  const full = { ...entry, at: new Date().toISOString() } as PlayLogEntry;
  save(STORE_KEY, trimLog([...(load(STORE_KEY, isEntries) ?? []), full]));
  if (!import.meta.env.DEV) return;
  try {
    void fetch('/__playlog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(full),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Logging must never break the game.
  }
}

/** Drop whole runs, oldest first, until at most `maxRuns` remain and the log fits in `maxChars`. */
export function trimLog(entries: PlayLogEntry[], maxRuns = MAX_RUNS, maxChars = MAX_CHARS): PlayLogEntry[] {
  let runs = [...new Set(entries.map((e) => e.run))];
  let kept = entries;
  while (runs.length > 1 && (runs.length > maxRuns || JSON.stringify(kept).length > maxChars)) {
    const oldest = runs[0];
    runs = runs.slice(1);
    kept = kept.filter((e) => e.run !== oldest);
  }
  return kept;
}

/** The stored log as JSON lines, the format `npm run playlog` reads. */
export function storedPlayLog(): { text: string; runs: number } {
  const entries = load(STORE_KEY, isEntries) ?? [];
  return { text: entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : ''), runs: new Set(entries.map((e) => e.run)).size };
}

export const newRunId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

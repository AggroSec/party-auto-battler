import type { PlayLogEntry } from '../engine/run/index.ts';

type WithoutAt<T> = T extends unknown ? Omit<T, 'at'> : never;

/**
 * Dev only: send a play-log entry to the Vite dev server, which appends it to
 * playlogs/. Compiled out of production builds; failures are ignored.
 */
export function logPlay(entry: WithoutAt<PlayLogEntry>): void {
  if (!import.meta.env.DEV) return;
  try {
    void fetch('/__playlog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...entry, at: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Logging must never break the game.
  }
}

export const newRunId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

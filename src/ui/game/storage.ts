// localStorage helpers. Every read and write is wrapped: storage can be
// missing, full, blocked (private mode) or hold data from an older version,
// and the game must keep working without it.

const PREFIX = 'pab:';

/**
 * Bump when the saved shape changes incompatibly; older saves are ignored.
 * v2 (M5): stat points replace growth rolls. v3 (M6): tertiary classes and 15-win runs.
 * v4 (M7): runs carry their setup (tier, perks, unlocked content).
 */
export const SAVE_VERSION = 4;

/**
 * The meta-progression profile has its own version, so run-format changes
 * (which bump SAVE_VERSION) never wipe unlocks and achievements.
 */
export const PROFILE_VERSION = 1;

interface Envelope<T> {
  v: number;
  data: T;
}

export function load<T>(key: string, isValid: (data: unknown) => data is T, version = SAVE_VERSION): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Envelope<unknown>>;
    if (parsed.v !== version || !isValid(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function save<T>(key: string, data: T, version = SAVE_VERSION): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify({ v: version, data } satisfies Envelope<T>));
  } catch {
    // Storage full or unavailable: the game continues unsaved.
  }
}

export function remove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(PREFIX + key);
  } catch {
    // Ignore.
  }
}

export const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

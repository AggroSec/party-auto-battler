// localStorage helpers. Every read and write is wrapped: storage can be
// missing, full, blocked (private mode) or hold data from an older version,
// and the game must keep working without it.

const PREFIX = 'pab:';

/** Bump when the saved shape changes incompatibly; older saves are ignored. */
export const SAVE_VERSION = 1;

interface Envelope<T> {
  v: number;
  data: T;
}

export function load<T>(key: string, isValid: (data: unknown) => data is T): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Envelope<unknown>>;
    if (parsed.v !== SAVE_VERSION || !isValid(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function save<T>(key: string, data: T): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify({ v: SAVE_VERSION, data } satisfies Envelope<T>));
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

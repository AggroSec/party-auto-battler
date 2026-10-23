// Saving the meta-progression profile (M7). Pure helpers, testable outside React.
import { newProfile, type Profile } from '../../engine/meta/index.ts';
import { isObject, load, PROFILE_VERSION, save } from './storage.ts';

export const PROFILE_KEY = 'profile';

const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every((s) => typeof s === 'string');

/** Shape check; anything off falls back to a fresh profile rather than crashing. */
export function isProfile(x: unknown): x is Profile {
  if (!isObject(x) || !strings(x.achievements) || !strings(x.discovered)) return false;
  if (typeof x.maxTier !== 'number' || typeof x.unlockAll !== 'boolean' || !isObject(x.stats)) return false;
  const s = x.stats;
  if (typeof s.runs !== 'number' || typeof s.completed !== 'number' || typeof s.fightsWon !== 'number') return false;
  return x.daily === null || (isObject(x.daily) && typeof x.daily.date === 'string');
}

export function loadProfile(): Profile {
  return load(PROFILE_KEY, isProfile, PROFILE_VERSION) ?? newProfile();
}

export function saveProfile(profile: Profile): void {
  save(PROFILE_KEY, profile, PROFILE_VERSION);
}

/** Today's date (local time) as YYYY-MM-DD, for the daily run. */
export function todayString(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

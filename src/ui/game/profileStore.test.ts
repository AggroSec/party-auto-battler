import { afterEach, describe, expect, it } from 'vitest';
import { newProfile } from '../../engine/meta/index.ts';
import { isProfile, loadProfile, PROFILE_KEY, saveProfile, todayString } from './profileStore.ts';
import { SAVE_VERSION } from './storage.ts';

const g = globalThis as { localStorage?: Storage };
function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
}
afterEach(() => {
  delete g.localStorage;
});

describe('profile store', () => {
  it('validates the profile shape', () => {
    expect(isProfile(newProfile())).toBe(true);
    expect(isProfile({ ...newProfile(), achievements: [1] })).toBe(false);
    expect(isProfile({ ...newProfile(), stats: {} })).toBe(false);
    expect(isProfile(null)).toBe(false);
  });

  it('round-trips and survives run-format version bumps', () => {
    g.localStorage = fakeStorage();
    expect(loadProfile()).toEqual(newProfile());
    saveProfile({ ...newProfile(), achievements: ['first-victory'], maxTier: 2 });
    expect(loadProfile()).toMatchObject({ achievements: ['first-victory'], maxTier: 2 });
    // The envelope carries the profile version, not the run save version.
    expect(JSON.parse(g.localStorage.getItem(`pab:${PROFILE_KEY}`)!).v).not.toBe(SAVE_VERSION);
  });

  it('formats local dates for the daily run', () => {
    expect(todayString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

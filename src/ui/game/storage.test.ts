import { afterEach, describe, expect, it } from 'vitest';
import { load, remove, save, SAVE_VERSION } from './storage.ts';

const isNumber = (x: unknown): x is number => typeof x === 'number';

function fakeStorage(overrides: Partial<Storage> = {}): Storage {
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
    ...overrides,
  };
}

const g = globalThis as { localStorage?: Storage };
afterEach(() => {
  delete g.localStorage;
});

describe('storage', () => {
  it('round-trips data in a versioned envelope', () => {
    g.localStorage = fakeStorage();
    save('x', 42);
    expect(JSON.parse(g.localStorage.getItem('pab:x')!)).toEqual({ v: SAVE_VERSION, data: 42 });
    expect(load('x', isNumber)).toBe(42);
    remove('x');
    expect(load('x', isNumber)).toBeNull();
  });

  it('ignores corrupt, invalid or old-version data', () => {
    g.localStorage = fakeStorage();
    g.localStorage.setItem('pab:a', '{not json');
    g.localStorage.setItem('pab:b', JSON.stringify({ v: SAVE_VERSION, data: 'nope' }));
    g.localStorage.setItem('pab:c', JSON.stringify({ v: SAVE_VERSION - 1, data: 1 }));
    expect(load('a', isNumber)).toBeNull();
    expect(load('b', isNumber)).toBeNull();
    expect(load('c', isNumber)).toBeNull();
  });

  it('never throws when storage is missing, full or blocked', () => {
    expect(load('x', isNumber)).toBeNull();
    expect(() => save('x', 1)).not.toThrow();
    const boom = () => {
      throw new Error('blocked');
    };
    g.localStorage = fakeStorage({ getItem: boom, setItem: boom, removeItem: boom });
    expect(load('x', isNumber)).toBeNull();
    expect(() => save('x', 1)).not.toThrow();
    expect(() => remove('x')).not.toThrow();
  });
});

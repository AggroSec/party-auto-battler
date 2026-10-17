import { describe, expect, it } from 'vitest';
import { floatsFor } from './Arena.tsx';

describe('combat floating text', () => {
  it('merges a busy frame into one number per kind', () => {
    const t = floatsFor([
      { kind: 'damage', target: 'p0', value: 5, absorbed: 0 },
      { kind: 'damage', target: 'p0', value: 3, absorbed: 2 },
      { kind: 'heal', target: 'p0', value: 4 },
      { kind: 'stat', target: 'p0', stat: 'atk', value: 1 },
      { kind: 'stat', target: 'p0', stat: 'atk', value: 1 },
      { kind: 'trigger', target: 'p0', label: 'Pack Leader' },
    ]);
    expect(t.map((x) => x.text)).toEqual(['-8', '+4', '⚔️+2']);
  });

  it('shows fully absorbed hits in brackets and debuffs distinctly', () => {
    const t = floatsFor([
      { kind: 'damage', target: 'p0', value: 0, absorbed: 6 },
      { kind: 'stat', target: 'p0', stat: 'def', value: -2 },
    ]);
    expect(t).toEqual([
      { text: '(6)', cls: 'dmg' },
      { text: '🛡️-2', cls: 'debuff' },
    ]);
  });
});

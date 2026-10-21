import { describe, expect, it } from 'vitest';
import { ADVANCED_CLASSES } from '../../data/builds/index.ts';
import { CLASSES } from '../../data/classes.ts';
import type { AbilityDef } from '../../engine/index.ts';
import { abilityText, ordinal, parseCadence } from './abilityText.ts';

const abilities = [...Object.values(CLASSES).map((c) => c.ability), ...Object.values(ADVANCED_CLASSES).map((a) => a.ability)];

describe('ability text', () => {
  it('every ability description states its real cooldown and first cast', () => {
    for (const a of abilities) {
      const p = parseCadence(a.description);
      expect(p, a.id).not.toBeNull();
      expect(p!.cooldown, a.id).toBe(a.cooldown);
      expect(p!.first, a.id).toBe(a.initialCooldown);
    }
  });

  it('rewrites the cadence when a build changes the cooldown', () => {
    const base: AbilityDef = { id: 'x', name: 'X', description: 'Every 3rd turn (first on turn 2): hit hard.', cooldown: 3, initialCooldown: 2, effects: [] };
    expect(abilityText(base, base)).toEqual({ cadence: 'Every 3rd turn', first: 'first on turn 2', rest: 'hit hard.' });
    expect(abilityText({ ...base, cooldown: 2, initialCooldown: 1 }, base)).toEqual({
      cadence: 'Every 2nd turn',
      was: 'Every 3rd turn',
      first: 'first on turn 1',
      rest: 'hit hard.',
    });
    expect(abilityText({ ...base, cooldown: 1, initialCooldown: 1 }, base).cadence).toBe('Every turn');
  });

  it('writes ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd']);
  });
});

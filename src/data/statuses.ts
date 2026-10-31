import type { StatusDef } from '../engine/types.ts';

/**
 * Stacking statuses (post-M7). Classes, items and talents apply these through
 * `status` effects; the engine reads everything it needs from the def.
 */

/** Runeblade: carved into enemies; at 5 they detonate (the carver's onBurst triggers). */
export const RUNE: StatusDef = { id: 'rune', name: 'Rune', burstAt: 5 };

/** Runeblade (Searing Runes): a short burn that stacks while Runes build. */
export const SEARING: StatusDef = { id: 'searing', name: 'Searing', dot: { atk: 0.2 }, duration: 3, maxStacks: 5 };

/** Voidblade: stacking rot that eats HP every turn. */
export const CORRUPTION: StatusDef = { id: 'corruption', name: 'Corruption', dot: { atk: 0.25 }, duration: 3, maxStacks: 10 };

/** Dark Knight: each stack is −1 ATK, for the rest of the fight. */
export const DREAD: StatusDef = { id: 'dread', name: 'Dread', stats: { atk: -1 }, maxStacks: 2 };

/** Hellknight: demonic fire that clings to whoever touches it. */
export const HELLFIRE: StatusDef = { id: 'hellfire', name: 'Hellfire', dot: { atk: 0.2 }, duration: 3, maxStacks: 5 };

/** Cultist: a creeping rot whose every tick heals the Cultist's most wounded ally. */
export const BLIGHT: StatusDef = { id: 'blight', name: 'Blight', dot: { atk: 0.2 }, duration: 3, maxStacks: 5, dotHeals: 0.5 };

/** Berserker (Deathless Fury): can't drop below 1 HP, and hits harder, for 2 turns. */
export const DEATHLESS_FURY: StatusDef = {
  id: 'deathless-fury',
  name: 'Deathless Fury',
  preventDeath: true,
  duration: 2,
  stats: { atk: 4, spd: 4 },
};

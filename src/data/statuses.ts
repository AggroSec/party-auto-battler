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

/**
 * Mercenary: one per limb, so up to 4, for the rest of the fight. Each is a
 * small SPD loss on its own; the Headsman and Maimer build on them.
 */
export const BROKEN_LIMB: StatusDef = { id: 'broken-limb', name: 'Broken Limb', stats: { spd: -1 }, maxStacks: 4 };

/**
 * Sylvan (Milestone 14): healing over time. At the start of each of the
 * unit's turns it heals, for 3 turns; reapplying refreshes it (and re-reads
 * the applier's ATK), it never stacks.
 */
export const RENEWAL: StatusDef = { id: 'renewal', name: 'Renewal', hot: { atk: 0.7 }, duration: 3, maxStacks: 1 };
/** Bloomcaller's stronger Renewal (same id, so it refreshes rather than adds). */
export const GREATER_RENEWAL: StatusDef = { ...RENEWAL, name: 'Greater Renewal', hot: { atk: 1.1 } };
/** Thornweaver: melee attackers that hit the unit take damage, for 3 turns. */
export const THORNS: StatusDef = { id: 'thorns', name: 'Thorns', thorns: { atk: 0.4 }, duration: 3, maxStacks: 1 };
/** Rootwarden: rooted enemies lose 3 SPD for 2 turns. */
export const ROOTED: StatusDef = { id: 'rooted', name: 'Rooted', stats: { spd: -3 }, duration: 2, maxStacks: 1, affliction: true };

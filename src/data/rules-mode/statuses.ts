import type { StatusDef } from '../../engine/types.ts';

/**
 * Rules mode: afflictions and short buffs. Afflictions are timed (counted in
 * the afflicted unit's turns; reapplying refreshes them), so a lock has to be
 * kept up, and cures strip them one at a time. Every affliction counts once
 * toward "damage per affliction", whatever its stacks.
 */
// One stack unless a status says otherwise (Rot, Bleed, Poison, Runes): reapplying
// only refreshes it. (Before Milestone 13 these stacked without limit by mistake.)
const aff = (def: Omit<StatusDef, 'affliction'>): StatusDef => ({ maxStacks: 1, ...def, affliction: true });
const buff = (def: StatusDef): StatusDef => ({ maxStacks: 1, ...def });

export const FROSTBITE = aff({ id: 'frostbite', name: 'Frostbite', stats: { spd: -3 }, duration: 4 });
export const WEAKNESS = aff({ id: 'weakness', name: 'Weakness', stats: { atk: -3 }, duration: 4 });
export const BRITTLE = aff({ id: 'brittle', name: 'Brittle', stats: { def: -3 }, duration: 4 });
export const HUSH = aff({ id: 'hush', name: 'Hush', silence: true, duration: 2 });
export const ROT = aff({ id: 'rot', name: 'Rot', dot: { atk: 0.3 }, maxStacks: 3, duration: 4 });
export const FEVER = aff({ id: 'fever', name: 'Fever', healingTaken: 0.5, duration: 4 });
export const BIND = aff({ id: 'bind', name: 'Bind', stun: true, duration: 1 });
export const BLEED = aff({ id: 'bleed', name: 'Bleed', dot: { atk: 0.2 }, maxStacks: 5, duration: 3 });
export const POISON = aff({ id: 'poison', name: 'Poison', dot: { atk: 0.35 }, maxStacks: 3, duration: 4 });
export const BURN = aff({ id: 'burn', name: 'Burn', dot: { atk: 0.35 }, duration: 3 });
export const MARKED = aff({ id: 'marked', name: 'Marked', damageTaken: 1.25, duration: 3 });
export const SLOWED = aff({ id: 'slowed', name: 'Slowed', stats: { spd: -4 }, duration: 3 });
/** Runeblade: carved runes, detonated by its skills for damage per rune. */
export const RUNE_MARK = aff({ id: 'rune-mark', name: 'Rune', maxStacks: 5 });

export const FORTIFIED = buff({ id: 'fortified', name: 'Fortified', stats: { def: 6 }, duration: 3 });
export const ENRAGED = buff({ id: 'enraged', name: 'Enraged', stats: { atk: 4 }, duration: 3 });
export const HASTED = buff({ id: 'hasted', name: 'Hasted', stats: { spd: 4 }, duration: 3 });
export const ENCHANTED = buff({ id: 'enchanted', name: 'Enchanted', stats: { atk: 3 }, duration: 3 });
export const BLESSED = buff({ id: 'blessed', name: 'Blessed', preventDeath: true, duration: 2 });

/**
 * Empowered versions (Milestone 13): the same status (same id, so rules that
 * check it still match) with bigger numbers, from Empowered talents on skills
 * that +power can't scale.
 */
export const EMPOWERED = {
  fortified: { ...FORTIFIED, stats: { def: 8 } },
  enraged: { ...ENRAGED, stats: { atk: 5 } },
  hasted: { ...HASTED, stats: { spd: 5 } },
  enchanted: { ...ENCHANTED, stats: { atk: 4 } },
  marked: { ...MARKED, damageTaken: 1.35 },
  blessed: { ...BLESSED, duration: 3 },
} satisfies Record<string, StatusDef>;

export const RULES_STATUSES: Record<string, StatusDef> = Object.fromEntries(
  [FROSTBITE, WEAKNESS, BRITTLE, HUSH, ROT, FEVER, BIND, BLEED, POISON, BURN, MARKED, SLOWED, RUNE_MARK, FORTIFIED, ENRAGED, HASTED, ENCHANTED, BLESSED].map((s) => [s.id, s]),
);

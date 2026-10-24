import type { Amount } from './types.ts';

/** DEF reduces damage by DEF / (DEF + DEF_SCALE): 10 DEF halves incoming damage. */
export const DEF_SCALE = 10;

/** Resolve an Amount against the source unit's current stats. Never negative. */
export function resolveAmount(
  amount: Amount,
  source: { atk: number; def: number; maxHp: number; hp?: number },
): number {
  const raw =
    (amount.flat ?? 0) +
    (amount.atk ?? 0) * source.atk +
    (amount.def ?? 0) * source.def +
    (amount.maxHp ?? 0) * source.maxHp +
    (amount.missingHp ?? 0) * Math.max(0, source.maxHp - (source.hp ?? source.maxHp));
  return Math.max(0, raw);
}

/**
 * Damage after mitigation. DEF has diminishing returns and can never make a
 * unit immune: any hit with positive raw damage deals at least 1.
 */
export function mitigate(raw: number, def: number, pierce = false): number {
  if (raw <= 0) return 0;
  const effectiveDef = pierce ? 0 : Math.max(0, def);
  return Math.max(1, Math.round((raw * DEF_SCALE) / (DEF_SCALE + effectiveDef)));
}

/** Split incoming damage between shield and HP. */
export function absorb(damage: number, shield: number): { toShield: number; toHp: number } {
  const toShield = Math.min(shield, damage);
  return { toShield, toHp: damage - toShield };
}

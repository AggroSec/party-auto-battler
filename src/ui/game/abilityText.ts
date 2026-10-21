// Ability descriptions start with their cadence ("Every 3rd turn (first on
// turn 2): ..."). The UI rewrites that prefix from the unit's real cooldown,
// so cooldown changes from talents and items show in the text itself.
import type { AbilityDef } from '../../engine/index.ts';

const CADENCE = /^Every (?:(\d+)(?:st|nd|rd|th) )?turn(?: \(first on turn (\d+)\))?: /;

export function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
}

export const cadenceText = (cooldown: number) => (cooldown === 1 ? 'Every turn' : `Every ${ordinal(cooldown)} turn`);

/** The cadence and first cast stated in a description, if it follows the convention. */
export function parseCadence(description: string): { cooldown: number; first?: number; rest: string } | null {
  const m = CADENCE.exec(description);
  if (!m) return null;
  return { cooldown: m[1] ? Number(m[1]) : 1, ...(m[2] ? { first: Number(m[2]) } : {}), rest: description.slice(m[0].length) };
}

export interface AbilityText {
  /** "Every 2nd turn" for the unit as built. */
  cadence: string;
  /** The base cadence, when the build changed it. */
  was?: string;
  /** "first on turn 1", if the first cast differs from the cadence. */
  first?: string;
  /** The effect text after the cadence. */
  rest: string;
}

/** Describe `actual` (the unit's ability after modifiers), compared with its unmodified `base`. */
export function abilityText(actual: AbilityDef, base: AbilityDef): AbilityText {
  const parsed = parseCadence(actual.description);
  if (!parsed) return { cadence: cadenceText(actual.cooldown), rest: actual.description };
  const first = actual.initialCooldown;
  return {
    cadence: cadenceText(actual.cooldown),
    ...(actual.cooldown !== base.cooldown ? { was: cadenceText(base.cooldown) } : {}),
    ...(first !== undefined && first !== actual.cooldown ? { first: `first on turn ${first}` } : {}),
    rest: parsed.rest,
  };
}

// The per-unit fight breakdown, as text: what each rule (or the ability,
// basic attacks, triggers and consumables) did, and why rules that didn't
// fire were passed over. Shared by the fight summary and the play log.
import type { ActionTally } from '../events.ts';
import type { Rule } from '../types.ts';
import { ruleLabel } from './rule-lists.ts';
import type { RunContent } from './types.ts';

export interface BreakdownRow {
  key: string;
  kind: ActionTally['kind'];
  label: string;
  uses: number;
  damage: number;
  /** Healing plus shielding. */
  support: number;
  afflictions: number;
  kills: number;
  /** Rules: why it was passed over, e.g. "never fired: condition not met ×6, a rule above fired first ×9". */
  note?: string;
}

/** "condition not met ×6, on cooldown ×2" for a rule's passes (empty when none). */
export function passText(passed: NonNullable<ActionTally['passed']>): string {
  return [
    passed.unmet > 0 ? `condition not met ×${passed.unmet}` : '',
    passed.cooldown > 0 ? `on cooldown ×${passed.cooldown}` : '',
    passed.above > 0 ? `a rule above fired first ×${passed.above}` : '',
    passed.silenced > 0 ? `silenced ×${passed.silenced}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Display rows for a unit's breakdown. Rules always show (a rule that never
 * fired is the point); other rows only when they happened. `rules` is the
 * list the unit fought with, for labels.
 */
export function breakdownRows(actions: readonly ActionTally[], rules: readonly Rule[] | undefined, content: RunContent): BreakdownRow[] {
  return actions
    .filter((a) => a.kind === 'rule' || a.uses > 0)
    .map((a) => {
      const rule = a.rule !== undefined ? rules?.[a.rule] : undefined;
      const label = a.rule !== undefined ? `${a.rule + 1}. ${rule ? ruleLabel(rule, content) : a.label}` : a.kind === 'attack' && rules ? 'Basic attack (no rule fired)' : a.label;
      const passes = a.passed ? passText(a.passed) : '';
      return {
        key: a.key,
        kind: a.kind,
        label,
        uses: a.uses,
        damage: a.damage,
        support: a.healing + a.shielding,
        afflictions: a.afflictions,
        kills: a.kills,
        ...(a.passed && (a.uses === 0 || passes) ? { note: a.uses === 0 ? (passes ? `never fired: ${passes}` : 'never fired: no turns') : `skipped: ${passes}` } : {}),
      };
    });
}

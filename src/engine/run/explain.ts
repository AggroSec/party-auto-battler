// Break a unit's resolved numbers down by source (class, stat points, advanced
// class, talents, items, synergies) so the UI can show where each comes from.
// Mirrors the sums in resolveUnit; explain.test.ts keeps the two in step.
import type { StatKey } from '../types.ts';
import { activeSynergies, boardUnits, buildSources, classFor, classTiers, synergySources, type ModifierSource } from './build.ts';
import type { Board, OwnedUnit, RunContent } from './types.ts';

export interface Contribution {
  label: string;
  amount: number;
}

export interface UnitExplanation {
  /** Base value first, then each non-zero change. */
  stats: Record<StatKey, Contribution[]>;
  /** Ability cooldown: the ability's own cooldown, then each change. */
  cooldown: Contribution[];
  /** Additive ability-power changes (the base is 100%). */
  abilityPower: Contribution[];
  /** Additive lifesteal sources. */
  lifesteal: Contribution[];
}

const SUFFIX: Record<ModifierSource['kind'], string> = {
  advanced: ' (advanced)',
  tertiary: ' (tertiary)',
  talent: '',
  item: '',
  classBonus: ' (class bonus)',
  synergy: ' (synergy)',
};

/** Explain a unit as it stands on `board` (synergies included). */
export function explainUnit(unit: OwnedUnit, board: Board, content: RunContent): UnitExplanation {
  const base = classFor(content, unit.classId);
  const { adv, tert } = classTiers(unit, content);
  const sources = [...buildSources(unit, content), ...synergySources(unit, activeSynergies(boardUnits(board), content), content)];
  const labelled = sources.map((s) => ({ label: s.name + SUFFIX[s.kind], m: s.modifier }));
  const pick = (get: (m: ModifierSource['modifier']) => number | undefined): Contribution[] =>
    labelled.flatMap(({ label, m }) => {
      const amount = get(m) ?? 0;
      return amount ? [{ label, amount }] : [];
    });
  const stat = (k: StatKey): Contribution[] => [
    { label: `${base.name} base`, amount: base.baseStats[k] },
    ...(unit.growth[k] ? [{ label: 'Stat points', amount: unit.growth[k] }] : []),
    ...pick((m) => m.stats?.[k]),
  ];
  const ability = tert?.ability ?? adv?.ability ?? base.ability;
  return {
    stats: { hp: stat('hp'), atk: stat('atk'), def: stat('def'), spd: stat('spd') },
    cooldown: [{ label: ability.name, amount: ability.cooldown }, ...pick((m) => m.abilityCooldown)],
    abilityPower: pick((m) => m.abilityPower),
    lifesteal: pick((m) => m.lifesteal),
  };
}

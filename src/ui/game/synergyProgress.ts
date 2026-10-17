import { unitTags, type OwnedUnit, type RunContent } from '../../engine/run/index.ts';
import type { SynergyDef, SynergyRequirement } from '../../engine/run/content-types.ts';

export interface SynergyProgress {
  synergy: SynergyDef;
  /** Index of the active tier, or -1. */
  activeTier: number;
  /** The next tier's description and what's still missing, if there is a next tier. */
  next: { description: string; have: number; need: number; label: string } | null;
  current: string | null;
}

function count(req: SynergyRequirement, units: OwnedUnit[], content: RunContent): { have: number; label: string } {
  if (req.kind === 'tag') return { have: units.filter((u) => unitTags(u, content).includes(req.tag)).length, label: req.tag };
  return { have: new Set(units.map((u) => u.classId)).size, label: 'different classes' };
}

/**
 * Every synergy the board has started on (at least one unit counts towards
 * it), with its active tier and progress to the next. For the shop's
 * synergy panel, so players can plan toward a tier.
 */
export function synergyProgress(units: OwnedUnit[], content: RunContent): SynergyProgress[] {
  const out: SynergyProgress[] = [];
  for (const synergy of content.synergies) {
    let activeTier = -1;
    synergy.tiers.forEach((tier, i) => {
      if (tier.requires.every((r) => count(r, units, content).have >= r.count)) activeTier = i;
    });
    const nextTier = synergy.tiers[activeTier + 1];
    let next: SynergyProgress['next'] = null;
    if (nextTier) {
      // Show the least-satisfied requirement of the next tier.
      const reqs = nextTier.requires.map((r) => ({ ...count(r, units, content), need: r.count }));
      const worst = reqs.reduce((a, b) => (b.have / b.need < a.have / a.need ? b : a));
      next = { description: nextTier.description, ...worst };
    }
    // One class is trivially "1 different class", so that one needs two to count as started.
    const started = activeTier >= 0 || (next !== null && next.have >= (next.label === 'different classes' ? 2 : 1));
    if (started) out.push({ synergy, activeTier, next, current: synergy.tiers[activeTier]?.description ?? null });
  }
  return out.sort((a, b) => b.activeTier - a.activeTier);
}

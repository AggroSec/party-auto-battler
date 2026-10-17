import type { ActiveSynergy } from '../../engine/run/index.ts';

export function SynergyPanel({ active }: { active: ActiveSynergy[] }) {
  return (
    <section className="synergies">
      <h3>Synergies</h3>
      {active.length === 0 ? (
        <p className="muted">None active. Pair classes that share a tag (martial, arcane, divine, shadow, guardian, wild).</p>
      ) : (
        <ul>
          {active.map(({ synergy, tier }) => (
            <li key={synergy.id}>
              <strong>{synergy.name}</strong>
              {synergy.tiers.length > 1 && <span className="muted"> (tier {tier + 1})</span>}: {synergy.tiers[tier]?.description}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

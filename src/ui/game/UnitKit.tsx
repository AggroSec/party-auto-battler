import { useState } from 'react';
import type { UnitSetup } from '../../engine/index.ts';
import { classTiers, explainUnit, STATS, type Board, type Contribution, type OwnedUnit, type RunContext } from '../../engine/run/index.ts';
import { abilityText } from './abilityText.ts';
import { Rules } from './Rules.tsx';

const ICON = { hp: '❤️', atk: '⚔️', def: '🛡️', spd: '💨' } as const;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const signed = (n: string, negative: boolean) => (negative ? `−${n}` : `+${n}`);

/** "7 Mage base + 3 Stat points − 1 Hourglass", with the first entry unsigned. */
function Sources({ items, fmt = String, base }: { items: Contribution[]; fmt?: (n: number) => string; base?: string }) {
  return (
    <>
      {base && <span>{base}</span>}
      {items.map((c, i) => (
        <span key={i}>
          {i === 0 && !base ? fmt(c.amount) : ` ${signed(fmt(Math.abs(c.amount)), c.amount < 0)}`} {c.label}
        </span>
      ))}
    </>
  );
}

/**
 * The unit's kit as built: final stats (tap for where each comes from), its
 * ability with the real cadence, and its passives.
 */
export function UnitKit({ unit, setup, board, ctx }: { unit: OwnedUnit; setup: UnitSetup; board: Board; ctx: RunContext }) {
  const [open, setOpen] = useState(false);
  const { content } = ctx;
  const base = content.classes[unit.classId];
  const { adv, tert } = classTiers(unit, content);
  const ex = explainUnit(unit, board, content);
  const power = setup.abilityPower ?? 1;
  // Talent-granted abilities, unmodified, to show cooldown changes against.
  const grantedBase = unit.talents.flatMap((id) => {
    const a = content.talents[id]?.grantAbility;
    return a ? [a] : [];
  });
  const abilities = [
    { actual: setup.ability, text: abilityText(setup.ability, tert?.ability ?? adv?.ability ?? base!.ability), granted: false },
    ...(setup.extraAbilities ?? []).map((a, i) => ({ actual: a, text: abilityText(a, grantedBase[i] ?? a), granted: true })),
  ];
  // Passives from earlier class tiers stay; label them with the class they come from.
  const passives: { name: string; description: string; from?: string }[] = [];
  if (base?.passive) passives.push(adv ? { ...base.passive, from: base.name } : base.passive);
  if (adv?.passive) passives.push(tert ? { ...adv.passive, from: adv.name } : adv.passive);
  if (tert?.passive) passives.push(tert.passive);

  return (
    <div className="kit">
      <button type="button" className="stats-line" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {STATS.map((k) => `${ICON[k]} ${setup.stats[k]}`).join(' ')}
        {power !== 1 && ` · ✨${pct(power)} power`}
        {setup.lifesteal ? ` · 🩸${pct(setup.lifesteal)} lifesteal` : ''}
        {setup.reach ? ' · 🏹 reach' : ''}
        <span className="muted small"> {open ? '▴ hide' : '▾ breakdown'}</span>
      </button>
      {open && (
        <dl className="breakdown">
          {STATS.map((k) => (
            <div key={k}>
              <dt>
                {ICON[k]} {setup.stats[k]}
              </dt>
              <dd>
                <Sources items={ex.stats[k]} />
              </dd>
            </div>
          ))}
          <div>
            <dt>⏱️ {setup.ability.cooldown}</dt>
            <dd>
              <Sources items={ex.cooldown} fmt={(n) => `${n}`} /> <span className="muted">(turns between casts)</span>
            </dd>
          </div>
          {ex.abilityPower.length > 0 && (
            <div>
              <dt>✨ {pct(power)}</dt>
              <dd>
                <Sources items={ex.abilityPower} fmt={pct} base="100% base" />
              </dd>
            </div>
          )}
          {ex.lifesteal.length > 0 && (
            <div>
              <dt>🩸 {pct(setup.lifesteal ?? 0)}</dt>
              <dd>
                <Sources items={ex.lifesteal} fmt={pct} base="0% base" />
              </dd>
            </div>
          )}
        </dl>
      )}
      {abilities.map(({ actual, text, granted }, i) => (
        <p key={`${actual.id}${i}`} className="kit-ability">
          {granted && <span className="kit-tag">Talent</span>} <strong>{actual.name}</strong>{' '}
          <span className={text.was ? 'cadence changed' : 'cadence'}>
            {text.was && <s>{text.was}</s>} {text.cadence}
            {text.first && ` (${text.first})`}
          </span>
          : <Rules text={text.rest} />
          {power !== 1 && <span className="muted"> Amounts ×{pct(power)} from ability power.</span>}
        </p>
      ))}
      {abilities.length > 1 && (
        <p className="muted small">One ability per turn: if several are ready, the one that has waited longest goes first.</p>
      )}
      {passives.map((p) => (
        <p key={p.name + (p.from ?? '')} className="kit-passive">
          <span className="kit-tag">Passive</span> <strong>{p.name}</strong>
          {p.from && <span className="muted"> ({p.from})</span>}: <Rules text={p.description} />
        </p>
      ))}
    </div>
  );
}

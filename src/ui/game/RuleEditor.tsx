import { BASIC_ATTACK, MAX_RULES, type AbilityDef, type Rule, type RuleCondition, type TargetSelector, type UnitSetup } from '../../engine/index.ts';
import { TARGET_LABEL, targetsFor, unitRules, type OwnedUnit, type RunContext } from '../../engine/run/index.ts';
import { cadenceText } from './abilityText.ts';
import { Rules } from './Rules.tsx';

type Kind = RuleCondition['kind'];

/** Condition menu entries; the number or status they need is picked beside them. */
const CONDITIONS: { kind: Kind; label: string }[] = [
  { kind: 'targetAfflictions', label: 'target has N+ afflictions' },
  { kind: 'targetLacks', label: 'target lacks…' },
  { kind: 'targetHas', label: 'target has…' },
  { kind: 'targetStacks', label: 'target has N+ stacks of…' },
  { kind: 'targetHpBelow', label: 'target below N% HP' },
  { kind: 'selfHpBelow', label: 'self below N% HP' },
  { kind: 'allyHpBelow', label: 'any ally below N% HP' },
  { kind: 'enemiesAtLeast', label: 'N+ enemies standing' },
  { kind: 'selfLacks', label: 'self lacks…' },
];

/** The rule without one of its optional fields. */
function without(rule: Rule, key: 'target' | 'when'): Rule {
  const out = { ...rule };
  delete out[key];
  return out;
}

const range = (from: number, to: number, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/** A fresh condition of a kind, with a sensible number or status. */
function newCondition(kind: Kind, statuses: string[]): RuleCondition {
  const status = statuses[0] ?? '';
  switch (kind) {
    case 'targetAfflictions':
      return { kind, atLeast: 3 };
    case 'targetStacks':
      return { kind, status, atLeast: 3 };
    case 'targetLacks':
    case 'targetHas':
    case 'selfLacks':
      return { kind, status };
    case 'targetHpBelow':
    case 'selfHpBelow':
    case 'allyHpBelow':
      return { kind, percent: 50 };
    case 'enemiesAtLeast':
      return { kind, count: 2 };
  }
}

/** Statuses the unit's own skills apply first, then every other status. */
function statusOptions(skills: readonly AbilityDef[], ctx: RunContext): string[] {
  const own = skills.flatMap((s) => s.effects.flatMap((e) => (e.kind === 'status' ? [e.status.id] : [])));
  return [...new Set([...own, ...Object.keys(ctx.content.statuses ?? {})])];
}

function ConditionPicker({ when, statuses, ctx, onChange }: { when: RuleCondition | undefined; statuses: string[]; ctx: RunContext; onChange: (c: RuleCondition | undefined) => void }) {
  const name = (id: string) => ctx.content.statuses?.[id]?.name ?? id;
  const num = (value: number, options: number[], set: (n: number) => RuleCondition, suffix = '') => (
    <select value={value} onChange={(e) => onChange(set(Number(e.target.value)))} aria-label="Amount">
      {options.map((n) => (
        <option key={n} value={n}>
          {n}
          {suffix}
        </option>
      ))}
    </select>
  );
  const statusPick = (value: string, set: (s: string) => RuleCondition) => (
    <select value={value} onChange={(e) => onChange(set(e.target.value))} aria-label="Status">
      {statuses.map((id) => (
        <option key={id} value={id}>
          {name(id)}
        </option>
      ))}
    </select>
  );
  return (
    <span className="rule-when">
      <select value={when?.kind ?? ''} onChange={(e) => onChange(e.target.value ? newCondition(e.target.value as Kind, statuses) : undefined)} aria-label="Condition">
        <option value="">always</option>
        {CONDITIONS.map((c) => (
          <option key={c.kind} value={c.kind}>
            if {c.label}
          </option>
        ))}
      </select>
      {when?.kind === 'targetAfflictions' && num(when.atLeast, range(1, 10), (atLeast) => ({ ...when, atLeast }), '+')}
      {when?.kind === 'targetStacks' && (
        <>
          {num(when.atLeast, range(1, 5), (atLeast) => ({ ...when, atLeast }), '+')}
          {statusPick(when.status, (status) => ({ ...when, status }))}
        </>
      )}
      {(when?.kind === 'targetLacks' || when?.kind === 'targetHas' || when?.kind === 'selfLacks') && statusPick(when.status, (status) => ({ ...when, status }))}
      {(when?.kind === 'targetHpBelow' || when?.kind === 'selfHpBelow' || when?.kind === 'allyHpBelow') && num(when.percent, range(10, 90, 10), (percent) => ({ ...when, percent }), '%')}
      {when?.kind === 'enemiesAtLeast' && num(when.count, range(1, 5), (count) => ({ ...when, count }), '+')}
    </span>
  );
}

/**
 * Rules mode: the unit's priority list. Each turn it uses the first rule whose
 * skill is ready and whose condition holds; with none, it basic-attacks. Every
 * edit applies at once (the engine checks it), and Reset goes back to the
 * class defaults.
 */
export function RuleEditor({ unit, setup, ctx, onChange }: { unit: OwnedUnit; setup: UnitSetup; ctx: RunContext; onChange: (rules: Rule[] | null) => void }) {
  const skills = setup.skills ?? [];
  const rules = unitRules(unit, ctx.content);
  const statuses = statusOptions(skills, ctx);
  const byId = (id: string) => skills.find((s) => s.id === id);
  const set = (i: number, rule: Rule) => onChange(rules.map((r, j) => (j === i ? rule : r)));
  const move = (i: number, by: number) => {
    const next = [...rules];
    const [r] = next.splice(i, 1);
    next.splice(i + by, 0, r!);
    onChange(next);
  };
  const setSkill = (i: number, rule: Rule, id: string) => {
    const keep = rule.target && targetsFor(byId(id)).includes(rule.target) ? { target: rule.target } : {};
    set(i, { ...without(rule, 'target'), skill: id, ...keep });
  };
  return (
    <div className="rule-editor">
      <h4>
        Rules <span className="muted small">(top first: the first that can fire, does)</span>
      </h4>
      <ol className="rule-list">
        {rules.map((rule, i) => {
          const skill = byId(rule.skill);
          // Self and area skills only need a target when a condition checks one.
          const aims = !skill || !!skill.aim || rule.when?.kind.startsWith('target') === true;
          return (
            <li key={i} className="rule-row">
              <span className="rule-main">
                <select value={rule.skill} onChange={(e) => setSkill(i, rule, e.target.value)} aria-label={`Rule ${i + 1} skill`}>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value={BASIC_ATTACK}>Attack</option>
                </select>
                {aims && (
                  <select
                    value={rule.target ?? ''}
                    onChange={(e) => set(i, e.target.value ? { ...without(rule, 'target'), target: e.target.value as TargetSelector } : without(rule, 'target'))}
                    aria-label={`Rule ${i + 1} target`}
                  >
                    <option value="">{skill?.aim === 'ally' ? 'most wounded ally' : 'nearest enemy'}</option>
                    {targetsFor(skill)
                      .filter((t) => t !== (skill?.aim === 'ally' ? 'lowestHpAlly' : 'nearest'))
                      .map((t) => (
                        <option key={t} value={t}>
                          {TARGET_LABEL[t] ?? t}
                        </option>
                      ))}
                  </select>
                )}
              </span>
              <ConditionPicker
                when={rule.when}
                statuses={statuses}
                ctx={ctx}
                onChange={(when) => set(i, when ? { ...without(rule, 'when'), when } : without(rule, 'when'))}
              />
              <span className="rule-actions">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  ▲
                </button>
                <button type="button" disabled={i === rules.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  ▼
                </button>
                <button type="button" onClick={() => onChange(rules.filter((_, j) => j !== i))} aria-label="Remove rule">
                  ✕
                </button>
              </span>
            </li>
          );
        })}
        <li className="rule-row fallback muted small">Otherwise: basic attack the nearest enemy.</li>
      </ol>
      <div className="rule-buttons">
        <button type="button" disabled={rules.length >= MAX_RULES || skills.length === 0} onClick={() => onChange([...rules, { skill: skills[0]!.id }])}>
          + Add rule
        </button>
        <button type="button" disabled={!unit.rules} onClick={() => onChange(null)}>
          Reset to class defaults
        </button>
      </div>
      <ul className="skill-list">
        {skills.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong> <span className="cadence">{s.cooldown === 1 ? 'every turn' : `${cadenceText(s.cooldown).toLowerCase()} at most`}</span>
            {setup.skillPower?.[s.id] ? <span className="muted"> (+{Math.round(setup.skillPower[s.id]! * 100)}% power)</span> : null}
            {s.empowered?.effects === s.effects ? <span className="muted"> (empowered)</span> : null}: <Rules text={s.description} />
          </li>
        ))}
      </ul>
    </div>
  );
}

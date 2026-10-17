// Markdown formatting for the run simulator report.
import type { RunContent } from '../engine/run/index.ts';
import type { Bot } from './bots.ts';
import { mergeEntities, type BotRunReport, type EntityKind, type EntityStat } from './run-report.ts';

export const OUTLIER_HIGH = 0.65;
export const OUTLIER_LOW = 0.35;
/** Entities seen in fewer fights than this aren't flagged (too noisy). */
export const MIN_FIGHTS_FOR_FLAG = 300;

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export interface EntityRow {
  kind: EntityKind;
  id: string;
  name: string;
  fights: number;
  winRate: number;
  /** Round-adjusted lift (see EntityStat). */
  lift: number;
  flag: '' | 'high' | 'low';
}

export function entityRows(entities: Map<string, EntityStat>, content: RunContent): EntityRow[] {
  const name = (kind: EntityKind, id: string): string => {
    if (kind === 'class') return content.classes[id]?.name ?? id;
    if (kind === 'advanced') return content.advancedClasses[id]?.name ?? id;
    if (kind === 'item') return content.items[id]?.name ?? id;
    if (kind === 'talent') return content.talents[id]?.name ?? id;
    const [sid, tier] = id.split('#');
    return `${content.synergies.find((s) => s.id === sid)?.name ?? sid} (tier ${tier})`;
  };
  return [...entities.entries()].map(([key, t]) => {
    const [kind, id] = key.split(/:(.*)/s) as [EntityKind, string];
    const winRate = t.score / t.fights;
    const flag = t.fights < MIN_FIGHTS_FOR_FLAG ? '' : winRate > OUTLIER_HIGH ? 'high' : winRate < OUTLIER_LOW ? 'low' : '';
    return { kind, id, name: name(kind, id), fights: t.fights, winRate, lift: t.lift, flag };
  });
}

function entityTable(rows: EntityRow[], title: string, limit?: number): string[] {
  const sorted = [...rows].sort((a, b) => b.lift - a.lift);
  const shown = limit && sorted.length > limit * 2 ? [...sorted.slice(0, limit), null, ...sorted.slice(-limit)] : sorted;
  const lines = [`##### ${title}`, '', '| | Fights | Win rate | Lift vs round avg |', '|---|---:|---:|---:|'];
  for (const r of shown) {
    if (!r) {
      lines.push(`| … ${sorted.length - limit! * 2} more … | | | |`);
      continue;
    }
    const lift = `${r.lift >= 0 ? '+' : '−'}${Math.abs(r.lift * 100).toFixed(1)}`;
    lines.push(`| ${r.name} | ${r.fights} | ${pct(r.winRate)}${r.flag ? ` ⚠️ ${r.flag}` : ''} | ${lift} |`);
  }
  return [...lines, ''];
}

export function formatRunReports(reports: BotRunReport[], bots: readonly Bot[], content: RunContent): string {
  const lines: string[] = [];
  lines.push('| Bot | Completed (10 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of reports) {
    lines.push(
      `| ${r.bot} | ${pct(r.completionRate)} | ${r.avgWins.toFixed(2)} | ${r.avgRounds.toFixed(1)} | ${pct(r.fightWinRate)} | ` +
        `${r.avgLevel.toFixed(2)} | ${r.avgUnspentGold.toFixed(1)} | ${pct(r.drawRate)} | ${r.tickCapHits} | ${r.stuckRuns} |`,
    );
  }
  lines.push('', ...bots.map((b) => `- **${b.name}**: ${b.description}`), '');

  const rounds = Math.max(...reports.map((r) => r.winRateByRound.length));
  lines.push('#### Fight win rate by round', '');
  lines.push(`| Round | ${reports.map((r) => r.bot).join(' | ')} |`, `|---:|${reports.map(() => '---:').join('|')}|`);
  for (let i = 0; i < rounds; i++) {
    lines.push(`| ${i + 1} | ${reports.map((r) => (r.winRateByRound[i] ? pct(r.winRateByRound[i]!.winRate) : '–')).join(' | ')} |`);
  }
  lines.push('');

  const rows = entityRows(mergeEntities(reports), content);
  const flagged = rows.filter((r) => r.flag);
  lines.push('#### Pick-to-win rates (all bots combined)', '');
  lines.push(
    `Share of fights won while the entity was on the player's board (draws count half). ` +
      `Flagged if above ${pct(OUTLIER_HIGH)} or below ${pct(OUTLIER_LOW)} with at least ${MIN_FIGHTS_FOR_FLAG} fights. ` +
      `For reference, the overall fight win rate is ${pct(reports.reduce((s, r) => s + r.fightWinRate, 0) / reports.length)}. ` +
      `**Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.`,
    '',
  );
  lines.push(
    flagged.length === 0
      ? '**Outliers: none.**'
      : `**Outliers (${flagged.length}):** ${flagged.map((r) => `${r.name} (${r.kind}, ${pct(r.winRate)})`).join(', ')}`,
    '',
  );
  const of = (k: EntityKind) => rows.filter((r) => r.kind === k);
  lines.push(...entityTable(of('class'), 'Classes'));
  lines.push(...entityTable(of('advanced'), 'Advanced classes'));
  lines.push(...entityTable(of('synergy'), 'Synergies'));
  lines.push(...entityTable(of('item'), 'Items'));
  lines.push(...entityTable(of('talent'), 'Talents (top and bottom 10)', 10));
  return lines.join('\n');
}

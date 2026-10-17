// Replays dev play logs (written by the UI under `npm run dev`) through the
// engine and summarizes each run round by round, with notes on things a
// player may have missed.
import type { CombatEvent, Winner } from '../engine/index.ts';
import {
  applyShopAction,
  boardUnits,
  createRun,
  fight,
  getSlot,
  resolveBoard,
  type Board,
  type FightResult,
  type OwnedUnit,
  type PlayLogEntry,
  type RunContext,
  type RunError,
  type RunState,
  type ShopAction,
} from '../engine/run/index.ts';

export interface RoundReplay {
  round: number;
  /** State the fight was played from (after shopping). */
  shopped: RunState;
  result: Extract<FightResult, { ok: true }>;
  /** Successful actions this round, described. */
  actions: string[];
  failed: RunError[];
  rerolls: number;
  /** The winner recorded by the UI, if it disagrees with the replay. */
  mismatch?: Winner;
}

export interface RunReplay {
  run: string;
  seed: string;
  startedAt: string;
  rounds: RoundReplay[];
  final: RunState;
}

type Fought = Extract<FightResult, { ok: true }>;

const nameOf = (ctx: RunContext, id: string) =>
  ctx.content.advancedClasses[id]?.name ?? ctx.content.classes[id]?.name ?? id;

function describe(state: RunState, action: ShopAction, ctx: RunContext): string {
  const unitAt = (slot: { row: 'front' | 'back'; col: number }) => getSlot(state.board, slot)?.name ?? '?';
  switch (action.type) {
    case 'buy': {
      const o = state.shop[action.offer];
      if (!o) return 'bought ?';
      const to = action.to ? ` → ${unitAt(action.to)}` : '';
      if (o.kind === 'unit') return `recruited ${nameOf(ctx, o.classId)} (${o.cost}g)`;
      if (o.kind === 'item') return `bought ${ctx.content.items[o.itemId]?.name ?? o.itemId}${to} (${o.cost}g)`;
      return `bought ${nameOf(ctx, o.classId)} training${to} (${o.cost}g)`;
    }
    case 'sell':
      return `sold ${unitAt(action.from)}`;
    case 'sellItem': {
      const item = getSlot(state.board, action.from)?.items[action.item];
      return `sold ${item ? (ctx.content.items[item]?.name ?? item) : '?'} from ${unitAt(action.from)}`;
    }
    case 'move':
      return `moved ${unitAt(action.from)} to ${action.to.row} ${action.to.col + 1}`;
    case 'moveItem':
      return `moved an item from ${unitAt(action.from)} to ${unitAt(action.to)}`;
    case 'reroll':
      return 'rerolled';
    case 'choose': {
      const p = state.pending[0];
      const pick = p?.options[action.option];
      const unit = boardUnits(state.board).find((u) => u.uid === p?.uid)?.name ?? '?';
      const label = p?.kind === 'advance' ? nameOf(ctx, pick ?? '') : (ctx.content.talents[pick ?? '']?.name ?? pick);
      return `${unit} took ${label}`;
    }
  }
}

/** Group log entries by run and replay each one through the engine. */
export function replayLog(entries: PlayLogEntry[], ctx: RunContext): RunReplay[] {
  const runs = new Map<string, RunReplay & { state: RunState; pending: Omit<RoundReplay, 'shopped' | 'result' | 'round'> }>();
  for (const e of entries) {
    if (e.type === 'start') {
      // React StrictMode can log a start twice; keep the first.
      if (runs.has(e.run)) continue;
      const state = createRun(e.seed, ctx);
      runs.set(e.run, { run: e.run, seed: e.seed, startedAt: e.at, rounds: [], final: state, state, pending: fresh() });
      continue;
    }
    const r = runs.get(e.run);
    if (!r) continue;
    if (e.type === 'action') {
      if (e.error) {
        r.pending.failed.push(e.error);
        continue;
      }
      const label = describe(r.state, e.action, ctx);
      const next = applyShopAction(r.state, e.action, ctx);
      if (!next.ok) {
        r.pending.failed.push(next.error);
        continue;
      }
      if (e.action.type === 'reroll') r.pending.rerolls++;
      else r.pending.actions.push(label);
      r.state = next.state;
    } else {
      const result = fight(r.state, ctx);
      if (!result.ok) continue;
      r.rounds.push({
        round: r.state.round,
        shopped: r.state,
        result,
        ...r.pending,
        ...(result.combat.winner !== e.winner ? { mismatch: e.winner } : {}),
      });
      r.state = result.state;
      r.final = result.state;
      r.pending = fresh();
    }
  }
  return [...runs.values()].map(({ state: _s, pending: _p, ...rest }) => rest);
}

function fresh() {
  return { actions: [] as string[], failed: [] as RunError[], rerolls: 0 };
}

const RESULT = { player: 'WIN', enemy: 'LOSS', draw: 'DRAW' } as const;

function unitLine(u: OwnedUnit, ctx: RunContext): string {
  const talents = u.talents.map((t) => ctx.content.talents[t]?.name ?? t);
  const items = u.items.map((i) => ctx.content.items[i]?.name ?? i);
  return [
    `${u.name} Lv${u.level} ${nameOf(ctx, u.advancedClassId ?? u.classId)}`,
    talents.length ? `[${talents.join(', ')}]` : '',
    items.length ? `{${items.join(', ')}}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Things worth pointing out about a round's setup. */
export function roundNotes(r: RoundReplay, ctx: RunContext): string[] {
  const notes: string[] = [];
  const { shopped } = r;
  const party = resolveBoard(shopped.board, ctx.content);
  const cap = ctx.config.interestPer * ctx.config.maxInterest;
  if (shopped.gold > cap) notes.push(`${shopped.gold}g unspent: interest caps at ${cap}g, so ${shopped.gold - cap}g earned nothing.`);
  party.back.forEach((u) => {
    if (u && u.range === 'melee' && !u.reach && party.front.some(Boolean)) {
      notes.push(`${u.name} is melee in the back row without reach (deals 50% while the front row stands).`);
    }
  });
  const units = boardUnits(shopped.board);
  const empty = 5 - units.length;
  if (empty > 0 && shopped.gold >= ctx.config.unitCost) notes.push(`${empty} empty slot(s) with ${shopped.gold}g in hand.`);
  if (shopped.board.front.every((u) => !u)) notes.push('No front row: everyone is exposed.');
  return notes;
}

function deathLine(events: CombatEvent[]): string {
  const start = events[0];
  if (start?.type !== 'combatStart') return '';
  const names = new Map(start.units.map((u) => [u.id, `${u.side === 'player' ? '' : 'enemy '}${u.name}${u.pos.row === 'back' ? ' (back)' : ''}`]));
  return events
    .filter((e) => e.type === 'death')
    .map((e) => `${names.get(e.target)} @${e.tick}`)
    .join(', ');
}

function boardLines(board: Board, fought: Fought, side: 'player' | 'enemy', ctx: RunContext): string[] {
  const prefix = side === 'player' ? 'p' : 'e';
  const lines: string[] = [];
  (['front', 'back'] as const).forEach((row) =>
    board[row].forEach((u, col) => {
      if (!u) return;
      const id = `${prefix}${row === 'front' ? col : 3 + col}`;
      const s = fought.combat.summary.find((x) => x.id === id);
      const stats = s ? ` — dealt ${s.damageDealt}, took ${s.damageTaken}${s.healingDone ? `, healed ${s.healingDone}` : ''}${s.shieldingDone ? `, shielded ${s.shieldingDone}` : ''}${s.survived ? '' : ', died'}` : '';
      lines.push(`    ${row} ${col + 1}: ${unitLine(u, ctx)}${stats}`);
    }),
  );
  return lines;
}

function countLabels(labels: string[]): string {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts].map(([l, n]) => (n > 1 ? `${l} ×${n}` : l)).join(', ');
}

export function formatReplay(replays: RunReplay[], ctx: RunContext): string {
  const out: string[] = [];
  for (const r of replays) {
    const f = r.final;
    out.push(`## Run ${r.run} (seed "${r.seed}", started ${r.startedAt})`);
    out.push(`Result: ${f.phase === 'shop' ? 'in progress' : f.phase} — ${f.wins} wins, ${f.lives} lives, ${r.rounds.length} rounds`);
    for (const round of r.rounds) {
      const { result: res, shopped } = round;
      out.push('', `### Round ${round.round}: ${RESULT[res.combat.winner]} in ${res.combat.ticks} ticks`);
      if (round.mismatch) out.push(`  ⚠️ Replay disagrees with the logged result (${round.mismatch}).`);
      const shop = [...round.actions, ...(round.rerolls ? [`rerolled ×${round.rerolls}`] : [])];
      out.push(`  Shop: ${shop.length ? shop.join('; ') : 'nothing'} — ${shopped.gold}g left`);
      if (round.failed.length) out.push(`  Blocked actions: ${countLabels(round.failed)}`);
      out.push('  Party:', ...boardLines(shopped.board, res, 'player', ctx));
      out.push('  Enemy:', ...boardLines(res.enemyBuilds, res, 'enemy', ctx));
      out.push(`  Deaths: ${deathLine(res.combat.events) || 'none'}`);
      for (const n of roundNotes(round, ctx)) out.push(`  Note: ${n}`);
    }
    out.push('');
  }
  return out.join('\n');
}

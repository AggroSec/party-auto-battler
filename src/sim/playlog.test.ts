import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../data/content.ts';
import { applyShopAction, createRun, fight, type PlayLogEntry } from '../engine/run/index.ts';
import { formatReplay, replayLog } from './playlog.ts';

const ctx = buildRunContext();
const at = '2026-10-17T00:00:00.000Z';

function playedLog(): PlayLogEntry[] {
  let s = createRun('log-test', ctx);
  const log: PlayLogEntry[] = [{ type: 'start', run: 'r1', at, seed: 'log-test' }, { type: 'start', run: 'r1', at, seed: 'log-test' }];
  for (const action of [{ type: 'buy', offer: 0 }, { type: 'buy', offer: 1 }, { type: 'reroll' }] as const) {
    const r = applyShopAction(s, action, ctx);
    if (r.ok) s = r.state;
    log.push(r.ok ? { type: 'action', run: 'r1', at, action } : { type: 'action', run: 'r1', at, action, error: r.error });
  }
  const f = fight(s, ctx);
  if (!f.ok) throw new Error('fight failed');
  log.push({ type: 'fight', run: 'r1', at, round: 1, winner: f.combat.winner });
  return log;
}

describe('play log replay', () => {
  it('replays a logged run exactly and summarizes it', () => {
    const [run, ...rest] = replayLog(playedLog(), ctx);
    expect(rest).toHaveLength(0);
    expect(run?.rounds).toHaveLength(1);
    const round = run!.rounds[0]!;
    expect(round.mismatch).toBeUndefined();
    expect(round.rerolls).toBe(1);
    expect(round.actions[0]).toMatch(/^recruited /);
    expect(formatReplay([run!], ctx)).toContain('### Round 1:');
  });

  it('flags a logged result that the replay does not reproduce', () => {
    const log = playedLog().map((e) =>
      e.type === 'fight' ? { ...e, winner: e.winner === 'player' ? ('enemy' as const) : ('player' as const) } : e,
    );
    expect(replayLog(log, ctx)[0]?.rounds[0]?.mismatch).toBeDefined();
  });

  it('continues a resumed run from its saved state', () => {
    const s = createRun('resumed', ctx);
    const [run] = replayLog([{ type: 'resume', run: 'r2', at, state: { ...s, gold: 99 } }], ctx);
    expect(run?.final.gold).toBe(99);
  });

  it('ignores entries for runs it never saw start', () => {
    expect(replayLog([{ type: 'action', run: 'x', at, action: { type: 'reroll' } }], ctx)).toEqual([]);
  });
});

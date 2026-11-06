import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import { createRun, newUnit } from '../../engine/run/index.ts';
import { currentTip, markSeen, resetTips, setTipsEnabled } from './tips.ts';

const ctx = buildRunContext();

describe('one-time tips', () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the first unseen tip that applies, once', () => {
    const run = createRun('t', ctx);
    expect(currentTip(run, ctx)?.id).toBe('recruit');
    markSeen('recruit');
    expect(currentTip(run, ctx)).toBeNull();
    resetTips();
    expect(currentTip(run, ctx)?.id).toBe('recruit');
  });

  it('can be switched off, and stays out of daily runs', () => {
    const run = createRun('t', ctx);
    setTipsEnabled(false);
    expect(currentTip(run, ctx)).toBeNull();
    setTipsEnabled(true);
    expect(currentTip({ ...run, setup: { ...run.setup, daily: '2026-11-05' } }, ctx)).toBeNull();
  });

  it('opens rules mode with how the rules work', () => {
    const run = createRun('t', ctx, { ...createRun('t', ctx).setup, mode: 'rules' });
    run.board.front[0] = newUnit(1, 'r-warrior', 'W');
    expect(currentTip(run, ctx)?.id).toBe('rules-mode');
  });
});

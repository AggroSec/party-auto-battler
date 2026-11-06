import { useState } from 'react';
import type { RunContext, RunState } from '../../engine/run/index.ts';
import { currentTip, markSeen, setTipsEnabled } from './tips.ts';

/** The current one-time tip, if any: dismiss it (it never shows again) or turn tips off. */
export function TipBanner({ run, ctx }: { run: RunState; ctx: RunContext }) {
  // Bumped on dismiss so the next tip is looked up.
  const [, setVersion] = useState(0);
  const tip = currentTip(run, ctx);
  if (!tip) return null;
  const close = (all: boolean) => {
    if (all) setTipsEnabled(false);
    else markSeen(tip.id);
    setVersion((v) => v + 1);
  };
  return (
    <aside className="tip-banner" role="note">
      <span aria-hidden>💡</span>
      <span className="tip-text">{tip.text}</span>
      <span className="tip-actions">
        <button type="button" onClick={() => close(false)}>
          Got it
        </button>
        <button type="button" className="link" onClick={() => close(true)}>
          No more tips
        </button>
      </span>
    </aside>
  );
}

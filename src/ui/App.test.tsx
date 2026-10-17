import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';
import { CombatLab } from './CombatLab.tsx';
import { RunView } from './RunView.tsx';

describe('debug UI', () => {
  it('opens on the run view', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Combat lab');
    expect(html).toContain('Shop');
  });

  it('renders a run with shop offers and an empty party', () => {
    const html = renderToString(<RunView />);
    expect(html).toContain('Round <!-- -->1');
    expect(html.match(/Buy \(/g)).toHaveLength(6);
    expect(html).toContain('Synergies');
    expect(html.match(/>empty</g)).toHaveLength(5);
  });

  it('renders the combat lab with a resolved fight', () => {
    const html = renderToString(<CombatLab />);
    expect(html).toContain('Event log');
    expect(html).toMatch(/(Player wins|Enemy wins|Draw)(<!-- -->)?\s*after/);
  });
});

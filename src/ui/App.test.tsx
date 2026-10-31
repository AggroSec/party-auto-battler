import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';
import { CombatLab } from './CombatLab.tsx';

describe('app shell', () => {
  it('opens on the title screen', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Classbound');
    expect(html).toContain('New run');
    expect(html).toContain('Combat lab');
  });

  it('renders the combat lab with a resolved fight', () => {
    const html = renderToString(<CombatLab />);
    expect(html).toContain('Event log');
    expect(html).toMatch(/(Player wins|Enemy wins|Draw)(<!-- -->)?\s*after/);
  });
});

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  it('renders the debug view with a resolved fight', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Event log');
    expect(html).toMatch(/(Player wins|Enemy wins|Draw)(<!-- -->)?\s*after/);
  });
});

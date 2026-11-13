// Story mode screens (Milestone 14) render from a real story run.
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import { storySetup } from '../../data/stories/index.ts';
import { applyShopAction, createRun, runContext, type RunState } from '../../engine/run/index.ts';
import { reachable } from '../../engine/story/map.ts';
import { Hud } from './Hud.tsx';
import { StoryBar } from './StoryBar.tsx';
import { StoryMap } from './StoryMap.tsx';
import { StoryPrompt, StoryScene } from './StoryPanels.tsx';

const base = buildRunContext();
const setup = storySetup('hollowing', 0, { items: [...base.content.itemPool] }, base.content.synergies.map((s) => s.id));
const ctx = runContext(setup, base);
const start = () => createRun('ui', base, setup);
const act = (s: RunState, a: Parameters<typeof applyShopAction>[1]) => {
  const r = applyShopAction(s, a, base);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const noop = () => {};

describe('story screens', () => {
  it('a story setup starts a story run', () => {
    expect(start().story?.storyId).toBe('hollowing');
  });

  it('shows the first mission’s intro and who joins', () => {
    const html = renderToString(<StoryScene run={start()} onDone={noop} />);
    expect(html).toContain('Silent Totems');
    expect(html).toContain('Korrin');
    expect(html).toContain('Set out');
  });

  it('the map marks where the party can go', () => {
    const s = act(start(), { type: 'scene' });
    const html = renderToString(<StoryMap run={s} onTravel={noop} onClose={noop} />);
    expect(html.match(/story-node[^"]* open/g)).toHaveLength(reachable(s.story!.map, null).length);
    expect(html).toContain('Boss');
  });

  it('the bar offers the map, then the fight once at a fight', () => {
    let s = act(start(), { type: 'scene' });
    expect(renderToString(<StoryBar run={s} pending={false} onFight={noop} onMap={noop} />)).toContain('Set out');
    s = act(s, { type: 'travel', node: reachable(s.story!.map, null)[0]!.id });
    expect(renderToString(<StoryBar run={s} pending={false} onFight={noop} onMap={noop} />)).toContain('Fight');
  });

  it('an event shows its options, then what was picked', () => {
    let s = act(start(), { type: 'scene' });
    s.story!.prompt = { id: 'cracked-totem' };
    expect(renderToString(<StoryPrompt run={s} ctx={ctx} onChoose={noop} />)).toContain('Let it rest');
    s = act(s, { type: 'storyChoice', option: 1 });
    const html = renderToString(<StoryPrompt run={s} ctx={ctx} onChoose={noop} />);
    expect(html).toContain('Ama sings it to sleep');
    expect(html).not.toContain('<button');
  });

  it('the HUD shows the mission and the story’s lives', () => {
    const html = renderToString(<Hud run={start()} ctx={ctx} />);
    expect(html).toContain('Silent Totems');
    expect(html.match(/class="heart"/g)).toHaveLength(3);
    expect(html).not.toContain('hud-wins');
  });
});

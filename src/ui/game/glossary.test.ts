import { describe, expect, it } from 'vitest';
import { GLOSSARY, segmentRules } from './glossary.ts';

const terms = (text: string) => segmentRules(text).flatMap((s) => (typeof s === 'string' ? [] : [`${s.term.id}:${s.text}`]));

describe('glossary', () => {
  it('finds terms in rules text, keeping the original wording', () => {
    expect(terms('Every 3rd turn: shield all allies for 2 + 60% DEF and taunt for 1 turn.')).toEqual(['shield:shield', 'taunt:taunt']);
    expect(terms('Deal 200% ATK to the weakest enemy and 50% of that to its row neighbours. Splashes.')).toEqual(['weakest:weakest', 'splash:Splashes']);
    expect(terms('When bloodied, heal the most wounded ally. Reach.')).toEqual(['bloodied:bloodied', 'wounded:most wounded', 'reach:Reach']);
  });

  it('rebuilds the exact text from its segments', () => {
    const text = 'Fight at full strength from the back row. Summon a Turret; +30% ability power.';
    expect(segmentRules(text).map((s) => (typeof s === 'string' ? s : s.text)).join('')).toBe(text);
  });

  it('links M7 terms', () => {
    expect(terms('The first time you would fall, rise again at 40% HP. Deal 50% more damage to enemies below half HP.')).toEqual([
      'revive:rise again',
      'execute:below half HP',
    ]);
    expect(terms('3 Light units: heal. 2 Dark units too.')).toEqual(['light-dark:Light units', 'light-dark:Dark units']);
  });

  it('links post-M7 status terms', () => {
    expect(terms('Carve 2 Runes. Detonations give 3 Corruption and 1 Dread; deal 10% of your missing HP.')).toEqual([
      'rune:Runes',
      'rune:Detonations',
      'dot:Corruption',
      'dread:Dread',
      'missing-hp:missing HP',
    ]);
    expect(terms('The Runeblade recruits.')).toEqual([]);
    expect(terms('Basic attacks give 1 Blight.')).toEqual(['blight:Blight']);
  });

  it('does not match inside other words', () => {
    expect(terms('Each preacher teaches the breach.')).toEqual([]);
  });

  it('has unique ids', () => {
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
  });
});

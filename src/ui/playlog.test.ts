import { describe, expect, it } from 'vitest';
import type { PlayLogEntry } from '../engine/run/index.ts';
import { trimLog } from './playlog.ts';

const start = (run: string): PlayLogEntry => ({ type: 'start', run, at: '', seed: run });
const fight = (run: string): PlayLogEntry => ({ type: 'fight', run, at: '', round: 1, winner: 'player' });

describe('trimLog', () => {
  it('keeps only the newest runs, dropping whole runs', () => {
    const log = ['a', 'b', 'c'].flatMap((r) => [start(r), fight(r)]);
    expect(trimLog(log, 2).map((e) => e.run)).toEqual(['b', 'b', 'c', 'c']);
  });

  it('drops old runs to fit the size cap but never the current run', () => {
    const log = [start('a'), fight('a'), start('b'), fight('b')];
    expect(trimLog(log, 5, 10).map((e) => e.run)).toEqual(['b', 'b']);
  });

  it('leaves a short log alone', () => {
    const log = [start('a'), fight('a')];
    expect(trimLog(log)).toEqual(log);
  });
});

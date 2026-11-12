import { describe, expect, it } from 'vitest';
import { buildRunContext } from '../../data/content.ts';
import { createRun, fight, newUnit } from '../../engine/run/index.ts';
import { addFightStats, isBestRun, isBetterRun, migrateSavedRun, savedRunValidator } from './runRecords.ts';

const ctx = buildRunContext();

function runWithParty() {
  const run = createRun('records', ctx);
  run.board.front[0] = newUnit(1, 'warrior', 'Wren');
  run.board.back[1] = newUnit(2, 'mage', 'Mira');
  return run;
}

describe('saved run migration', () => {
  it('moves rules-mode runs to the renamed tertiary classes, and leaves classic runs alone', () => {
    const run = runWithParty();
    run.board.front[0] = { ...newUnit(1, 'warrior', 'Wren'), advancedClassId: 'r-assassin', tertiaryClassId: 'nightblade' };
    expect(migrateSavedRun({ runId: 'r', run, stats: {} }).run.board.front[0]?.tertiaryClassId).toBe('nightblade');
    const rules = { ...run, setup: { ...run.setup, mode: 'rules' as const } };
    expect(migrateSavedRun({ runId: 'r', run: rules, stats: {} }).run.board.front[0]?.tertiaryClassId).toBe('r-nightblade');
  });
});

describe('saved run validation', () => {
  const valid = savedRunValidator(ctx);

  it('accepts a saved shop-phase run', () => {
    expect(valid({ runId: 'r', run: runWithParty(), stats: {} })).toBe(true);
  });

  it('rejects junk, finished runs and boards with classes that no longer exist', () => {
    expect(valid(null)).toBe(false);
    expect(valid({ runId: 'r', run: { seed: 1 }, stats: {} })).toBe(false);
    expect(valid({ runId: 'r', run: { ...runWithParty(), phase: 'complete' }, stats: {} })).toBe(false);
    const run = runWithParty();
    run.board.front[0]!.classId = 'removed-class';
    expect(valid({ runId: 'r', run, stats: {} })).toBe(false);
  });

  it('checks advanced and tertiary class choices too', () => {
    const run = runWithParty();
    Object.assign(run.board.front[0]!, { advancedClassId: 'knight', tertiaryClassId: 'paladin' });
    expect(valid({ runId: 'r', run, stats: {} })).toBe(true);
    run.board.front[0]!.tertiaryClassId = 'removed';
    expect(valid({ runId: 'r', run, stats: {} })).toBe(false);
    delete (run.board.front[0] as Partial<typeof run.board.front[0]>)!.tertiaryClassId;
    expect(valid({ runId: 'r', run, stats: {} })).toBe(false);
  });
});

describe('run stats', () => {
  it('accumulates each unit by uid across fights, mapping board slots to combat ids', () => {
    const run = runWithParty();
    const r = fight(run, ctx);
    if (!r.ok) throw new Error(r.error);
    const once = addFightStats({}, run.board, r.combat);
    const twice = addFightStats(once, run.board, r.combat);
    const mira = r.combat.summary.find((s) => s.id === 'p4')!;
    expect(once[2]).toMatchObject({ name: 'Mira', fights: 1, dealt: mira.damageDealt, taken: mira.damageTaken });
    expect(twice[2]?.dealt).toBe(mira.damageDealt * 2);
    expect(twice[1]?.fights).toBe(2);
    expect(once[2]?.fights).toBe(1);
  });
});

describe('best run', () => {
  it('prefers more wins, then fewer rounds', () => {
    const b = { wins: 6, rounds: 10, completed: false };
    expect(isBetterRun(b, null)).toBe(true);
    expect(isBetterRun({ wins: 7, rounds: 14, completed: false }, b)).toBe(true);
    expect(isBetterRun({ wins: 6, rounds: 9, completed: false }, b)).toBe(true);
    expect(isBetterRun({ wins: 6, rounds: 10, completed: false }, b)).toBe(false);
    expect(isBestRun(b)).toBe(true);
    expect(isBestRun({ wins: '6' })).toBe(false);
  });
});

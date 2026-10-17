import { describe, expect, it } from 'vitest';
import { CLASS_IDS } from '../data/classes.ts';
import { formatReport, runDuels, runTeamFights } from './combat-report.ts';

describe('combat report', () => {
  it('is deterministic for a seed', () => {
    expect(runTeamFights(50, 's')).toEqual(runTeamFights(50, 's'));
  });

  it('produces win rates in [0, 1] for every class', () => {
    const teams = runTeamFights(100, 't');
    const duels = runDuels(4, 'd');
    for (const c of teams.byClass) expect(c.winRate).toBeGreaterThanOrEqual(0);
    for (const c of teams.byClass) expect(c.winRate).toBeLessThanOrEqual(1);
    for (const id of CLASS_IDS) expect(duels.overall[id]).toBeGreaterThanOrEqual(0);
    expect(formatReport(duels, teams, { duelsPerPair: 4 })).toContain('| Warrior |');
  });

  it('scores mirror duels near 50%', () => {
    const duels = runDuels(200, 'mirror');
    for (const id of CLASS_IDS) {
      expect(duels.winRate[id][id]).toBeGreaterThan(0.35);
      expect(duels.winRate[id][id]).toBeLessThan(0.65);
    }
  });
});

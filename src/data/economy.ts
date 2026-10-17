import type { RunConfig } from '../engine/run/types.ts';

/** Run structure and economy. Tuned with `npm run sim`; see docs/BALANCE.md. */
export const RUN_CONFIG: RunConfig = {
  startingGold: 10,
  startingLives: 5,
  winsToComplete: 10,
  baseIncome: 5,
  interestPer: 5,
  maxInterest: 2,
  streakBonuses: [
    { streak: 2, gold: 1 },
    { streak: 4, gold: 2 },
  ],
  unitCost: 3,
  sellRefund: 1,
  rerollCost: 1,
  shopSize: 4,
};

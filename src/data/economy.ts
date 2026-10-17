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
  shop: {
    unitSlots: 4,
    // Items and training (issue #5: training appears randomly, so rerolling chases it).
    extraSlots: 2,
    trainingChance: 0.35,
  },
  progression: {
    // Levels 1-5. A unit bought in round 1 reaches level 3 around round 4.
    xpForLevel: [0, 2, 5, 9, 14],
    xpPerWin: 2,
    xpPerLoss: 1,
    xpPerDraw: 1,
    advanceLevel: 3,
    talentChoices: 3,
    trainingXp: 2,
    trainingCost: 3,
    maxItemsPerUnit: 2,
    itemSellRefund: 1,
  },
};

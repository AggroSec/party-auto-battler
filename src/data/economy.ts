import type { RunConfig } from '../engine/run/types.ts';

/** Run structure and economy. Tuned with `npm run sim`; see docs/BALANCE.md. */
export const RUN_CONFIG: RunConfig = {
  startingGold: 10,
  startingLives: 5,
  // Brandon (M6): longer runs so levels 6–10 get played out.
  winsToComplete: 15,
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
  // Brandon (post-M7): lock an offer for 1 gold; perks make it cheaper or allow more.
  lockCost: 1,
  maxLocks: 1,
  shop: {
    unitSlots: 4,
    // Items and training (issue #5: training appears randomly, so rerolling chases it).
    extraSlots: 2,
    trainingChance: 0.35,
    // Brandon (M5): once the party is full, offer mostly items and training.
    fullPartyUnitSlots: 2,
  },
  progression: {
    // Levels 1-10. A unit bought in round 1 reaches level 3 around round 4 and
    // level 7 around round 12; training gets it there sooner.
    xpForLevel: [0, 2, 5, 9, 14, 19, 25, 31, 38, 46],
    xpPerWin: 2,
    xpPerLoss: 1,
    xpPerDraw: 1,
    advanceLevel: 3,
    ascendLevel: 7,
    // Brandon (M5): players spend stat points freely, with a bump at levels 3 and 5
    // (M6: and at the tertiary class at 7, and at the cap).
    statPointsByLevel: [0, 3, 5, 3, 5, 3, 5, 3, 3, 5],
    statPointValue: { hp: 3, atk: 1, def: 1, spd: 1 },
    talentChoices: 3,
    trainingXp: 2,
    trainingCost: 3,
    maxItemsPerUnit: 2,
    itemSellRefund: 1,
  },
};

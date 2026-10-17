import type { CombatResult, Winner } from '../events.ts';
import type { BoardPos, Party, Stats } from '../types.ts';
import type {
  AdvancedClassDef,
  ClassTemplate,
  EnemyProgression,
  ItemDef,
  ProgressionConfig,
  ShopLayout,
  SynergyDef,
  TalentDef,
} from './content-types.ts';

export type * from './content-types.ts';

/** Economy and run-structure numbers. Lives in data so the simulator can tune it. */
export interface RunConfig {
  startingGold: number;
  startingLives: number;
  /** Wins needed to complete a run. The run continues until this or 0 lives. */
  winsToComplete: number;
  /** Gold granted at the start of every round after the first. */
  baseIncome: number;
  /** +1 gold per this much unspent gold at the end of a shop phase... */
  interestPer: number;
  /** ...up to this many gold. */
  maxInterest: number;
  /** Bonus gold for win or loss streaks; the highest matching tier applies. */
  streakBonuses: readonly { streak: number; gold: number }[];
  unitCost: number;
  sellRefund: number;
  rerollCost: number;
  shop: ShopLayout;
  progression: ProgressionConfig;
}

export interface EnemyArchetype {
  id: string;
  /** Display name, e.g. "Bandit Brute". */
  name: string;
  /** Class template the archetype fights as. */
  classId: string;
  /** First round this archetype can appear. */
  minRound: number;
  /** Multipliers on the final stats (default 1). */
  statMultiplier?: Partial<Stats>;
}

export interface EnemyScaling {
  /** Enemy party size per round (index 0 = round 1). Later rounds reuse the last entry. */
  unitsByRound: readonly number[];
  /** Round-1 multiplier on enemy HP and ATK (below 1 = weaker than a player's unit). */
  baseMultiplier: number;
  /** HP and ATK grow by this fraction per round after the first. */
  hpGrowthPerRound: number;
  atkGrowthPerRound: number;
}

/** Content the run layer needs. Built from src/data; synthetic in tests. */
export interface RunContent {
  classes: Readonly<Record<string, ClassTemplate>>;
  advancedClasses: Readonly<Record<string, AdvancedClassDef>>;
  talents: Readonly<Record<string, TalentDef>>;
  items: Readonly<Record<string, ItemDef>>;
  synergies: readonly SynergyDef[];
  /** Class ids the shop can offer (locked classes excluded). */
  shopPool: readonly string[];
  /** Item ids the shop can offer. */
  itemPool: readonly string[];
  enemies: readonly EnemyArchetype[];
  enemyScaling: EnemyScaling;
  enemyProgression: EnemyProgression;
  unitNames: readonly string[];
}

export interface RunContext {
  config: RunConfig;
  content: RunContent;
}

/** A unit's build: everything needed to resolve it into a combat UnitSetup. */
export interface OwnedUnit {
  uid: number;
  /** Base class id. */
  classId: string;
  name: string;
  level: number;
  /** Cumulative XP. */
  xp: number;
  advancedClassId: string | null;
  talents: string[];
  items: string[];
  /** Stats gained from level-up rolls. */
  growth: Stats;
}

export interface Board {
  front: (OwnedUnit | null)[];
  back: (OwnedUnit | null)[];
}

export type SlotRef = BoardPos;

export type ShopOffer =
  | { kind: 'unit'; classId: string; name: string; cost: number }
  | { kind: 'item'; itemId: string; cost: number }
  /** +XP for one unit of `classId` (base class). */
  | { kind: 'training'; classId: string; xp: number; cost: number };

/** A level-up decision the player must make before the next fight. */
export interface PendingChoice {
  uid: number;
  /** The level that triggered the choice. */
  level: number;
  kind: 'talent' | 'advance';
  /** Talent ids or advanced class ids. */
  options: string[];
}

export interface IncomeBreakdown {
  base: number;
  interest: number;
  streak: number;
  total: number;
}

export interface RoundRecord {
  round: number;
  result: Winner;
  /** Enemy class ids (advanced where applicable), in board order. */
  enemy: string[];
  income: IncomeBreakdown | null;
}

export type RunPhase = 'shop' | 'complete' | 'defeated';

/**
 * The whole run as plain JSON-safe data, so it can be saved to localStorage
 * and resumed. Every transition is a pure function of (state, action, context).
 */
export interface RunState {
  seed: string;
  /** Shop/level-up RNG position; enemies and combats derive their own RNG from seed + round. */
  rngState: number;
  phase: RunPhase;
  /** The round currently being shopped for (1-based). */
  round: number;
  lives: number;
  wins: number;
  losses: number;
  draws: number;
  gold: number;
  winStreak: number;
  lossStreak: number;
  board: Board;
  /** null = already bought this round. */
  shop: (ShopOffer | null)[];
  /** Level-up choices to resolve (in order) before the next fight. */
  pending: PendingChoice[];
  nextUid: number;
  history: RoundRecord[];
}

export type ShopAction =
  /** `to`: where a unit goes (optional, auto-placed), or which unit gets an item/training (required). */
  | { type: 'buy'; offer: number; to?: SlotRef }
  | { type: 'sell'; from: SlotRef }
  | { type: 'move'; from: SlotRef; to: SlotRef }
  | { type: 'moveItem'; from: SlotRef; item: number; to: SlotRef }
  /** Remove an item from a unit for `progression.itemSellRefund` gold, freeing the slot. */
  | { type: 'sellItem'; from: SlotRef; item: number }
  | { type: 'reroll' }
  /** Resolve the first pending choice by option index. */
  | { type: 'choose'; option: number };

export type RunError =
  | 'notShopPhase'
  | 'notEnoughGold'
  | 'noSuchOffer'
  | 'invalidSlot'
  | 'slotOccupied'
  | 'emptySlot'
  | 'boardFull'
  | 'emptyBoard'
  | 'needsTarget'
  | 'itemSlotsFull'
  | 'wrongClass'
  | 'noSuchItem'
  | 'pendingChoice'
  | 'noPendingChoice'
  | 'invalidChoice';

export type ActionResult = { ok: true; state: RunState } | { ok: false; error: RunError };

export type FightResult =
  | {
      ok: true;
      /** State after the fight: next round's shop, or a finished run. */
      state: RunState;
      combat: CombatResult;
      playerParty: Party;
      enemyParty: Party;
      /** Enemy builds, for display and simulator stats. */
      enemyBuilds: Board;
      income: IncomeBreakdown | null;
    }
  | { ok: false; error: RunError };

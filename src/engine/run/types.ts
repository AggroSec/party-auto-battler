import type { CombatResult, Winner } from '../events.ts';
import type { BoardPos, Party, StatKey, Stats } from '../types.ts';
import type {
  AdvancedClassDef,
  BossDef,
  ClassTemplate,
  EliteRules,
  EnemyProgression,
  ItemDef,
  LadderTier,
  PerkDef,
  ProgressionConfig,
  RunModifier,
  ShopLayout,
  SynergyDef,
  TalentDef,
  TertiaryClassDef,
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
  /** Gold to lock a shop offer so it survives rerolls and the next round. */
  lockCost: number;
  /** How many offers can be locked at once. */
  maxLocks: number;
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
  /** Growth stops after this round (later rounds stay at its multiplier). Omit for no cap. */
  growthUntilRound?: number;
}

/** Content the run layer needs. Built from src/data; synthetic in tests. */
export interface RunContent {
  classes: Readonly<Record<string, ClassTemplate>>;
  advancedClasses: Readonly<Record<string, AdvancedClassDef>>;
  tertiaryClasses: Readonly<Record<string, TertiaryClassDef>>;
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
  /** Difficulty ladder: index 0 = tier 1 (M7). */
  ladder: readonly LadderTier[];
  perks: Readonly<Record<string, PerkDef>>;
  bosses: readonly BossDef[];
  elite: EliteRules;
}

export interface RunContext {
  config: RunConfig;
  content: RunContent;
  /** Set on a run's effective context (see runContext): its merged tier and perk modifiers. */
  run?: RunModifier;
  /** Set on a run's effective context: the context it was derived from. */
  base?: RunContext;
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
  tertiaryClassId: string | null;
  talents: string[];
  items: string[];
  /** Stats bought with stat points (in stat units, e.g. +6 HP). */
  growth: Stats;
  /** Stat points not yet spent. Any left at fight time are spent on the recommended spread. */
  statPoints: number;
  /** Enemy-only (M7): an Elite, a boss, and whether the boss casts its second ability. */
  elite?: boolean;
  bossId?: string;
  empowered?: boolean;
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
  /** 'advance' picks an advanced class (level 3), 'ascend' a tertiary class (level 7). */
  kind: 'talent' | 'advance' | 'ascend';
  /** Talent ids, or advanced/tertiary class ids. Empty = rolled once an earlier class choice is made. */
  options: string[];
}

export interface IncomeBreakdown {
  base: number;
  interest: number;
  streak: number;
  /** From items such as Gambler's Coin. */
  items: number;
  total: number;
}

export interface RoundRecord {
  round: number;
  result: Winner;
  /** Enemy class ids (advanced where applicable), in board order. */
  enemy: string[];
  income: IncomeBreakdown | null;
  /** Gold left unspent going into the fight. Optional: older saves lack it. */
  gold?: number;
}

export type RunPhase = 'shop' | 'complete' | 'defeated';

/**
 * Fixed when a run starts (M7): its ladder tier, perks, and the content it
 * may draw from (what the player had unlocked then). Stored in the run so a
 * saved or replayed run never depends on later unlocks.
 */
export interface RunSetup {
  /** Difficulty ladder tier, 0 = base game. */
  tier: number;
  perks: string[];
  /** Recruitable classes; enemies are drawn from these too. */
  classes: string[];
  /** Items the shop (and enemies) can roll. Tertiary items are always available. */
  items: string[];
  /** Synergies that can activate. */
  synergies: string[];
  /** Set on a daily run: the date it belongs to (YYYY-MM-DD). */
  daily?: string;
  /** Favored class (post-M7): guaranteed a recruit offer in every shop of the first rounds. */
  favored?: string;
}

/**
 * The whole run as plain JSON-safe data, so it can be saved to localStorage
 * and resumed. Every transition is a pure function of (state, action, context).
 */
export interface RunState {
  seed: string;
  setup: RunSetup;
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
  /** Perk bookkeeping: the free reroll was used this round; Second Wind was spent. */
  freeRerollUsed: boolean;
  secondWindUsed: boolean;
  /** Shop slots the player locked: they keep their offer through rerolls and into the next round. Optional so older saves load. */
  locked?: number[];
  /** Locked offers bought this run (for the Window Shopper achievement). */
  lockedBought?: number;
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
  /** Lock a shop offer (costs `lockCost`), or unlock it again (free, no refund). */
  | { type: 'lock'; offer: number }
  /** Resolve the first pending choice by option index. */
  | { type: 'choose'; option: number }
  /** Spend stat points on the unit at `at` (points per stat, not stat units). */
  | { type: 'allocate'; at: SlotRef; points: Partial<Record<StatKey, number>> };

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
  | 'lockLimit'
  | 'noSuchItem'
  | 'pendingChoice'
  | 'noPendingChoice'
  | 'invalidChoice'
  | 'maxLevel'
  | 'invalidAllocation'
  | 'notEnoughPoints'
  | 'alreadyEquipped';

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

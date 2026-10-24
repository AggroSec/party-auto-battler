// Synthetic content for run-layer tests, independent of real class balance.
import { NEVER_CAST } from '../test-helpers.ts';
import type { AdvancedClassDef, ClassTemplate, ItemDef, StatWeights, SynergyDef, TalentDef, TertiaryClassDef } from './content-types.ts';
import type { EnemyArchetype, RunConfig, RunContext, RunContent } from './types.ts';

const BALANCED: StatWeights = { hp: 1, atk: 1, def: 0, spd: 0 };

const template = (id: string, over: Partial<ClassTemplate> & Pick<ClassTemplate, 'baseStats'>): ClassTemplate => ({
  id,
  name: id,
  range: 'melee',
  attackTarget: 'nearest',
  ability: NEVER_CAST,
  triggers: [],
  placement: 0,
  tags: [],
  statWeights: BALANCED,
  talents: [],
  advancedClasses: [],
  ...over,
});

export const TEMPLATES = {
  tank: template('tank', {
    baseStats: { hp: 30, atk: 5, def: 2, spd: 10 },
    placement: 0,
    tags: ['guard'],
    talents: ['tough', 'strong', 'quick', 'sturdy'],
    advancedClasses: ['paladin', 'brute'],
  }),
  archer: template('archer', {
    baseStats: { hp: 20, atk: 6, def: 0, spd: 10 },
    range: 'ranged',
    attackTarget: 'lowestHp',
    placement: 3,
    tags: ['wild'],
    statWeights: { hp: 1, atk: 2, def: 0, spd: 1 },
  }),
  /** Wins any fight against the fixtures. */
  titan: template('titan', { baseStats: { hp: 999, atk: 999, def: 0, spd: 50 } }),
  /** Deals no damage: two walls only end by sudden death, on the same pulse (a draw). */
  wall: template('wall', { baseStats: { hp: 50, atk: 0, def: 0, spd: 10 } }),
} satisfies Record<string, ClassTemplate>;

export const TALENTS: Record<string, TalentDef> = {
  tough: { id: 'tough', name: 'Tough', description: '+10 HP', stats: { hp: 10 } },
  strong: { id: 'strong', name: 'Strong', description: '+2 ATK', stats: { atk: 2 } },
  quick: { id: 'quick', name: 'Quick', description: '-1 cooldown', abilityCooldown: -1 },
  sturdy: { id: 'sturdy', name: 'Sturdy', description: '+1 DEF', stats: { def: 1 } },
  holy1: { id: 'holy1', name: 'Holy 1', description: '+5 HP', stats: { hp: 5 } },
  holy2: { id: 'holy2', name: 'Holy 2', description: '+5 HP', stats: { hp: 5 } },
  zeal1: { id: 'zeal1', name: 'Zeal 1', description: '+1 ATK', stats: { atk: 1 } },
  prayer: {
    id: 'prayer',
    name: 'Prayer',
    description: 'Grants Prayer',
    grantAbility: { ...NEVER_CAST, id: 'prayer', name: 'Prayer', cooldown: 5 },
  },
};

export const ADVANCED: Record<string, AdvancedClassDef> = {
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    baseClassId: 'tank',
    description: 'Holy tank',
    tags: ['guard', 'holy'],
    ability: { ...NEVER_CAST, id: 'smite', name: 'Smite', cooldown: 4 },
    modifier: { stats: { def: 2 } },
    talents: ['holy1', 'holy2'],
    tertiaryClasses: ['templar', 'crusader'],
  },
  brute: {
    id: 'brute',
    name: 'Brute',
    baseClassId: 'tank',
    description: 'Hits hard',
    tags: ['guard'],
    ability: NEVER_CAST,
    modifier: { stats: { atk: 3 }, lifesteal: 0.2 },
    talents: [],
  },
};

export const TERTIARY: Record<string, TertiaryClassDef> = {
  templar: {
    id: 'templar',
    name: 'Templar',
    baseClassId: 'tank',
    advancedClassId: 'paladin',
    description: 'Holy warrior',
    tags: ['holy'],
    ability: { ...NEVER_CAST, id: 'judgement', name: 'Judgement', cooldown: 3 },
    modifier: { stats: { hp: 10 } },
    talents: ['zeal1', 'prayer'],
  },
  crusader: {
    id: 'crusader',
    name: 'Crusader',
    baseClassId: 'tank',
    advancedClassId: 'paladin',
    description: 'Charges in',
    tags: ['guard'],
    ability: NEVER_CAST,
    modifier: { stats: { atk: 4 } },
    talents: [],
  },
};

/** Levels 1–8 with the tertiary choice at 7, for tests that need it. */
export const LONG_PROGRESSION = {
  xpForLevel: [0, 2, 5, 9, 14, 19, 25, 31],
  statPointsByLevel: [0, 3, 5, 3, 5, 3, 5, 3],
};

export const ITEMS: Record<string, ItemDef> = {
  sword: { id: 'sword', name: 'Sword', description: '+3 ATK', cost: 3, modifier: { stats: { atk: 3 } } },
  boots: {
    id: 'boots',
    name: 'Boots',
    description: '+2 SPD; tanks also gain reach',
    cost: 4,
    modifier: { stats: { spd: 2 } },
    classBonus: { classIds: ['tank'], description: 'reach', modifier: { reach: true } },
  },
};

export const SYNERGIES: SynergyDef[] = [
  {
    id: 'guards',
    name: 'Guards',
    tiers: [
      { requires: [{ kind: 'tag', tag: 'guard', count: 2 }], description: '+1 DEF', modifier: { stats: { def: 1 } }, appliesTo: { tag: 'guard' } },
      { requires: [{ kind: 'tag', tag: 'guard', count: 3 }], description: '+3 DEF', modifier: { stats: { def: 3 } }, appliesTo: { tag: 'guard' } },
    ],
  },
  {
    id: 'mixed',
    name: 'Mixed',
    tiers: [{ requires: [{ kind: 'distinctClasses', count: 2 }], description: '+4 HP', modifier: { stats: { hp: 4 } }, appliesTo: 'all' }],
  },
];

export const TEST_CONFIG: RunConfig = {
  startingGold: 10,
  startingLives: 3,
  winsToComplete: 3,
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
  lockCost: 1,
  maxLocks: 1,
  shop: { unitSlots: 4, extraSlots: 0, trainingChance: 0.5, fullPartyUnitSlots: 4 },
  progression: {
    xpForLevel: [0, 2, 5, 9, 14],
    xpPerWin: 2,
    xpPerLoss: 1,
    xpPerDraw: 1,
    advanceLevel: 3,
    ascendLevel: 7,
    statPointsByLevel: [0, 3, 5, 3, 5],
    statPointValue: { hp: 3, atk: 1, def: 1, spd: 1 },
    talentChoices: 3,
    trainingXp: 2,
    trainingCost: 3,
    maxItemsPerUnit: 2,
    itemSellRefund: 1,
  },
};

export const ARCHETYPES: Record<string, EnemyArchetype> = {
  grunt: { id: 'grunt', name: 'Grunt', classId: 'tank', minRound: 1 },
  sniper: { id: 'sniper', name: 'Sniper', classId: 'archer', minRound: 3 },
  wall: { id: 'wall', name: 'Wall', classId: 'wall', minRound: 1 },
  titan: { id: 'titan', name: 'Titan', classId: 'titan', minRound: 1 },
};

export function makeCtx(
  over: {
    config?: Partial<RunConfig>;
    shopPool?: string[];
    enemies?: EnemyArchetype[];
    content?: Partial<RunContent>;
  } = {},
): RunContext {
  return {
    config: { ...TEST_CONFIG, ...over.config },
    content: {
      classes: TEMPLATES,
      advancedClasses: ADVANCED,
      tertiaryClasses: TERTIARY,
      talents: TALENTS,
      items: ITEMS,
      synergies: SYNERGIES,
      shopPool: over.shopPool ?? ['tank', 'archer'],
      itemPool: ['sword', 'boots'],
      enemies: over.enemies ?? [ARCHETYPES.grunt!, ARCHETYPES.sniper!],
      enemyScaling: { unitsByRound: [1, 2, 3], baseMultiplier: 1, hpGrowthPerRound: 0.1, atkGrowthPerRound: 0.1 },
      enemyProgression: { levelByRound: [1], itemsByRound: [0] },
      unitNames: ['Ann', 'Bo', 'Cy'],
      ladder: [],
      perks: {},
      bosses: [],
      elite: { statMultiplier: { hp: 1.3, atk: 1.3 }, levels: 1 },
      ...over.content,
    },
  };
}

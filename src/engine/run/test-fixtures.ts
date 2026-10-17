// Synthetic content for run-layer tests, independent of real class balance.
import { NEVER_CAST } from '../test-helpers.ts';
import type { UnitTemplate } from '../types.ts';
import type { EnemyArchetype, RunConfig, RunContext, RunContent } from './types.ts';

const template = (id: string, over: Partial<UnitTemplate> & Pick<UnitTemplate, 'baseStats'>): UnitTemplate => ({
  id,
  name: id,
  range: 'melee',
  attackTarget: 'nearest',
  ability: NEVER_CAST,
  triggers: [],
  placement: 0,
  ...over,
});

export const TEMPLATES = {
  tank: template('tank', { baseStats: { hp: 30, atk: 5, def: 2, spd: 10 }, placement: 0 }),
  archer: template('archer', {
    baseStats: { hp: 20, atk: 6, def: 0, spd: 10 },
    range: 'ranged',
    attackTarget: 'lowestHp',
    placement: 3,
  }),
  /** Wins any fight against the fixtures. */
  titan: template('titan', { baseStats: { hp: 999, atk: 999, def: 0, spd: 50 } }),
  /** Deals no damage: two walls only end by sudden death, on the same pulse (a draw). */
  wall: template('wall', { baseStats: { hp: 50, atk: 0, def: 0, spd: 10 } }),
} satisfies Record<string, UnitTemplate>;

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
  shopSize: 4,
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
      shopPool: over.shopPool ?? ['tank', 'archer'],
      enemies: over.enemies ?? [ARCHETYPES.grunt!, ARCHETYPES.sniper!],
      enemyScaling: { unitsByRound: [1, 2, 3], baseMultiplier: 1, hpGrowthPerRound: 0.1, atkGrowthPerRound: 0.1 },
      unitNames: ['Ann', 'Bo', 'Cy'],
      ...over.content,
    },
  };
}

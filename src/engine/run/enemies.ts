import { Rng } from '../rng.ts';
import { BACK_SLOTS, FRONT_SLOTS, type Party, type Stats } from '../types.ts';
import { autoPlaceSlot, emptyBoard, setSlot } from './board.ts';
import { classFor, newUnit, resolveBoard } from './build.ts';
import { allocatePoints, applyChoice, grantXp, recommendedAllocation, talentOptions } from './progression.ts';
import type { Board, OwnedUnit, RunContent, RunContext } from './types.ts';

const tableAt = (table: readonly number[], round: number): number => {
  const n = table[Math.min(round, table.length) - 1];
  if (n === undefined) throw new Error('Enemy tables must not be empty');
  return n;
};

/** Enemy party size for a round. */
export function enemyCount(round: number, content: RunContent): number {
  return Math.min(tableAt(content.enemyScaling.unitsByRound, round), FRONT_SLOTS + BACK_SLOTS);
}

/** Per-round multiplier applied on top of each archetype's own multipliers. */
export function roundScaling(round: number, content: RunContent): Partial<Stats> {
  const { baseMultiplier, hpGrowthPerRound, atkGrowthPerRound } = content.enemyScaling;
  const r = round - 1;
  return { hp: baseMultiplier + hpGrowthPerRound * r, atk: baseMultiplier + atkGrowthPerRound * r };
}

/** Round a fractional value up with probability equal to its fraction. */
function stochasticRound(value: number, rng: Rng): number {
  const whole = Math.floor(value);
  return whole + (rng.chance(value - whole) ? 1 : 0);
}

/** Level an enemy unit for the round, making random choices as a player would. */
function developEnemy(unit: OwnedUnit, round: number, ctx: RunContext, rng: Rng): void {
  const cfg = ctx.config.progression;
  const level = Math.max(1, stochasticRound(tableAt(ctx.content.enemyProgression.levelByRound, round), rng));
  const target = cfg.xpForLevel[Math.min(level, cfg.xpForLevel.length) - 1] ?? 0;
  const queue = grantXp(unit, target, ctx.content, cfg, rng);
  for (const choice of queue) {
    const options = choice.options.length > 0 ? choice.options : (talentOptions(unit, choice.level, ctx.content, cfg, rng) ?? []);
    if (options.length > 0) applyChoice(unit, { ...choice, options }, rng.int(options.length));
  }
  allocatePoints(unit, recommendedAllocation(unit, ctx.content, cfg), cfg);
  const items = stochasticRound(tableAt(ctx.content.enemyProgression.itemsByRound, round), rng);
  for (let i = 0; i < Math.min(items, cfg.maxItemsPerUnit) && ctx.content.itemPool.length > 0; i++) {
    unit.items.push(rng.pick(ctx.content.itemPool));
  }
}

export interface EnemyParty {
  party: Party;
  builds: Board;
}

/**
 * The enemy for a round: archetypes developed to the round's level (with
 * random talents, advanced classes and items), synergies applied, then
 * HP/ATK scaled. Depends only on (seed, round, content, config), never on
 * the player's shop actions, so rerolling can't change who you fight.
 */
export function generateEnemy(seed: string, round: number, ctx: RunContext): EnemyParty {
  const { content } = ctx;
  const rng = new Rng(`${seed}:enemy:${round}`);
  const pool = content.enemies.filter((a) => a.minRound <= round);
  if (pool.length === 0) throw new Error(`No enemy archetypes available for round ${round}`);

  const picks = Array.from({ length: enemyCount(round, content) }, () => rng.pick(pool))
    // Place frontliners first so they claim the front row.
    .sort((x, y) => classFor(content, x.classId).placement - classFor(content, y.classId).placement);

  const builds = emptyBoard();
  const archetypeAt = new Map<OwnedUnit, (typeof picks)[number]>();
  picks.forEach((archetype, i) => {
    const slot = autoPlaceSlot(builds, classFor(content, archetype.classId));
    if (!slot) return;
    const unit = newUnit(-(i + 1), archetype.classId, archetype.name);
    developEnemy(unit, round, ctx, rng);
    setSlot(builds, slot, unit);
    archetypeAt.set(unit, archetype);
  });

  const resolved = resolveBoard(builds, content);
  const scale = roundScaling(round, content);
  const scaleRow = (row: 'front' | 'back') =>
    resolved[row].map((setup, col) => {
      const unit = builds[row][col];
      if (!setup || !unit) return null;
      const mult = archetypeAt.get(unit)?.statMultiplier ?? {};
      const m = (k: keyof Stats, roundMult = 1) => Math.max(k === 'hp' ? 1 : 0, Math.round(setup.stats[k] * (mult[k] ?? 1) * roundMult));
      return { ...setup, stats: { hp: m('hp', scale.hp), atk: m('atk', scale.atk), def: m('def'), spd: Math.max(1, m('spd')) } };
    });
  return { party: { front: scaleRow('front'), back: scaleRow('back') }, builds };
}

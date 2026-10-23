import { Rng } from '../rng.ts';
import { BACK_SLOTS, FRONT_SLOTS, type Party, type Stats } from '../types.ts';
import { autoPlaceSlot, emptyBoard, setSlot } from './board.ts';
import { classFor, newUnit, resolveBoard } from './build.ts';
import { allocatePoints, applyChoice, choiceOptions, grantXp, recommendedAllocation } from './progression.ts';
import type { Board, EnemyArchetype, OwnedUnit, RunContent, RunContext } from './types.ts';

const tableAt = (table: readonly number[], round: number): number => {
  const n = table[Math.min(round, table.length) - 1];
  if (n === undefined) throw new Error('Enemy tables must not be empty');
  return n;
};

/** Enemy party size for a round. */
export function enemyCount(round: number, content: RunContent): number {
  return Math.min(tableAt(content.enemyScaling.unitsByRound, round), FRONT_SLOTS + BACK_SLOTS);
}

/** Per-round multiplier applied on top of each archetype's own multipliers (and the ladder's enemy bonus). */
export function roundScaling(round: number, content: RunContent, bonus = 0): Partial<Stats> {
  const { baseMultiplier, hpGrowthPerRound, atkGrowthPerRound, growthUntilRound } = content.enemyScaling;
  const r = Math.min(round, growthUntilRound ?? round) - 1;
  return { hp: (baseMultiplier + hpGrowthPerRound * r) * (1 + bonus), atk: (baseMultiplier + atkGrowthPerRound * r) * (1 + bonus) };
}

/** Rounds over which the ladder's extra enemy levels ramp in. */
const LEVEL_RAMP_ROUNDS = 4;

/** Round a fractional value up with probability equal to its fraction. */
function stochasticRound(value: number, rng: Rng): number {
  const whole = Math.floor(value);
  return whole + (rng.chance(value - whole) ? 1 : 0);
}

/** Level an enemy unit for the round, making random choices as a player would. */
function developEnemy(unit: OwnedUnit, round: number, ctx: RunContext, rng: Rng, extraLevels = 0): void {
  const cfg = ctx.config.progression;
  const ramp = Math.min(1, (round - 1) / LEVEL_RAMP_ROUNDS);
  const planned = tableAt(ctx.content.enemyProgression.levelByRound, round) + (ctx.run?.enemyLevels ?? 0) * ramp + extraLevels;
  const level = Math.max(1, stochasticRound(planned, rng));
  const target = cfg.xpForLevel[Math.min(level, cfg.xpForLevel.length) - 1] ?? 0;
  const queue = grantXp(unit, target, ctx.content, cfg, rng);
  for (const choice of queue) {
    const options = choiceOptions(unit, choice, ctx.content, cfg, rng) ?? [];
    if (options.length > 0) applyChoice(unit, { ...choice, options }, rng.int(options.length));
  }
  allocatePoints(unit, recommendedAllocation(unit, ctx.content, cfg), cfg);
  const extraItem = ctx.run?.enemyExtraItemFrom !== undefined && round >= ctx.run.enemyExtraItemFrom ? 1 : 0;
  const items = stochasticRound(tableAt(ctx.content.enemyProgression.itemsByRound, round), rng) + extraItem;
  for (let i = 0; i < Math.min(items, cfg.maxItemsPerUnit) && ctx.content.itemPool.length > 0; i++) {
    unit.items.push(rng.pick(ctx.content.itemPool));
  }
}

interface Pick {
  archetype: EnemyArchetype;
  elite?: boolean;
  bossId?: string;
  /** Extra levels (Elites and bosses). */
  levels?: number;
}

/** Bosses and Elites per the ladder: a boss replaces one enemy on boss rounds; one other enemy may be an Elite. */
function addBossAndElite(picks: Pick[], round: number, ctx: RunContext, rng: Rng): void {
  const { run, content } = ctx;
  if (!run || picks.length === 0) return;
  let bossAt = -1;
  const bosses = content.bosses.filter((b) => b.minRound <= round);
  if (run.bossRounds?.includes(round) && bosses.length > 0) {
    const boss = rng.pick(bosses);
    bossAt = rng.int(picks.length);
    picks[bossAt] = {
      archetype: { id: boss.id, name: boss.name, classId: boss.classId, minRound: boss.minRound, statMultiplier: boss.statMultiplier },
      bossId: boss.id,
      levels: 1,
    };
  }
  if (run.elitesFrom !== undefined && round >= run.elitesFrom) {
    const candidates = picks.map((_, i) => i).filter((i) => i !== bossAt);
    if (candidates.length === 0) return;
    const i = rng.pick(candidates);
    const { archetype } = picks[i]!;
    const mult = (k: keyof Stats) => (archetype.statMultiplier?.[k] ?? 1) * (content.elite.statMultiplier[k] ?? 1);
    picks[i] = {
      archetype: { ...archetype, name: `Elite ${archetype.name}`, statMultiplier: { hp: mult('hp'), atk: mult('atk'), def: mult('def'), spd: mult('spd') } },
      elite: true,
      levels: content.elite.levels,
    };
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

  const picks: Pick[] = Array.from({ length: enemyCount(round, content) }, () => ({ archetype: rng.pick(pool) }));
  addBossAndElite(picks, round, ctx, rng);
  // Place frontliners first so they claim the front row.
  picks.sort((x, y) => classFor(content, x.archetype.classId).placement - classFor(content, y.archetype.classId).placement);

  const builds = emptyBoard();
  const archetypeAt = new Map<OwnedUnit, Pick>();
  picks.forEach((pick, i) => {
    const { archetype } = pick;
    const slot = autoPlaceSlot(builds, classFor(content, archetype.classId));
    if (!slot) return;
    const unit = newUnit(-(i + 1), archetype.classId, archetype.name);
    if (pick.elite) unit.elite = true;
    if (pick.bossId) {
      unit.bossId = pick.bossId;
      if (ctx.run?.empoweredBosses) unit.empowered = true;
    }
    developEnemy(unit, round, ctx, rng, pick.levels ?? 0);
    setSlot(builds, slot, unit);
    archetypeAt.set(unit, pick);
  });

  const resolved = resolveBoard(builds, content);
  const scale = roundScaling(round, content, ctx.run?.enemyStats ?? 0);
  const scaleRow = (row: 'front' | 'back') =>
    resolved[row].map((setup, col) => {
      const unit = builds[row][col];
      if (!setup || !unit) return null;
      const mult = archetypeAt.get(unit)?.archetype.statMultiplier ?? {};
      const m = (k: keyof Stats, roundMult = 1) => Math.max(k === 'hp' ? 1 : 0, Math.round(setup.stats[k] * (mult[k] ?? 1) * roundMult));
      return { ...setup, stats: { hp: m('hp', scale.hp), atk: m('atk', scale.atk), def: m('def'), spd: Math.max(1, m('spd')) } };
    });
  return { party: { front: scaleRow('front'), back: scaleRow('back') }, builds };
}

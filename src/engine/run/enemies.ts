import { Rng } from '../rng.ts';
import { BACK_SLOTS, FRONT_SLOTS, type Party, type Stats, type UnitSetup } from '../types.ts';
import { autoPlaceSlot, instantiate, setSlot, templateFor } from './board.ts';
import type { RunContent } from './types.ts';

/** Enemy party size for a round. */
export function enemyCount(round: number, content: RunContent): number {
  const table = content.enemyScaling.unitsByRound;
  const n = table[Math.min(round, table.length) - 1];
  if (n === undefined) throw new Error('enemyScaling.unitsByRound must not be empty');
  return Math.min(n, FRONT_SLOTS + BACK_SLOTS);
}

/** Per-round multiplier applied on top of each archetype's own multipliers. */
export function roundScaling(round: number, content: RunContent): Partial<Stats> {
  const r = round - 1;
  return {
    hp: 1 + content.enemyScaling.hpGrowthPerRound * r,
    atk: 1 + content.enemyScaling.atkGrowthPerRound * r,
  };
}

/**
 * The enemy party for a round. Depends only on (seed, round, content), never
 * on the player's shop actions, so rerolling can't change who you fight.
 */
export function generateEnemy(seed: string, round: number, content: RunContent): Party {
  const rng = new Rng(`${seed}:enemy:${round}`);
  const pool = content.enemies.filter((a) => a.minRound <= round);
  if (pool.length === 0) throw new Error(`No enemy archetypes available for round ${round}`);

  const scale = roundScaling(round, content);
  const picks = Array.from({ length: enemyCount(round, content) }, () => rng.pick(pool))
    // Place frontliners first so they claim the front row.
    .map((a) => ({ archetype: a, template: templateFor(content, a.classId) }))
    .sort((x, y) => x.template.placement - y.template.placement);

  const board: { front: (UnitSetup | null)[]; back: (UnitSetup | null)[] } = {
    front: Array(FRONT_SLOTS).fill(null),
    back: Array(BACK_SLOTS).fill(null),
  };
  for (const { archetype, template } of picks) {
    const slot = autoPlaceSlot(board, template);
    if (!slot) break;
    const mult = archetype.statMultiplier ?? {};
    setSlot(
      board,
      slot,
      instantiate(template, {
        name: archetype.name,
        statMultiplier: {
          hp: (mult.hp ?? 1) * (scale.hp ?? 1),
          atk: (mult.atk ?? 1) * (scale.atk ?? 1),
          def: mult.def ?? 1,
          spd: mult.spd ?? 1,
        },
      }),
    );
  }
  return board;
}

import { living, opponent, type CombatState, type CombatUnit } from './state.ts';
import type { BoardPos, TargetSelector } from './types.ts';

/** Context for trigger-relative selectors. */
export interface TargetContext {
  triggerSource?: CombatUnit;
  triggerTarget?: CombatUnit;
}

/**
 * Horizontal lane position. The back row's two slots sit between the front
 * row's three, so back col 0 is at 0.5 (between front 0 and 1).
 */
export function laneX(pos: BoardPos): number {
  return pos.row === 'front' ? pos.col : pos.col + 0.5;
}

const byOrder = (a: CombatUnit, b: CombatUnit) => a.order - b.order;

/** Living units in the frontmost occupied row of `candidates`. */
export function frontmostRow(candidates: CombatUnit[]): CombatUnit[] {
  const front = candidates.filter((u) => u.pos.row === 'front');
  return front.length > 0 ? front : candidates.filter((u) => u.pos.row === 'back');
}

/** Nearest: frontmost row first, then closest lane to the attacker, then lowest column. */
export function nearestTarget(source: CombatUnit, enemies: CombatUnit[]): CombatUnit | undefined {
  const row = frontmostRow(enemies);
  const x = laneX(source.pos);
  return [...row].sort(
    (a, b) => Math.abs(laneX(a.pos) - x) - Math.abs(laneX(b.pos) - x) || byOrder(a, b),
  )[0];
}

function minBy(units: CombatUnit[], key: (u: CombatUnit) => number): CombatUnit | undefined {
  let best: CombatUnit | undefined;
  for (const u of [...units].sort(byOrder)) {
    if (!best || key(u) < key(best)) best = u;
  }
  return best;
}

/** Resolve a selector to its targets, in board order. Returns [] if nothing is valid. */
export function selectTargets(
  state: CombatState,
  source: CombatUnit,
  selector: TargetSelector,
  ctx: TargetContext = {},
): CombatUnit[] {
  const enemies = living(state, opponent(source.side));
  const allies = living(state, source.side);
  const one = (u: CombatUnit | undefined) => (u ? [u] : []);

  switch (selector) {
    case 'nearest':
      return one(nearestTarget(source, enemies));
    case 'backlineFirst': {
      const back = enemies.filter((u) => u.pos.row === 'back');
      return back.length > 0 ? one(minBy(back, (u) => u.hp)) : one(nearestTarget(source, enemies));
    }
    case 'lowestHp':
      return one(minBy(enemies, (u) => u.hp));
    case 'highestAtk':
      return one(minBy(enemies, (u) => -u.atk));
    case 'randomEnemy':
      return enemies.length > 0 ? [state.rng.pick([...enemies].sort(byOrder))] : [];
    case 'enemyFrontRow':
      return frontmostRow(enemies).sort(byOrder);
    case 'allEnemies':
      return [...enemies].sort(byOrder);
    case 'self':
      return source.alive ? [source] : [];
    case 'lowestHpAlly':
      return one(minBy(allies, (u) => u.hp / u.maxHp));
    case 'allAllies':
      return [...allies].sort(byOrder);
    case 'triggerSource':
      return ctx.triggerSource?.alive ? [ctx.triggerSource] : [];
    case 'triggerTarget':
      return ctx.triggerTarget?.alive ? [ctx.triggerTarget] : [];
  }
}

/** Living units adjacent to `unit` in its own row. */
export function rowNeighbours(state: CombatState, unit: CombatUnit): CombatUnit[] {
  return state.units
    .filter(
      (u) =>
        u.alive &&
        u.side === unit.side &&
        u.pos.row === unit.pos.row &&
        Math.abs(u.pos.col - unit.pos.col) === 1,
    )
    .sort(byOrder);
}

import { BACK_SLOTS, FRONT_SLOTS, type Party, type Row, type Stats, type UnitSetup, type UnitTemplate } from '../types.ts';
import type { Board, OwnedUnit, RunContent, SlotRef } from './types.ts';

/** Templates at or below this placement priority prefer the front row. */
export const FRONT_ROW_MAX_PLACEMENT = 1;

export function emptyBoard(): Board {
  return { front: Array(FRONT_SLOTS).fill(null), back: Array(BACK_SLOTS).fill(null) };
}

export function isValidSlot(slot: SlotRef): boolean {
  const size = slot.row === 'front' ? FRONT_SLOTS : BACK_SLOTS;
  return Number.isInteger(slot.col) && slot.col >= 0 && slot.col < size;
}

export function getSlot<T>(board: { front: T[]; back: T[] }, slot: SlotRef): T | undefined {
  return board[slot.row][slot.col];
}

export function setSlot<T>(board: { front: T[]; back: T[] }, slot: SlotRef, value: T): void {
  board[slot.row][slot.col] = value;
}

/** All slots in board order. */
export function allSlots(): SlotRef[] {
  return [
    ...Array.from({ length: FRONT_SLOTS }, (_, col) => ({ row: 'front' as const, col })),
    ...Array.from({ length: BACK_SLOTS }, (_, col) => ({ row: 'back' as const, col })),
  ];
}

export function unitCount(board: { front: unknown[]; back: unknown[] }): number {
  return [...board.front, ...board.back].filter((u) => u !== null).length;
}

/**
 * Where a newly added unit goes: the first empty slot in its preferred row
 * (front for low placement priority), otherwise the first empty slot anywhere.
 */
export function autoPlaceSlot(
  board: { front: unknown[]; back: unknown[] },
  template: Pick<UnitTemplate, 'placement'>,
): SlotRef | null {
  const preferred: Row = template.placement <= FRONT_ROW_MAX_PLACEMENT ? 'front' : 'back';
  const empty = allSlots().filter((s) => getSlot(board, s) === null);
  return empty.find((s) => s.row === preferred) ?? empty[0] ?? null;
}

/** Resolve a class template into an engine-ready unit. */
export function instantiate(
  template: UnitTemplate,
  opts: { name?: string; statBonus?: Partial<Stats>; statMultiplier?: Partial<Stats> } = {},
): UnitSetup {
  const stat = (k: keyof Stats) =>
    Math.round(template.baseStats[k] * (opts.statMultiplier?.[k] ?? 1)) + (opts.statBonus?.[k] ?? 0);
  return {
    name: opts.name ?? template.name,
    classId: template.id,
    stats: { hp: stat('hp'), atk: stat('atk'), def: stat('def'), spd: stat('spd') },
    range: template.range,
    attackTarget: template.attackTarget,
    ability: template.ability,
    triggers: template.triggers,
  };
}

export function templateFor(content: RunContent, classId: string): UnitTemplate {
  const t = content.classes[classId];
  if (!t) throw new Error(`Unknown class id: ${classId}`);
  return t;
}

/** The player's board as a combat Party. */
export function boardToParty(board: Board, content: RunContent): Party {
  const toSetup = (u: OwnedUnit | null) => (u ? instantiate(templateFor(content, u.classId), { name: u.name }) : null);
  return { front: board.front.map(toSetup), back: board.back.map(toSetup) };
}

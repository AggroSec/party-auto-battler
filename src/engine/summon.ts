// Summons: combat-only units that enter an empty slot on the summoner's side.
import { resolveAmount } from './damage.ts';
import { emit, makeCombatUnit, snapshot, type CombatState, type CombatUnit } from './state.ts';
import { BACK_SLOTS, FRONT_SLOTS, type AbilityDef, type BoardPos, type Row, type SummonDef, type UnitSetup } from './types.ts';

/** Summons without an ability of their own just attack. */
export const NO_ABILITY: AbilityDef = { id: 'none', name: 'None', description: 'No ability.', cooldown: 10_000, effects: [] };

/** The first empty slot on `side`, trying `row` first. */
export function emptySlot(state: CombatState, side: CombatUnit['side'], row: Row): BoardPos | null {
  const taken = (pos: BoardPos) => state.units.some((u) => u.alive && u.side === side && u.pos.row === pos.row && u.pos.col === pos.col);
  const rows: Row[] = row === 'front' ? ['front', 'back'] : ['back', 'front'];
  for (const r of rows) {
    for (let col = 0; col < (r === 'front' ? FRONT_SLOTS : BACK_SLOTS); col++) {
      if (!taken({ row: r, col })) return { row: r, col };
    }
  }
  return null;
}

/** Summon `def` for `source`. Returns false (and does nothing) if there is no empty slot. */
export function summonUnit(state: CombatState, source: CombatUnit, def: SummonDef, power: number): boolean {
  const pos = emptySlot(state, source.side, def.row);
  if (!pos) return false;
  const setup: UnitSetup = {
    name: def.name,
    classId: def.classId,
    stats: {
      hp: Math.max(1, Math.round(resolveAmount(def.hp, source) * power)),
      atk: Math.max(0, Math.round(resolveAmount(def.atk, source) * power)),
      def: def.def,
      spd: def.spd,
    },
    range: def.range,
    attackTarget: def.attackTarget,
    ability: def.ability ?? NO_ABILITY,
    triggers: def.triggers ?? [],
  };
  const id = `${source.side === 'player' ? 'p' : 'e'}s${state.summons++}`;
  const unit = makeCombatUnit(setup, source.side, pos, id);
  unit.summonedBy = source.id;
  state.units.push(unit);
  emit(state, { tick: state.tick, type: 'summon', source: source.id, unit: snapshot(unit) });
  return true;
}

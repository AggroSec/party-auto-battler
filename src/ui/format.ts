import { OVERTIME_SOURCE, type CombatEvent, type UnitSnapshot } from '../engine/index.ts';

/** Every unit that took part in a fight: the starting line-up plus anything summoned. */
export function combatUnits(events: readonly CombatEvent[]): Map<string, UnitSnapshot> {
  const units = new Map<string, UnitSnapshot>();
  for (const e of events) {
    if (e.type === 'combatStart') for (const u of e.units) units.set(u.id, u);
    else if (e.type === 'summon') units.set(e.unit.id, e.unit);
  }
  return units;
}

/** Human-readable line for one combat event. Returns null for events not worth showing. */
export function describeEvent(e: CombatEvent, units: Map<string, UnitSnapshot>): string | null {
  const n = (id: string) => {
    if (id === OVERTIME_SOURCE) return 'Sudden death';
    const u = units.get(id);
    return u ? `${u.side === 'player' ? '🟦' : '🟥'} ${u.name}` : id;
  };
  switch (e.type) {
    case 'combatStart':
      return `Combat begins: ${e.units.length} units on the field.`;
    case 'turn':
      return null;
    case 'attack':
      return `${n(e.source)} attacks ${n(e.target)}.`;
    case 'ability':
      return `${n(e.source)} casts ${e.name}!`;
    case 'trigger':
      return `${n(e.source)}: ${e.label} (${e.on})`;
    case 'damage':
      return `  ${n(e.target)} takes ${e.value}${e.absorbed ? ` (+${e.absorbed} absorbed)` : ''} → ${e.hpAfter} HP`;
    case 'heal':
      return `  ${n(e.target)} heals ${e.value} → ${e.hpAfter} HP`;
    case 'shield':
      return `  ${n(e.target)} gains a ${e.value} shield (${e.shieldAfter} total)`;
    case 'buff':
      return `  ${n(e.target)} ${e.value >= 0 ? '+' : ''}${e.value} ${e.stat.toUpperCase()} → ${e.statAfter}`;
    case 'cooldown':
      return `  ${n(e.target)}'s ability ${e.turns < 0 ? 'hastened' : 'delayed'} (${e.cooldownAfter} turn${e.cooldownAfter === 1 ? '' : 's'} left)`;
    case 'taunt':
      return `  ${n(e.target)} taunts the enemy (${e.turns} turn${e.turns === 1 ? '' : 's'})`;
    case 'overtime':
      return `⏳ Sudden death! Everyone loses ${Math.round(e.percent * 100)}% max HP.`;
    case 'death':
      return `💀 ${n(e.target)} falls.`;
    case 'summon':
      return `${n(e.source)} summons ${n(e.unit.id)}!`;
    case 'combatEnd':
      return e.winner === 'draw'
        ? `Draw (${e.reason === 'tickCap' ? 'time ran out' : 'mutual destruction'}).`
        : `${e.winner === 'player' ? 'Player' : 'Enemy'} wins!`;
  }
}

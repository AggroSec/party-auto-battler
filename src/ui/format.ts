import { OVERTIME_SOURCE, type CombatEvent, type UnitSnapshot } from '../engine/index.ts';

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
      return `  ${n(e.target)} +${e.value} ${e.stat.toUpperCase()} → ${e.statAfter}`;
    case 'overtime':
      return `⏳ Sudden death! Everyone loses ${Math.round(e.percent * 100)}% max HP.`;
    case 'death':
      return `💀 ${n(e.target)} falls.`;
    case 'combatEnd':
      return e.winner === 'draw'
        ? `Draw (${e.reason === 'tickCap' ? 'time ran out' : 'mutual destruction'}).`
        : `${e.winner === 'player' ? 'Player' : 'Enemy'} wins!`;
  }
}

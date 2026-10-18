import type { RunContent } from '../../engine/run/index.ts';

/**
 * Colour and placeholder glyph per base class. Advanced classes use their base
 * class's look. Glyphs are emoji until the game-icons.net set lands (Juice milestone).
 */
const STYLES: Record<string, { color: string; glyph: string }> = {
  warrior: { color: '#d08a3c', glyph: '🛡️' },
  rogue: { color: '#9a6bd8', glyph: '🗡️' },
  mage: { color: '#4c8dff', glyph: '🔮' },
  cleric: { color: '#e8c95a', glyph: '✨' },
  ranger: { color: '#5bb85d', glyph: '🏹' },
  necromancer: { color: '#6fc2b4', glyph: '💀' },
  monk: { color: '#e85d75', glyph: '👊' },
  bard: { color: '#ff9ff3', glyph: '🎵' },
  druid: { color: '#9cc93f', glyph: '🌿' },
  warlock: { color: '#c0399b', glyph: '😈' },
  engineer: { color: '#7aa6c2', glyph: '⚙️' },
  // Summons take their summoner's colour.
  treant: { color: '#9cc93f', glyph: '🌳' },
  imp: { color: '#c0399b', glyph: '👿' },
  turret: { color: '#7aa6c2', glyph: '🔩' },
  sentry: { color: '#7aa6c2', glyph: '🤖' },
};

const FALLBACK = { color: '#8a90a2', glyph: '❔' };

/** Base class id for a base or advanced class id. */
export function baseClassOf(content: RunContent, classId: string): string {
  return content.advancedClasses[classId]?.baseClassId ?? classId;
}

export function classStyle(content: RunContent | null, classId: string): { color: string; glyph: string } {
  const base = content ? baseClassOf(content, classId) : classId;
  return STYLES[base] ?? FALLBACK;
}


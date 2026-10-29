import { ICONS, type IconId } from '../../assets/icons.ts';
import type { RunContent } from '../../engine/run/index.ts';

/**
 * Colour per base class (and summon). Advanced and tertiary classes use their
 * base class's look; the icon is the game-icons.net icon with the same id.
 */
const COLORS: Record<string, string> = {
  warrior: '#d08a3c',
  rogue: '#9a6bd8',
  mage: '#4c8dff',
  cleric: '#e8c95a',
  ranger: '#5bb85d',
  necromancer: '#6fc2b4',
  monk: '#e85d75',
  bard: '#ff9ff3',
  druid: '#9cc93f',
  warlock: '#c0399b',
  engineer: '#7aa6c2',
  runeblade: '#5fd4e8',
  'dark-knight': '#a03a4a',
  // Summons take their summoner's colour.
  treant: '#9cc93f',
  imp: '#c0399b',
  turret: '#7aa6c2',
  sentry: '#7aa6c2',
  wolf: '#a3794f',
  'mirror-image': '#b07fe0',
  ancient: '#6f9a2e',
  fiend: '#d0453a',
  golem: '#8c9aa6',
  ghoul: '#7d8c5a',
};

const FALLBACK_COLOR = '#8a90a2';

export interface ClassLook {
  color: string;
  /** Null for an unknown class (shown as a plain "?"). */
  icon: IconId | null;
}

/** Base class id for a base, advanced or tertiary class id. */
export function baseClassOf(content: RunContent, classId: string): string {
  return content.advancedClasses[classId]?.baseClassId ?? content.tertiaryClasses[classId]?.baseClassId ?? classId;
}

const isIcon = (id: string): id is IconId => id in ICONS;

export function classStyle(content: RunContent | null, classId: string): ClassLook {
  const base = content ? baseClassOf(content, classId) : classId;
  return { color: COLORS[base] ?? FALLBACK_COLOR, icon: isIcon(base) ? base : null };
}

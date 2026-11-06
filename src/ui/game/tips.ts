// One-time tips (issue #28): short hints the first time something happens in
// a run. Seen tips and the on/off switch live in localStorage.
import { activeSynergies, boardUnits, type RunContext, type RunState } from '../../engine/run/index.ts';
import { load, save } from './storage.ts';

export interface Tip {
  id: string;
  text: string;
  /** Show it when this holds (and it hasn't been seen). */
  when: (run: RunState, ctx: RunContext) => boolean;
}

/** In priority order: the first unseen tip that applies is shown. */
export const TIPS: readonly Tip[] = [
  {
    id: 'rules-mode',
    text: 'Rules mode: click a unit to see its skills and its rules. Each turn it uses the first rule that can fire, top to bottom. Edit, reorder or add rules there; enemies use the class defaults.',
    when: (run) => run.setup.mode === 'rules' && boardUnits(run.board).length > 0,
  },
  {
    id: 'recruit',
    text: 'Start by recruiting: click a recruit card (or drag it onto the board). Tough units go in the front row; healers and ranged units in the back. Then press Fight.',
    when: (run) => run.round === 1 && boardUnits(run.board).length === 0,
  },
  {
    id: 'choice',
    text: 'A unit leveled up (⭐). Click it to choose a talent. At level 3 it picks an advanced class, at level 7 a tertiary class.',
    when: (run) => run.pending.length > 0,
  },
  {
    id: 'stat-points',
    text: 'Stat points (+N on a unit): click the unit to spend them, or leave them and they go on its recommended spread before the fight.',
    when: (run) => boardUnits(run.board).some((u) => u.statPoints > 0),
  },
  {
    id: 'round-two',
    text: 'You earn gold every round, plus interest on what you save. Fill the board, then buy training (XP) and items: click a unit first, then the item. The last shop slot is always a consumable.',
    when: (run) => run.round === 2,
  },
  {
    id: 'synergy',
    text: 'A synergy is active: units that share a tag get a bonus. The synergy list shows what’s on and what you’re one unit away from.',
    when: (run, ctx) => activeSynergies(boardUnits(run.board), ctx.content).length > 0,
  },
  {
    id: 'lost-life',
    text: 'Lost a fight? That costs a life, but loss streaks pay bonus gold. Check the fight report to see who did (and took) the damage.',
    when: (run) => run.losses > 0,
  },
];

const KEY = 'tips';
interface TipState {
  off: boolean;
  seen: string[];
}
const isTipState = (d: unknown): d is TipState => typeof d === 'object' && d !== null && Array.isArray((d as TipState).seen);
const read = (): TipState => load(KEY, isTipState, 1) ?? { off: false, seen: [] };

export const tipsEnabled = (): boolean => !read().off;
export function setTipsEnabled(on: boolean): void {
  save(KEY, { ...read(), off: !on }, 1);
}
export function resetTips(): void {
  save(KEY, { ...read(), seen: [] }, 1);
}
export function markSeen(id: string): void {
  const s = read();
  if (!s.seen.includes(id)) save(KEY, { ...s, seen: [...s.seen, id] }, 1);
}

/** The tip to show now, if any. */
export function currentTip(run: RunState, ctx: RunContext): Tip | null {
  const s = read();
  if (s.off || run.setup.daily) return null;
  return TIPS.find((t) => !s.seen.includes(t.id) && t.when(run, ctx)) ?? null;
}

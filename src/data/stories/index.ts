// Story mode content (Milestone 14).
import type { RunModifier } from '../../engine/run/content-types.ts';
import type { RunSetup } from '../../engine/run/types.ts';
import type { Unlocked } from '../../engine/meta/types.ts';
import type { StoryDef } from '../../engine/story/types.ts';
import { BLACK_COVENANT } from './black-covenant.ts';
import { HOLLOWING } from './hollowing.ts';

export { BLACK_COVENANT, HOLLOWING };

/** Every story, in the order the story picker shows them. */
export const STORIES: Record<string, StoryDef> = { [HOLLOWING.id]: HOLLOWING, [BLACK_COVENANT.id]: BLACK_COVENANT };

/** Story runs: the story gives the party, so the shop never sells recruits. */
export const STORY_MODE_MODIFIER: RunModifier = { noRecruits: true };

/**
 * A story run's setup: the story's own tier, its heroes' classes (whatever
 * the player has unlocked: a story brings its classes with it), the player's
 * unlocked items, and the player's synergies plus the story's own (Strength
 * of the Tribe, Reign of Dread), which is always on: it's the story's point.
 */
export function storySetup(storyId: string, tier: number, unlocked: Pick<Unlocked, 'items'>, synergies: readonly string[]): RunSetup {
  const story = STORIES[storyId];
  if (!story) throw new Error(`Unknown story: ${storyId}`);
  const classes = [...new Set(story.heroes.map((h) => h.classId))];
  return {
    tier: Math.max(0, Math.min(tier, story.tiers.length)),
    perks: [],
    classes,
    items: [...unlocked.items],
    synergies: [...new Set([...synergies, ...(story.synergy ? [story.synergy] : [])])],
    mode: 'story',
    story: storyId,
  };
}

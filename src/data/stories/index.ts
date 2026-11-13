// Story mode content (Milestone 14).
import type { RunModifier } from '../../engine/run/content-types.ts';
import type { RunSetup } from '../../engine/run/types.ts';
import type { Unlocked } from '../../engine/meta/types.ts';
import { HOLLOWING, STORIES } from './hollowing.ts';

export { HOLLOWING, STORIES };

/** Story runs: the story gives the party, so the shop never sells recruits. */
export const STORY_MODE_MODIFIER: RunModifier = { noRecruits: true };

/**
 * A story run's setup: the story's own tier, its heroes' classes (whatever
 * the player has unlocked: a story brings its classes with it), and the
 * player's unlocked items. Synergies are all on: Strength of the Tribe is the
 * story's point.
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
    synergies: [...synergies],
    mode: 'story',
    story: storyId,
  };
}

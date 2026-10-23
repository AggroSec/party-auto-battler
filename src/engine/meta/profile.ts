// The player's profile: unlocked content, perk offers and daily runs.
import { Rng } from '../rng.ts';
import { sample } from '../run/progression.ts';
import type { RunSetup } from '../run/types.ts';
import type { MetaCatalog, Profile, Unlocked } from './types.ts';

export function newProfile(): Profile {
  return { achievements: [], maxTier: 0, discovered: [], stats: { runs: 0, completed: 0, fightsWon: 0 }, daily: null, unlockAll: false };
}

/** Starting content plus every earned achievement's reward (or everything, with the unlock-all toggle). */
export function unlockedContent(profile: Profile, catalog: MetaCatalog): Unlocked {
  if (profile.unlockAll) {
    return {
      classes: [...catalog.all.classes],
      items: [...catalog.all.items],
      synergies: [...catalog.all.synergies],
      perks: [...catalog.all.perks],
      perkSlots: catalog.maxPerkSlots,
      maxTier: catalog.maxTier,
    };
  }
  const earned = catalog.achievements.filter((a) => profile.achievements.includes(a.id));
  const rewards = [catalog.starter, ...earned.map((a) => a.reward)];
  const have = (key: 'classes' | 'items' | 'synergies' | 'perks') => {
    const set = new Set(rewards.flatMap((r) => r[key] ?? []));
    return catalog.all[key].filter((id) => set.has(id));
  };
  const perkSlots = Math.min(catalog.maxPerkSlots, catalog.starter.perkSlots + earned.reduce((s, a) => s + (a.reward.perkSlots ?? 0), 0));
  return {
    classes: have('classes'),
    items: have('items'),
    synergies: have('synergies'),
    perks: have('perks'),
    perkSlots,
    maxTier: Math.min(catalog.maxTier, profile.maxTier),
  };
}

/** The perks offered at the start of a run: kept + extra, drawn from the pool by the run's seed. */
export function perkOffer(seed: string, pool: readonly string[], kept: number, catalog: MetaCatalog): string[] {
  return sample(new Rng(`${seed}:perks`), pool, kept + catalog.perkChoiceExtra);
}

/** A run's setup from what's unlocked, a chosen tier and chosen perks. */
export function runSetupFor(unlocked: Unlocked, tier: number, perks: readonly string[]): RunSetup {
  return {
    tier: Math.max(0, Math.min(tier, unlocked.maxTier)),
    perks: perks.filter((p) => unlocked.perks.includes(p)).slice(0, unlocked.perkSlots),
    classes: [...unlocked.classes],
    items: [...unlocked.items],
    synergies: [...unlocked.synergies],
  };
}

/** A small stable hash of a string (FNV-1a), for deriving daily values without Date. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Daily runs rotate through these ladder tiers. */
export const DAILY_TIERS = [2, 3, 4, 5, 6] as const;

/**
 * The daily run for a date (YYYY-MM-DD): same seed, tier and perk offer for
 * everyone, with all content unlocked so it's fair. You keep one perk.
 */
export function dailyRun(date: string, catalog: MetaCatalog): { seed: string; setup: Omit<RunSetup, 'perks'>; perkOffer: string[] } {
  const seed = `daily-${date}`;
  return {
    seed,
    setup: {
      tier: DAILY_TIERS[hash(date) % DAILY_TIERS.length]!,
      classes: [...catalog.all.classes],
      items: [...catalog.all.items],
      synergies: [...catalog.all.synergies],
      daily: date,
    },
    perkOffer: perkOffer(seed, catalog.all.perks, 1, catalog),
  };
}

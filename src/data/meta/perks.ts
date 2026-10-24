import type { PerkDef } from '../../engine/run/content-types.ts';

/**
 * Starting perks (M7). At the start of a run you're offered a few from your
 * unlocked pool and keep one (Perkception unlocks keep more). Small on
 * purpose: the ladder outpaces them.
 */
const PERK_LIST: PerkDef[] = [
  { id: 'deep-pockets', name: 'Deep Pockets', description: 'Start with 3 more gold.', modifier: { startingGold: 3 } },
  { id: 'armory', name: 'Armory', description: 'Your first shop has an extra item, free.', modifier: { freeItem: true } },
  { id: 'bargain-hunter', name: 'Bargain Hunter', description: 'Your first reroll each round is free.', modifier: { freeReroll: true } },
  { id: 'veteran', name: 'Veteran', description: 'Your first recruit starts at level 2.', modifier: { veteranRecruit: true } },
  { id: 'second-wind', name: 'Second Wind', description: 'Your first lost fight costs no life.', modifier: { secondWind: true } },
  { id: 'tutor', name: 'Tutor', description: 'Training costs 1 less gold.', modifier: { trainingCost: -1 } },
  { id: 'investor', name: 'Investor', description: 'Interest is capped 1 gold higher.', modifier: { maxInterest: 1 } },
  { id: 'mentor', name: 'Mentor', description: 'Level-ups offer one more talent to choose from.', modifier: { talentChoices: 1 } },
  { id: 'recruiter', name: 'Recruiter', description: 'Recruits cost 2 gold for the first 3 rounds.', modifier: { earlyRecruitCost: { rounds: 3, cost: 2 } } },
  { id: 'extra-life', name: 'Extra Life', description: 'Start with one more life.', modifier: { startingLives: 1 } },
  { id: 'quartermaster', name: 'Quartermaster', description: 'The shop has one more item/training slot.', modifier: { shopSlots: 1 } },
  { id: 'haggler', name: 'Haggler', description: 'Locking a shop offer is free.', modifier: { lockCost: -1 } },
  { id: 'layaway', name: 'Layaway', description: 'You can lock one more shop offer.', modifier: { lockSlots: 1 } },
  { id: 'drill-sergeant', name: 'Drill Sergeant', description: 'Every level-up grants 1 more stat point.', modifier: { statPointsPerLevel: 1 } },
];

export const PERKS: Record<string, PerkDef> = Object.fromEntries(PERK_LIST.map((p) => [p.id, p]));
export const PERK_IDS = PERK_LIST.map((p) => p.id);

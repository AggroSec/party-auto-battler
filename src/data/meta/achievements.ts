import type { AchievementDef } from '../../engine/meta/types.ts';
import { DARK, LIGHT } from '../synergies.ts';

/**
 * Achievements (M7). Each unlocks something; a class unlock brings its class
 * item with it. Ladder tiers aren't here: winning a run on your highest tier
 * opens the next one.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // Classes.
  { id: 'first-victory', name: 'Hero of the Realm', description: 'Win a run.', condition: { kind: 'completeRun' }, reward: { classes: ['necromancer'], items: ['skull-totem'] } },
  { id: 'on-a-roll', name: 'On a Roll', description: 'Win 5 fights in a row.', condition: { kind: 'winStreak', count: 5 }, reward: { classes: ['monk'], items: ['prayer-beads'] } },
  { id: 'full-roster', name: 'Full Roster', description: 'Win a fight with 5 different classes.', condition: { kind: 'winWithDistinctClasses', count: 5 }, reward: { classes: ['bard'], items: ['enchanted-lute'] } },
  { id: 'lifeline', name: 'Lifeline', description: 'Heal or shield 400 HP in one fight.', condition: { kind: 'healInFight', amount: 400, shields: true }, reward: { classes: ['druid'], items: ['oak-heart'] } },
  { id: 'by-a-thread', name: 'By a Thread', description: 'Win a run with 1 life left.', condition: { kind: 'completeRun', maxLives: 1 }, reward: { classes: ['warlock'], items: ['cursed-tome'] } },
  // Post-M7 classes (Brandon: every new class is unlockable).
  { id: 'spellsword', name: 'Spellsword', description: 'Win a fight with a Warrior and a Mage, both level 5 or higher.', condition: { kind: 'winWithClasses', classIds: ['warrior', 'mage'], minLevel: 5 }, reward: { classes: ['runeblade'] } },
  { id: 'last-one-standing', name: 'Last One Standing', description: 'Win a fight with only one of your units still standing.', condition: { kind: 'lastStanding', survivors: 1 }, reward: { classes: ['dark-knight'], synergies: ['rivals'] } },
  { id: 'seasoned', name: 'Seasoned', description: 'Reach round 10.', condition: { kind: 'reachRound', round: 10 }, reward: { classes: ['engineer'], items: ['gearbox'] } },

  // Items.
  { id: 'wipeout', name: 'Wipeout', description: 'Kill 3 enemies at once.', condition: { kind: 'killsAtOnce', count: 3 }, reward: { items: ['executioners-axe'] } },
  { id: 'untouchable', name: 'Untouchable', description: 'Win a fight in round 8 or later without losing a unit.', condition: { kind: 'flawlessWin', minRound: 8 }, reward: { items: ['mirror-shard'] } },
  { id: 'nest-egg', name: 'Nest Egg', description: 'Go into a fight with 15 gold unspent.', condition: { kind: 'goldInHand', gold: 15 }, reward: { items: ['gamblers-coin'] } },
  { id: 'against-the-odds', name: 'Against the Odds', description: 'Win a fight after 3 of your units fell.', condition: { kind: 'winAfterLosses', allies: 3 }, reward: { items: ['phoenix-feather'] } },
  { id: 'army-of-one', name: 'Army of One', description: 'Summon 3 units in one fight.', condition: { kind: 'summonsInFight', count: 3 }, reward: { items: ['soulstone'] } },
  { id: 'flawless', name: 'Flawless', description: 'Win a run without losing a fight.', condition: { kind: 'completeRun', flawless: true }, reward: { items: ['war-banner'] } },
  { id: 'blitz', name: 'Blitz', description: 'Win a fight in 15 ticks or less.', condition: { kind: 'winInTicks', ticks: 15 }, reward: { items: ['quicksilver-rapier', 'winged-sandals'] } },
  { id: 'armed-to-the-teeth', name: 'Armed to the Teeth', description: 'Go into a fight with 5 units holding 2 items each.', condition: { kind: 'fullyEquipped' }, reward: { items: ['vampiric-fang'] } },
  { id: 'collector', name: 'Collector', description: 'Reach 10 different tertiary classes.', condition: { kind: 'tertiaryDiscovered', count: 10 }, reward: { items: ['hourglass'] } },

  // Synergies.
  { id: 'champions', name: 'Champions', description: 'Win a fight with 3 Light (divine) units.', condition: { kind: 'winWithUnits', filter: LIGHT, count: 3 }, reward: { synergies: ['light'] } },
  { id: 'darkness-rising', name: 'Darkness Rising', description: 'Win a fight with 3 Dark (shadow or occult) units.', condition: { kind: 'winWithUnits', filter: DARK, count: 3 }, reward: { synergies: ['dark'] } },
  { id: 'in-harmony', name: 'In Harmony', description: 'Have 4 synergies active at once.', condition: { kind: 'activeSynergies', count: 4 }, reward: { synergies: ['twilight'] } },

  // Perks.
  { id: 'first-steps', name: 'First Steps', description: 'Reach round 5.', condition: { kind: 'reachRound', round: 5 }, reward: { perks: ['recruiter'] } },
  { id: 'try-again', name: 'Try, Try Again', description: 'Lose a run.', condition: { kind: 'loseRun' }, reward: { perks: ['extra-life'] } },
  { id: 'ascended', name: 'Ascended', description: 'Reach level 7 with a unit.', condition: { kind: 'reachLevel', level: 7 }, reward: { perks: ['veteran'] } },
  { id: 'pinnacle', name: 'Pinnacle', description: 'Reach level 10 with a unit.', condition: { kind: 'reachLevel', level: 10 }, reward: { perks: ['drill-sergeant'] } },
  { id: 'regular', name: 'Regular', description: 'Win 3 runs.', condition: { kind: 'runsCompleted', count: 3 }, reward: { perks: ['mentor'] } },
  { id: 'old-soldier', name: 'Old Soldier', description: 'Win 100 fights in total.', condition: { kind: 'fightsWon', count: 100 }, reward: { perks: ['quartermaster'] } },
  { id: 'window-shopper', name: 'Window Shopper', description: 'Buy 5 locked shop offers in one run.', condition: { kind: 'lockedBought', count: 5 }, reward: { perks: ['layaway'] } },
  { id: 'penny-pincher', name: 'Penny Pincher', description: 'Go into 3 fights in a row with 10 gold unspent.', condition: { kind: 'goldStreak', gold: 10, rounds: 3 }, reward: { perks: ['haggler'] } },
  { id: 'climber', name: 'Climber', description: 'Win a run on tier 1 or higher.', condition: { kind: 'completeRun', minTier: 1 }, reward: { perks: ['second-wind'] } },
  { id: 'climbing', name: 'Still Climbing', description: 'Win a run on tier 2 or higher.', condition: { kind: 'completeRun', minTier: 2 }, reward: { perks: ['tutor'] } },
  { id: 'perkception', name: 'Perkception', description: 'Win a run on tier 3 or higher.', condition: { kind: 'completeRun', minTier: 3 }, reward: { perkSlots: 1 } },
  { id: 'high-climber', name: 'High Climber', description: 'Win a run on tier 5 or higher.', condition: { kind: 'completeRun', minTier: 5 }, reward: { perks: ['investor'] } },
  { id: 'perkception-2', name: 'Perkception II', description: 'Win a run on tier 7 or higher.', condition: { kind: 'completeRun', minTier: 7 }, reward: { perkSlots: 1 } },
  { id: 'legend', name: 'Legend', description: 'Win a run on tier 10.', condition: { kind: 'completeRun', minTier: 10 }, reward: {} },
];

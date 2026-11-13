// Game terms, explained in one or two lines. Terms with a `pattern` become
// tappable wherever rules text is shown (see Rules.tsx); the rest appear only
// on the glossary screen.

export interface Term {
  id: string;
  term: string;
  text: string;
  /** Matches the term in rules text. Omit for terms too common to link. */
  pattern?: RegExp;
}

export const GLOSSARY: readonly Term[] = [
  {
    id: 'turns',
    term: 'SPD and turns',
    text: 'Every tick, each unit adds its SPD to an action gauge. At 100 it takes a turn. Twice the SPD means twice as many turns.',
  },
  {
    id: 'cooldown',
    term: 'Every Nth turn',
    text: 'On every Nth of its own turns, a unit uses its ability instead of a basic attack. Cooldown reductions from talents and items make it come more often, down to every turn.',
  },
  {
    id: 'granted',
    term: 'New ability',
    text: 'Some talents grant a second ability with its own cadence. A unit still acts once per turn: if several abilities are ready, the one that has waited longest goes first and the others wait. Cooldown reductions apply to all of them.',
    pattern: /\bnew ability\b/i,
  },
  {
    id: 'classes',
    term: 'Advanced and tertiary classes',
    text: 'At level 3 a unit picks one of two advanced classes, and at level 7 one of two tertiary classes. Each replaces the ability and talent pool and adds a passive; passives from earlier classes stay.',
  },
  {
    id: 'def',
    term: 'DEF',
    text: 'Reduces damage taken: damage × 10 ÷ (10 + DEF). 10 DEF halves damage. Every hit deals at least 1.',
  },
  {
    id: 'rows',
    term: 'Front row and back row',
    text: 'Most attacks hit the front row first. The back row is only exposed once the front row has fallen.',
    pattern: /\b(?:front|back)[ -]row\b/i,
  },
  {
    id: 'nearest',
    term: 'Nearest enemy',
    text: 'The closest enemy in the front-most row that still has a living unit.',
    pattern: /\bnearest\b/i,
  },
  {
    id: 'weakest',
    term: 'Weakest',
    text: 'The enemy with the lowest current HP.',
    pattern: /\bweakest\b/i,
  },
  {
    id: 'strongest',
    term: 'Strongest',
    text: 'The enemy with the highest ATK.',
    pattern: /\bstrongest\b/i,
  },
  {
    id: 'wounded',
    term: 'Most wounded ally',
    text: 'The ally (or the unit itself) with the lowest HP as a share of its max HP.',
    pattern: /\bmost wounded\b/i,
  },
  {
    id: 'taunt',
    term: 'Taunt',
    text: "Enemies' single-target attacks and abilities must pick a taunting unit. Area damage and splash still hit everyone. Lasts for the taunter's next N turns.",
    pattern: /\btaunt(?:s|ing|ed)?\b/i,
  },
  {
    id: 'shield',
    term: 'Shield',
    text: 'Absorbs damage before HP. Shields stack and last until used up.',
    pattern: /\bshield(?:s|ed|ing)?\b/i,
  },
  {
    id: 'splash',
    term: 'Splash',
    text: "Also hits the target's row neighbours for the stated share of the damage.",
    pattern: /\bsplash(?:es)?\b/i,
  },
  {
    id: 'pierce',
    term: 'Piercing',
    text: 'Ignores DEF. Shields still absorb it.',
    pattern: /\bpierc(?:e|es|ing)\b/i,
  },
  {
    id: 'true',
    term: 'True damage',
    text: 'Ignores both DEF and shields. Used by sudden death and by abilities that cost HP.',
    pattern: /\btrue damage\b/i,
  },
  {
    id: 'reach',
    term: 'Reach',
    text: 'Melee units in the back row deal 50% damage while an ally stands in their front row. Reach removes that penalty.',
    pattern: /\breach\b/i,
  },
  {
    id: 'power',
    term: 'Ability power',
    text: "Scales the unit's ability damage, heals, shields and summons. 130% means 30% stronger.",
    pattern: /\bability power\b/i,
  },
  {
    id: 'lifesteal',
    term: 'Lifesteal',
    text: 'Heals the unit for a share of the damage it deals.',
    pattern: /\blifesteal\b/i,
  },
  {
    id: 'bloodied',
    term: 'Bloodied',
    text: 'The first time a unit drops below 50% HP and survives. "When bloodied" effects fire once per fight.',
    pattern: /\bbloodied\b/i,
  },
  {
    id: 'summon',
    term: 'Summon',
    text: "Puts a temporary unit in an empty slot on your side. If every slot is full, the ability's fallback effect happens instead. Summons are gone after the fight.",
    pattern: /\bsummon(?:s|ed)?\b/i,
  },
  {
    id: 'buffs',
    term: 'Gains and losses',
    text: '"Gain +2 ATK" and "loses 1 DEF" last for the rest of the fight. Stats never drop below 0.',
  },
  {
    id: 'sudden-death',
    term: 'Sudden death',
    text: 'From tick 300, every unit takes true damage every 10 ticks: 5% of max HP, then 10%, 15% and so on. The side that keeps more of its HP wins.',
    pattern: /\bsudden death\b/i,
  },
  {
    id: 'synergy',
    term: 'Synergy',
    text: 'Classes share tags (martial, arcane, guardian…). Enough units with the same tag unlock a bonus for the party or for those units.',
    pattern: /\bsynerg(?:y|ies)\b/i,
  },
  {
    id: 'stat-points',
    term: 'Stat points',
    text: 'Earned on every level-up (more at levels 3 and 5). One point buys +3 HP or +1 ATK, DEF or SPD. Unspent points go on the recommended spread when you fight.',
  },
  {
    id: 'revive',
    term: 'Rise again / survive',
    text: 'The first time the unit would fall, it stays up at a share of its max HP instead. Each such effect works once per fight.',
    pattern: /\b(?:rise again|survive at)\b/i,
  },
  {
    id: 'execute',
    term: 'Below half HP',
    text: 'Bonus damage against enemies under 50% of their max HP: good for finishing wounded targets.',
    pattern: /\bbelow half HP\b/i,
  },
  {
    id: 'light-dark',
    term: 'Light and Dark',
    text: 'Light units are divine; Dark units are shadow or occult. Advanced and tertiary classes can change which side a unit is on. Some synergies count them.',
    pattern: /\b(?:Light|Dark) (?:units?|\(divine\)|\(shadow or occult\))/,
  },
  {
    id: 'signature',
    term: 'Signature item',
    text: 'Each tertiary class has one. The shop offers it once, when a unit reaches that class: buy or lock it before you reroll or fight, or it\'s gone. Only that class can equip it, and a unit holds one at most.',
    pattern: /\bsignature items?\b/i,
  },
  {
    id: 'broken-limb',
    term: 'Broken Limb',
    text: 'A stacking status from the Mercenary: −1 SPD per broken limb, up to 4, for the rest of the fight. The Headsman executes enemies with 4; the Maimer saps a stat with each.',
    pattern: /\b(?:broken )?limbs?\b/i,
  },
  {
    id: 'weapons',
    term: 'Weapons',
    text: 'Swords, spears, bows, axes, daggers, hammers and gauntlets. Anyone can use them; the Mercenary scales with how many he carries, and the Oathsworn and Walking Armory get extra weapon-only slots.',
    pattern: /\bper weapon\b|\bweapons? only\b/i,
  },
  {
    id: 'crit',
    term: 'Critical hit',
    text: 'A hit that deals double damage. Only the Oathsworn line lands them. Damage over time never crits.',
    pattern: /\bcritical(?: hit)?\b/i,
  },
  {
    id: 'consumable',
    term: 'Consumable',
    text: 'Every unit has one consumable slot beside its items. A consumable fires once, when its trigger happens, and is then used up; if its trigger never happens, it stays for the next fight. Buying a new one replaces the old. The shop always offers one, and won fights sometimes drop one for free.',
    pattern: /\bconsumables?\b/i,
  },
  {
    id: 'rules-mode',
    term: 'Rules mode',
    text: 'A run type where every class has a kit of skills and you write each unit’s priority list. Each turn the unit uses the first rule whose skill is ready and whose condition holds for its target, else it basic-attacks. Order is the strategy: put the finisher on top with a condition, the setup below it.',
    pattern: /\brules mode\b|\bpriority list\b/i,
  },
  {
    id: 'affliction',
    term: 'Affliction',
    text: 'Rules mode and the Shaman: a harmful status such as Frostbite, Weakness, Brittle, Hush, Rot, Fever, Bind, Bleed, Poison, Burn, Marked, Slowed, Rooted or Runes. Most last a few turns and are refreshed by reapplying. Each counts once toward "per affliction" damage, whoever applied it, so an affliction team stacks them for its finishers. Cures remove them one at a time.',
    pattern: /\bafflictions?\b/i,
  },
  {
    id: 'hush-bind',
    term: 'Hush and Bind',
    text: 'Hush stops skills and abilities (only basic attacks), Bind costs the target its next turn. The Spiritbinder kills outright once its victim has Frostbite, Weakness and Hush at once (a boss loses 25% of its max HP instead). With the Soulreaver’s Soulshackle Totem (rules mode) or Chain of Souls (classic), Bind alone is enough.',
    pattern: /\bHush\b|\bBind\b/,
  },
  {
    id: 'hexes',
    term: 'Frostbite, Weakness, Brittle and other hexes',
    text: 'Shaman afflictions, each lasting a few of the victim’s turns: Frostbite −3 SPD, Weakness −3 ATK, Brittle −3 DEF, Rot damage each turn (up to 3 stacks), Fever halves heals on it, Marked takes +25% damage. Reapplying refreshes them.',
    pattern: /\b(?:frostbite|weakness|weakened|brittle|rot|fever|marked)\b/i,
  },
  {
    id: 'renewal',
    term: 'Renewal',
    text: 'The Sylvan’s healing over time: at the start of each of its turns the unit heals (70% of the Sylvan’s ATK; Greater Renewal 110%), for 3 turns. Reapplying refreshes it; it doesn’t stack.',
    pattern: /\b(?:greater )?renewal\b/i,
  },
  {
    id: 'thorns',
    term: 'Thorns',
    text: 'For 3 turns, a melee enemy that hits the unit takes damage back (40% of the Thornweaver’s ATK), ignoring DEF.',
    pattern: /\bthorns\b/i,
  },
  {
    id: 'rooted',
    term: 'Rooted',
    text: 'An affliction from the Sylvan: −3 SPD for 2 of the victim’s turns.',
    pattern: /\broot(?:ed|s)?\b/i,
  },
  {
    id: 'tribe',
    term: 'Strength of the Tribe',
    text: 'A synergy for different Tribe classes (the Berserker line, the Beastmaster line, Druid, Shaman and Sylvan; doubles don’t count): every ally starts the fight with a burst of SPD that wears off. 3 classes: +3 SPD until tick 20; 4: +5 until tick 30; 5: +8 until tick 40.',
    pattern: /\bstrength of the tribe\b/i,
  },
  {
    id: 'story',
    term: 'Story mode',
    text: 'A fixed war band built up over a story’s missions. Each mission is a map: pick your path through fights, elites, shops, events and camps to the boss. The story gives your heroes (no recruits), and running out of lives restarts the mission. Finishing a story unlocks its classes for normal runs and the story’s next tier.',
    pattern: /\bstory mode\b/i,
  },
  {
    id: 'ladder',
    term: 'Ladder tiers',
    text: 'Winning a run unlocks the next difficulty tier. Each tier adds one modifier on top of all the earlier ones (tier 15 has all fifteen).',
  },
  {
    id: 'elite',
    term: 'Elites and bosses',
    text: 'From ladder tier 7, one enemy per fight may be an Elite with +20% HP and ATK. From tier 8, rounds 5, 10 and 15 bring a boss with its own passive; on tier 10 bosses also cast a second ability. From tier 11 losing the round 10 or 15 boss costs 2 lives, and from tier 13 unique bosses with their own classes take over.',
  },
  {
    id: 'perks',
    term: 'Starting perks',
    text: 'Small bonuses picked at the start of a run from a few offered. The Perkception achievements let you keep more than one.',
  },
  {
    id: 'daily',
    term: 'Daily run',
    text: 'A run built from the date: same seed, tier and perk offer for everyone, with everything unlocked. One attempt per day. Dailies don’t count toward achievements or unlocks.',
  },
  {
    id: 'statuses',
    term: 'Stacking statuses',
    text: 'Runes, Dread, Blight, Corruption, Hellfire, Broken Limbs and the like stack on a unit; the stack count shows on its card during a fight. The latest unit to apply one owns it.',
  },
  {
    id: 'rune',
    term: 'Runes and detonation',
    text: 'Runeblades carve Runes into enemies. At 5 Runes they detonate: the Runes clear and the Runeblade’s detonation effects fire on that enemy. Extra Runes past 5 carry over.',
    pattern: /\b(?:runes?|detonat(?:e|es|ion|ions))\b/i,
  },
  {
    id: 'dread',
    term: 'Dread',
    text: 'Each stack is −1 ATK for the rest of the fight, up to 2 stacks per unit.',
    pattern: /\bdread\b/i,
  },
  {
    id: 'dot',
    term: 'Damage over time',
    text: 'Corruption, Hellfire and Searing deal damage at the start of each of the afflicted unit’s turns, per stack, ignoring DEF. They last 3 of its turns; reapplying refreshes the timer.',
    pattern: /\b(?:corruption|hellfire|sear(?:s|ing)?)\b/i,
  },
  {
    id: 'blight',
    term: 'Blight',
    text: 'The Cultist’s damage over time (up to 5 stacks, for 3 of the afflicted unit’s turns). Every tick also heals the Cultist’s most wounded ally for half the damage dealt, while that Cultist is alive.',
    pattern: /\bblight\b/i,
  },
  {
    id: 'missing-hp',
    term: 'Missing HP',
    text: 'Max HP minus current HP. Dark Knights hit harder the more HP they have lost.',
    pattern: /\bmissing HP\b/i,
  },
  {
    id: 'lock',
    term: 'Locking offers',
    text: 'Lock a shop offer (🔒) and it stays through rerolls and into the next round until you buy it or unlock it. Unlocking is free but gives no refund.',
  },
];

const LINKED = GLOSSARY.filter((t): t is Term & { pattern: RegExp } => t.pattern !== undefined);
const ANY = new RegExp(LINKED.map((t) => `(${t.pattern.source})`).join('|'), 'gi');

export type Segment = string | { term: Term; text: string };

/** Split rules text into plain strings and glossary terms. */
export function segmentRules(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(ANY)) {
    const term = LINKED.find((t) => new RegExp(`^(?:${t.pattern.source})$`, 'i').test(m[0]));
    if (!term) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ term, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

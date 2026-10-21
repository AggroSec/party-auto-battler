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

import { maxLevel, type RunConfig } from '../../engine/run/index.ts';
import { resetTips, setTipsEnabled, tipsEnabled } from './tips.ts';
import { useState } from 'react';
import type { Game } from './useGame.ts';

interface Section {
  id: string;
  title: string;
  body: (c: RunConfig) => React.ReactNode;
}

/**
 * The in-depth guide (issue #28): for players new to the game and to the
 * genre. Short sections, each open on its own, so it reads well on a phone.
 */
const SECTIONS: Section[] = [
  {
    id: 'genre',
    title: 'New to auto-battlers? Start here',
    body: () => (
      <>
        <p>
          In an auto-battler you don&apos;t control the fight. <strong>You win between fights</strong>: by choosing who to recruit, where they stand, what they
          carry and how they grow. Then you press Fight and watch your decisions play out.
        </p>
        <p>
          Each run is a series of rounds. Every round has a <strong>shop</strong> (spend gold to build your party) and a <strong>fight</strong> (against an
          enemy party that gets stronger every round). Losing costs a life; win enough fights before your lives run out and you win the run.
        </p>
        <p>Runs are meant to be replayed: every shop is random, so no two parties are the same. Try ideas, lose, and try again.</p>
      </>
    ),
  },
  {
    id: 'first-run',
    title: 'Your first run, step by step',
    body: (c) => (
      <ol>
        <li>
          <strong>Recruit three or four units.</strong> Click a recruit card in the shop (or drag it onto the board). Each costs {c.unitCost} gold, and you start
          with {c.startingGold}.
        </li>
        <li>
          <strong>Mix roles.</strong> A sturdy front-liner (Warrior), a damage dealer (Rogue, Ranger or Mage) and a healer (Cleric) beat three of the same.
        </li>
        <li>
          <strong>Press Fight.</strong> Watch who hits whom. The fight report afterwards shows damage dealt and taken for every unit.
        </li>
        <li>
          <strong>Spend your new gold.</strong> Fill the board up to five, then buy <em>training</em> (XP) and <em>items</em> for your best units.
        </li>
        <li>
          <strong>Make the level-up choices.</strong> A ⭐ on a unit means it leveled up: click it to choose. Level {c.progression.advanceLevel} is the big one, an
          advanced class.
        </li>
        <li>Repeat. Don&apos;t worry about losing a fight or two early: you have {c.startingLives} lives.</li>
      </ol>
    ),
  },
  {
    id: 'shop',
    title: 'The shop, gold and interest',
    body: (c) => (
      <ul>
        <li>
          You get {c.baseIncome} gold every round, plus <strong>interest</strong>: +1 for every {c.interestPer} gold you save, up to +{c.maxInterest}. Saving a
          little pays off; hoarding doesn&apos;t.
        </li>
        <li>Win or loss streaks give bonus gold too, so a rough start isn&apos;t the end.</li>
        <li>
          <strong>Reroll</strong> ({c.rerollCost}g) for a fresh shop. <strong>Lock</strong> ({c.lockCost}g) keeps an offer through rerolls and into the next round, so you
          can save up for it.
        </li>
        <li>Selling a unit refunds {c.sellRefund} gold (plus its items). Selling is fine: replace weak units as the run goes on.</li>
        <li>Training gives XP to one unit of that class. Items go on a unit: click the unit first, then the item (or drag the item onto it).</li>
      </ul>
    ),
  },
  {
    id: 'board',
    title: 'Positioning and targeting',
    body: () => (
      <ul>
        <li>The board has a front row of 3 and a back row of 2. Drag units to move them.</li>
        <li>Enemies with melee attacks hit your front row first, so put your toughest units there.</li>
        <li>Back-row units are safe until the front row falls. Put healers and ranged damage there.</li>
        <li>A melee unit stuck in the back row (behind living allies) hits at half strength, unless it has reach. That&apos;s allowed: it&apos;s a trade-off.</li>
        <li>Some attacks look for the weakest or the back row instead of the nearest enemy; class descriptions say so.</li>
      </ul>
    ),
  },
  {
    id: 'combat',
    title: 'Stats and how a fight works',
    body: () => (
      <ul>
        <li>
          <strong>HP</strong>: how much damage a unit can take. <strong>ATK</strong>: how hard it hits (abilities scale with it). <strong>DEF</strong>: reduces
          damage (10 DEF halves it). <strong>SPD</strong>: how often it acts.
        </li>
        <li>Every unit has an action gauge that fills by its SPD; at full it takes a turn. Fast units act more often.</li>
        <li>On its turn a unit uses its ability if it&apos;s ready (every Nth turn), otherwise it basic-attacks.</li>
        <li>Passives and items add triggers: things that happen at the start of combat, when hit, on a kill and so on.</li>
        <li>Long fights hit sudden death: everyone takes growing damage until one side falls.</li>
      </ul>
    ),
  },
  {
    id: 'levels',
    title: 'Levels, talents and classes',
    body: (c) => (
      <ul>
        <li>Units gain XP from every fight (more for a win) and from training, up to level {maxLevel(c.progression)}.</li>
        <li>Every level-up offers a choice of talents and gives stat points. Spend them yourself, or leave them: they go on the recommended spread before the fight.</li>
        <li>
          At level {c.progression.advanceLevel} a unit picks one of two <strong>advanced classes</strong>, and at level {c.progression.ascendLevel} one of two{' '}
          <strong>tertiary classes</strong>. Each changes its ability and the talents it&apos;s offered. This is where builds come from.
        </li>
        <li>Reaching a tertiary class offers its signature item once: buy or lock it before you reroll or fight.</li>
      </ul>
    ),
  },
  {
    id: 'items',
    title: 'Items and consumables',
    body: (c) => (
      <ul>
        <li>Each unit carries up to {c.progression.maxItemsPerUnit} items. Some items are tied to a class and give it an extra bonus.</li>
        <li>
          Every unit also has a <strong>consumable</strong> slot. A consumable fires once, when its trigger happens (start of combat, dropping below half HP, an ally
          falling), and is then used up. If its trigger never happens, it stays for the next fight.
        </li>
        <li>The shop always has a consumable, and won fights sometimes drop a free one into the next shop.</li>
      </ul>
    ),
  },
  {
    id: 'synergies',
    title: 'Synergies',
    body: () => (
      <ul>
        <li>Classes have tags (martial, arcane, divine, shadow…). Two or more units with a tag switch on a synergy bonus for them.</li>
        <li>Some synergies want a mix instead: a guardian, a healer and a damage dealer, or many different classes.</li>
        <li>The synergy list in the shop shows what&apos;s active and what you&apos;re one unit away from.</li>
      </ul>
    ),
  },
  {
    id: 'rules',
    title: 'Rules mode',
    body: () => (
      <>
        <p>
          Pick <strong>Rules mode</strong> when you start a run. Every class has a kit of skills instead of one ability, and you write each unit&apos;s priority list.
          Click a unit to edit it.
        </p>
        <ul>
          <li>Each turn the unit goes down its list and uses the first rule whose skill is ready and whose condition holds. If none can, it basic-attacks.</li>
          <li>A rule is a skill, a target (nearest, most afflicted, weakest, most wounded ally…) and an optional condition (target has 3+ afflictions, lacks Frostbite, self below 50% HP…).</li>
          <li>
            <strong>Order is the strategy.</strong> Put the finisher on top with a condition, and the setup below it. For example, a Shaman: Spirit Lash if the target has
            3+ afflictions; Frost Hex if it lacks Frostbite; Wither if it lacks Weakness.
          </li>
          <li>
            <strong>Afflictions</strong> count once each toward &quot;per affliction&quot; damage, whoever applied them, so a whole party can feed one finisher. Enemy healers
            cure them, so keep them up.
          </li>
          <li>Each class splits at level 3 and 7 like in classic runs. Talents are skill augments: more power or a shorter cooldown for one skill.</li>
          <li>Reset to class defaults any time. Enemies fight by their class defaults.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'meta',
    title: 'Achievements, the ladder and dailies',
    body: () => (
      <ul>
        <li>New players start with five classes. Achievements unlock more classes, items, synergies and starting perks (see the Collection).</li>
        <li>Winning a run unlocks the next ladder tier. Each tier adds a modifier on top of the earlier ones, up to tier 15.</li>
        <li>Starting perks are small boosts you pick before a run. Favored classes are guaranteed in the first shops.</li>
        <li>The daily run has the same seed for everyone, and one attempt a day.</li>
      </ul>
    ),
  },
];

/** The in-depth guide, with the one-time tips switch. */
export function GuideScreen({ game }: { game: Game }) {
  const config = game.baseCtx.config;
  const [tips, setTips] = useState(tipsEnabled);
  return (
    <div className="screen guide-screen">
      <header className="setup-head">
        <button type="button" onClick={game.toTitle}>
          ← Back
        </button>
        <h1>How to play</h1>
      </header>
      {SECTIONS.map((s, i) => (
        <details key={s.id} className="setup-section guide-section" open={i === 0}>
          <summary>
            <h2>{s.title}</h2>
          </summary>
          <div className="guide-body">{s.body(config)}</div>
        </details>
      ))}
      <section className="setup-section">
        <h2>Tips</h2>
        <label>
          <input
            type="checkbox"
            checked={tips}
            onChange={(e) => {
              setTipsEnabled(e.target.checked);
              setTips(e.target.checked);
            }}
          />{' '}
          Show one-time tips during runs
        </label>
        <button type="button" onClick={resetTips}>
          Show every tip again
        </button>
      </section>
    </div>
  );
}

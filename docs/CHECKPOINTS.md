# Checkpoints

Milestone summaries, newest first. Each one becomes the body of that milestone's pull request.

## Milestone 3 — Builds (2026-10-17)

### What was built

**Progression**
- Units earn XP from every fight: +2 for a win, +1 for a loss or draw.
- Levels 1–5 at 0 / 2 / 5 / 9 / 14 XP. Each level-up rolls **weighted random stat growth** per class, your direction: a Rogue leans SPD, a Warrior leans HP and DEF.
- **Every level-up is a choice:**
  - Level 2: pick 1 of 3 base talents.
  - Level 3: advance into 1 of 2 advanced classes. This changes the ability, tags, stats and passive.
  - Levels 4–5: pick 1 of 3 talents from the advanced class's pool.
- You can't fight until your choices are made, but you can keep shopping meanwhile.

**Content (all data, in `src/data/`)**
- **12 advanced classes**, two per class: Knight/Berserker, Assassin/Duelist, Pyromancer/Chronomancer, Priest/Inquisitor, Sharpshooter/Beastmaster, Lich/Plaguelord.
- **72 talents:** 4 per base class and 4 per advanced class.
- **18 items**, up to 2 per unit. Anyone can equip anything, and 10 are class-tied: the tied class gets an extra effect (Long Spear + Warriors, Spellbook + Mages, …).
- **8 synergies** from class tags, including "frontline + healer" (Vanguard) and an Adventuring Party bonus for 4–5 different classes.
- Reach items and talents (Long Spear, Polearm Training, Shadowstep, Smoke Cloak for Rogues, Duelist) give builds a way around the back-row melee penalty (#2).

**Shop and training (#5, your call):** 4 unit slots + 2 extra slots. Each extra slot rolls an item, or **class-specific training** (+2 XP for one unit of a class on your board) about a third of the time. You reroll to chase training for the unit you want. No merging.

**Enemies** level up, advance, take talents and carry items like you do, with synergies. That gives them build variety and puts every piece of content into play on both sides. Their level and item curves are fractional, so difficulty ramps smoothly.

**Engine additions**
- Traits: reach, lifesteal, ability power.
- Effects: debuff, cooldown (haste or delay).
- Triggers: `onAbility`, `onBloodied`.
- A single `UnitModifier` shape behind talents, items, advanced classes and synergies.

**Simulator (`npm run sim`)**
- Four bots: random, sensible, greedy, synergy-focused. All of them shop, target items and training, and make level-up choices.
- The report covers completion, wins, average rounds, average unit level, unspent gold, tick-cap hits, stuck runs and the win rate by round.
- Pick-to-win rates for every class, advanced class, item, talent and synergy, with the brief's 65%/35% outlier flags.
- A new **round-adjusted lift** column. Raw rates are biased by *when* things appear, so I balanced on lift.

**Debug UI (`npm run dev` → Run):**
- Level-up choice cards.
- A shop showing item effects and class bonuses.
- Click a unit for its full build: final stats including synergies, ability, talents and items, plus buttons to move items and sell.
- Active synergies, and explicit Move buttons for units and items.

**Tests:** 171, up from 129. They cover every new effect, trait and trigger; build resolution and stacking; item class bonuses; synergy tiers and tag changes on advancing; XP thresholds and growth rolls; choice queues, including deferred post-advance options; items, training, selling and moving; enemy development; integrity of all build content (every talent in exactly one pool, every reference valid); simulator determinism; the lift maths; and a real-content end-to-end run.

### Fixed during development

- **Deferred talent choices could vanish:** resolving a level-2 talent wiped a queued level-4 choice that was waiting on the advanced class. A new test caught it before commit, and it's fixed.

### What to playtest (and how)

1. `npm install`, then `npm run dev`. The **Run** tab opens by default.
2. Play a few runs (change the seed for different shops and enemies). Worth checking:
   - **Level-ups:** after your first win, a ⭐ panel asks for a talent. At level 3 you choose an advanced class. Are the choices interesting, or are some obvious?
   - **Builds:** click a unit to see its final stats. Try a class-tied item on its class (the bonus shows in gold) and on another class.
   - **Back-row melee:** put a Warrior in the back with a Long Spear, or take Polearm Training. It should hit at full strength.
   - **Synergies:** two Warriors gives Shield Wall; a Warrior plus a Cleric gives Vanguard. Advancing a Warrior to Knight adds divine.
   - **Training:** it only appears for classes you own. Reroll to chase it.
   - **Difficulty:** rounds 1–4 are easy, then it ramps. Rounds 11+ are very hard for everyone (see known issues). Does that feel right?
3. `npm run sim` prints all the tables in about 35 seconds.

### Known issues / open questions

- **Late-game wall:** from round 11, every bot wins only about 20% (then 7%, 4%), regardless of skill. Comeback runs hit a hard final hurdle. That's a balance question for M5, unless you want it changed sooner.
- **Accelerate** (Chronomancer talent) is the strongest pick left, at +8 lift. Queued for the M5 balance pass.
- **Three raw outliers** (Call of the Wild, Shadow Pact, Shield Wall tier 1) are an early-round artefact; their round-adjusted lift is only +1 to +6.
- **The greedy bot isn't smarter than the sensible one.** Its power estimate undervalues effects. It's useful as a foil, and could be improved in M5.
- **Necromancer** is still locked (meta unlocks are M5). Enemies already use it.
- The debug UI is still plain: no drag-and-drop, icons or animation (M4).

### Simulator balance numbers

2,000 full runs per bot, seed `m3`:

| Bot | Completed | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold |
|---|---:|---:|---:|---:|---:|---:|
| random | 5.9% | 3.87 | 8.6 | 44.9% | 2.99 | 3.4 |
| sensible | 24.4% | 7.89 | 11.8 | 66.8% | 3.64 | 2.5 |
| greedy | 21.5% | 7.75 | 11.8 | 65.6% | 3.64 | 3.1 |
| synergy | 15.1% | 6.68 | 11.1 | 60.6% | 3.49 | 1.9 |

Sensible-bot win rate by round: 94, 100, 98, 96, 82, 72, 71, 65, 53, 39, 19, 7, 5, 2%.

Round-adjusted lift ranges:

| Category | Lift range |
|---|---|
| Classes | −1.7 to +2.2 |
| Advanced classes | −2.9 (Priest) to +5.3 (Inquisitor) |
| Items | −2.3 to +3.6 |
| Synergies | −2.7 to +5.9 |
| Talents | −3.2 to +8.2 |

0 tick-cap hits, 0 stuck runs. Full tables are in [BALANCE.md](BALANCE.md).

## Milestone 2 — Run loop (2026-10-17)

### What was built

**Your M1 design calls**
- **Sudden death (#1):** from tick 300, a pulse every 10 ticks deals true damage to every unit, growing 5% → 10% → 15%… of max HP. Tick-cap timeouts dropped from 0.15% to 0, and the longest fight is now about 370 ticks.
- **Back-row melee (#2):** Warriors and Rogues in the back row deal 50% damage while their front row stands, and full damage once it falls. Units now declare melee or ranged. #2 stays open as you asked.

**Run loop (`src/engine/run/`)** is a pure, deterministic reducer over plain JSON state, so saves are ready for later:
- Play until **10 wins** (complete) or **0 lives** (over), starting with 5 lives. Draws count as neither. Both were your calls.
- **Shop:** 4 random units at 3g each, reroll for 1g, sell for a 1g refund, and a free refresh every round.
- **Board:** units auto-place into their preferred row on purchase, and can be moved or swapped anywhere.
- **Economy:** 10 starting gold, then 5 per round, plus interest (1 per 5 unspent, max 2), plus a streak bonus (+1 at 2 in a row, +2 at 4, for wins *or* losses).
- **Enemies:** six archetypes (Bandit Brute, Cutthroat, Poacher, Hedge Mage, Cult Acolyte, Bonecaller) unlocking by round.
  - Party size grows 2 → 3 → 4 → 5 by round 4.
  - Stats start at 75% and grow each round (+3.75% HP, +2.75% ATK).
  - Each enemy depends only on seed + round, so rerolling can't change your next fight.
- All economy and enemy numbers live in `src/data/`.

**Simulator (`npm run sim`):** full runs with two bots (random and sensible). It reports completion rate, the wins distribution, the difficulty curve by round, unspent gold and per-class win rates. The M1 combat probe still runs alongside.

**Debug UI (`npm run dev`):** a new **Run** tab where you can play a whole run. It has the shop, a click-to-move board (back slots drawn between front lanes, matching targeting), fights with the event log and income breakdown, and a run-end banner. The M1 page lives on as **Combat lab**. I verified it by driving a full run in headless Chrome: no console errors.

**Tests:** 129, up from 73. New coverage:
- sudden death (timing, escalation, true damage, draws, no kill credit)
- the back-row penalty (on/off, abilities, ranged exempt)
- economy formulas
- board placement and moves
- every shop action and its error cases, plus input immutability
- win, loss and draw settlement, and run completion and defeat
- enemy generation (size, unlocks, scaling, placement, determinism)
- "rerolls don't change the enemy"
- same seed + actions → same run, and save/resume through JSON
- fair cross-side tie-breaks (coin flip, mirror matches about 50/50)
- simulator determinism and a UI render

### Fixed during review

- **Mirror matches were rigged for the player.** When units on both sides were ready on the same tick, the player always acted first. That won 78% of exact mirrors (Brandon's Warrior/Cleric mirror test was a flawless 5-0) and quietly inflated run results. Cross-side ties now go to a **seeded coin flip**, which keeps fights deterministic and makes mirrors about 50/50. A regression test guards it.
- **Enemy growth retuned** (+4%/+3% → +3.75%/+2.75% per round) to restore the intended ~14% completion now that the player's hidden edge is gone.
- Recorded Brandon's direction for M3 levelling (weighted random stat gains per class) in DESIGN.md.

### What to playtest (and how)

1. `npm install`, then `npm run dev`. The **Run** tab opens by default.
2. Play a few runs (change the seed for a different shop and enemies). Worth checking:
   - **The early game is easy on purpose** (rounds 1–3 are near-certain wins). Does it feel too easy, or like a good warm-up?
   - **Difficulty bites around rounds 6–8.** Does the ramp feel fair?
   - **Back-row melee:** put a Rogue in the back and read the log. Its hits should be halved until your front row dies.
   - **Sudden death and fair mirrors:** in the Combat lab, set *both* sides to **Warrior ×3 front + Cleric ×2 back**, then try these seeds:
     - `a`: the fight stalls, ⏳ pulses start at tick 300, and both sides fall to the same pulse (a draw at tick 370).
     - `d`: the enemy wins at tick 238.
     - `demo`: the player wins at tick 238.

     Across 200 seeds this mirror goes 55 player / 53 enemy / 92 draw. Before the fix, the player won every time.
   - **Gold:** you'll notice gold piling up once your party is full. That's expected until M3 (see known issues).
3. `npm run sim` prints all the tables in about 5 seconds.

### Known issues / open questions

- **#5 (needs your call before M3):** should duplicate units merge or grant XP? My suggestion is merging as XP, which gives the shop a second purpose and a gold sink.
- **No gold sink yet:** bots enter combat with about 32–36 unspent gold. Items and progression (M3) are the planned sinks.
- **Choices matter only a little yet:** sensible beats random 14.4% to 11.3% on completion. Every unit is at base power until talents and items land in M3.
- **Enemy scaling is tuned for no player progression** and will be retuned in M3.
- **I edited CLAUDE.md:** the run-structure lines now say "until 10 wins or 0 lives" and that draws count as neither, matching your answers. Revert it if you'd rather keep the brief untouched.
- The debug UI is still deliberately plain: no drag-and-drop, animation or icons (M4).

### Simulator balance numbers

2,000 full runs per bot, seed `m2`:

| Bot | Completed (10 wins) | Avg wins | Avg rounds | Avg unspent gold |
|---|---:|---:|---:|---:|
| random | 11.3% | 6.45 | 11.0 | 32.2 |
| sensible | 14.4% | 7.66 | 12.2 | 36.1 |

Sensible-bot fight win rate by round: 99% (round 1), 100%, 100%, 99%, 89%, 79%, **56%** (round 7), 42%, 34%, 29%, 23%, 20%, 11%, 8% (round 14).

Combat probe (role-placed random 5v5): every class is between 44% and 57%, with no outliers, 0 timeouts and a 0% draw rate. Full tables are in [BALANCE.md](BALANCE.md).

## Milestone 1 — Scaffold + engine core (2026-10-15)

### What was built

**Scaffold**
- Vite 8 + React 19 + TypeScript 6 (strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`), Vitest 4, ESLint 10.
- Scripts: `dev`, `test`, `sim`, `check` (typecheck + lint + tests), `build`.
- An ESLint guard keeps `src/engine/` and `src/data/` pure: no `Math.random`, `Date`, DOM or React.
- GitHub Actions CI (`npm ci` → `check` → `build` on Node LTS, for PRs and pushes to `main`), a PR template, `.gitignore`, the `docs/` set, and `src/assets/ATTRIBUTION.md`.

**Engine (`src/engine/`)**, pure and deterministic:
- Seeded `Rng` (mulberry32). Same seed + same lineups = an identical event log.
- SPD-driven action-gauge timeline with a fully deterministic turn order.
- Damage with diminishing-returns DEF, a minimum of 1 per hit, pierce and shields.
- Data-driven targeting: front-row-first melee with lane preference, backline, lowest HP, random, row and area selectors, ally selectors, and trigger-relative selectors.
- Effect/trigger system:
  - Effects: `damage` (hits/splash/pierce), `heal`, `shield`, `buff`
  - Triggers: `startOfCombat`, `onTurnStart`, `onAttack`, `onHurt`, `onKill`, `onAllyDeath`
  - Triggers support `chance` and `limit`, and chains stop at depth 4.
- Typed event log plus an end-of-fight summary per unit: damage dealt and taken, healing, shielding, kills, survived.
- The tick cap (1,000) counts as a draw. Combat always terminates.

**Data (`src/data/`):** Warrior, Rogue, Mage, Cleric, Ranger, plus the unlockable Necromancer. Each has stats, an ability and a passive, all pure data.

**Simulator (`npm run sim`):** an early combat probe with 2,000 random 5v5 fights (placed by role) and a class-vs-class duel matrix. It flags any class outside 35–65%. The full bot/run simulator is M3.

**Debug UI (`npm run dev`):** pick two lineups and a seed and read the event log and damage summary. It's a stand-in until the real UI in M4.

**Tests:** 73 across 8 files:
- RNG
- damage math
- every targeting selector
- timeline order and tie-breaks
- ability cooldowns
- every trigger, limits, chance and the depth cap
- shields, splash, multi-hit, heal cap
- draws (timeout and mutual kill)
- full-log determinism and input immutability
- a 500-fight termination fuzz with real classes
- the sim report, and a UI render smoke test

### What to playtest (and how)

1. `npm install`, then `npm run dev`, and open the printed URL.
2. Change lineups and the seed and read the log. Things worth checking:
   - **Positioning:** move the Mage to the front row and watch it die first. Put Rogues against an enemy back row and watch Backstab skip the front line.
   - **Determinism:** re-enter the same seed and you get the same log. Change one character and Ranger procs/Volley targets change.
   - **Cleric:** Blessing shields everyone before tick 1, and Mend targets the lowest HP *percentage*.
   - **Necromancer:** Dark Harvest stacks ATK as allies fall.
3. `npm run sim` prints the balance tables in about a second.

Feedback that would help most: do the class identities read clearly in the log? Does any ability feel off for its class?

### Known issues / open questions

- **#1 Heal stalemates:** 0.15% of 5v5 fights time out (Cleric + Warrior walls). This needs a design call on an overtime rule.
- **#2 Back-row melee:** melee units attack normally from the back row, so positioning is weaker than it could be. This needs a design call.
- The debug UI is intentionally bare: no animation, icons or drag-and-drop yet (M4).
- Local machine: the Debian-packaged npm 9 crashes on installs (an arborist bug). Use `npx npm@10 install` or upgrade Node/npm. Local Node 20 also holds Vitest at 4.x (Vitest 5 needs Node 22+).

### Simulator balance numbers

Role-placed random 5v5, 2,000 fights, seed `m1`:

| Class | Win rate |
|---|---:|
| Warrior | 44.7% |
| Rogue | 50.6% |
| Mage | 44.3% |
| Cleric | 53.0% |
| Ranger | 54.5% |
| Necromancer | 56.3% |

No outliers (35–65% band). 3 draws, all timeouts. The average fight lasts 98.8 ticks (about 10 turns per unit). The full report, including the duel matrix, is in [BALANCE.md](BALANCE.md).

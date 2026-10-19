# Checkpoints

Milestone summaries, newest first. Each one becomes the body of that milestone's pull request.

## Milestone 5 — Progression, balance and new classes (2026-10-18)

### What was built

**Your notes**
- **Stat points you spend yourself.**
  - Every level-up gives 3 points, or 5 at levels 3 and 5. A point buys +3 HP, or +1 ATK, DEF or SPD.
  - Click a unit with a gold **+N** badge to open the stat panel. It has +/− per stat, a **Recommended** button that fills in the class's spread (shown as dots), Reset, and Confirm.
  - Points you leave unspent go on the recommended spread when you fight. You never have to min-max, but a Berserker that skips HP for ATK and SPD is now possible.
- **No XP at max level.** Training is no longer offered for classes whose units are all level 5, and a max-level unit can't take it.
- **Fewer recruits once the party is full:** 2 recruit offers and 4 item/training offers.
- **Actions column** in the end-of-fight summary: attacks plus ability casts, e.g. "8 (2✨)".

**Five new classes**, each with 4 talents and two advanced classes (4 talents each):

| Class | Plays as | Advanced classes |
|---|---|---|
| **Monk** | Fast melee striker, 14 SPD, speeds up as it attacks | **Windwalker** (multi-hit speedster), **Iron Fist** (counter-attacking tank who taunts) |
| **Bard** | Back-row support: party SPD at the start, ATK every song | **Skald** (war chants: big party ATK buffs), **Trickster** (delays enemy abilities, saps ATK) |
| **Druid** | Slows the enemy front line | **Shapeshifter** (bear tank who taunts), **Grove Warden** (heals, summons Treants) |
| **Warlock** | Huge single-target bolts that cost its own HP | **Hexer** (curses the whole enemy party), **Demonologist** (summons Imps) |
| **Engineer** | Builds turrets in empty slots | **Machinist** (sentries every 3 turns), **Demolitionist** (cluster bombs) |

- **Summons are a new mechanic.**
  - Turrets, Sentries, Treants and Imps appear in an **empty slot** on your side, fight on their own gauge, and vanish after the fight.
  - **If your board is full, the summoner does something else instead** (a rocket, a party heal, a bolt). Running four units plus summons is a real choice, but summoners still work in a full party.
- **Four new synergies:** Inner Harmony (spirit: Monk, Bard), Nature's Bond (nature: Druid), Dark Covenant (occult: Warlock) and Workshop (tech: Engineer).
- **New enemy archetypes** for every new class, from rounds 2–4.
- **New items:** a class-tied item for each new class, plus four speed items for #9 (Quicksilver Rapier, Featherweight Charm, Winged Sandals, Adrenaline Vial).

**Balance**
- **#10, Knight + Priest + Chronomancer.**
  - Time Warp was hasting the Chronomancer itself, so it really cast every 2nd turn, not every 3rd as described.
  - It now speeds up only *other* allies, never brings an ability closer than 2 turns away, casts every 2nd turn on purpose, and hits harder to compensate.
  - The Knight's shield was trimmed, because players can now pour stat points into DEF.
  - **Results:**
    - Knight taunt uptime with a Chronomancer fell from 49% to 36% of its turns (28% without one).
    - Of 185 advanced-class pairs, Knight + Chronomancer now ranks 18th. The strongest pairs are other tank + support combos.
- **Difficulty.** You went 10–0 twice, and stat points made the bots stronger too, so the enemy curve was rebuilt.
  - **Rounds 6–10 are noticeably harder.**
  - **No more late-game wall:** enemy growth stops after round 10, so rounds 11+ hold at about 25% for the bots instead of dropping to single digits.
  - Bigger challenges are meant to come from the difficulty ladder (Milestone 7).
- **Class tuning:** several simulator passes; details in BALANCE.md and DECISIONS.md.

**Process:** CLAUDE.md now has the new milestone plan (6: level cap 10, 7: meta progression, 8: juice, 9: ship) and the updated meta-progression direction.

**Tests:** 226, up from 205. New tests cover:
- Summons: slot choice, scaling, fallback, a fallen unit's slot, fighting on the gauge.
- `payHp`, attack/ability counts, haste floors and the `otherAllies` selector.
- Stat points: grants, the allocate action, recommended spreads, auto-spend at fight time.
- The XP cap, max-level training, the full-party shop and the enemy growth cap.

**Verified in a real browser** (headless Chrome):
- A saved run with an Engineer and unspent points.
- The +N badges and the Fight-bar reminder.
- Recommended → Confirm updates stats.
- A Sentry appears in combat and is listed as a summon with its actions.
- The level-up line shows the points earned.
- The stat panel at 390px width, with no overflow and no console errors.

### What to playtest (and how)

1. `npm run dev` (or `npm run dev -- --host` for your phone). **Old saves are ignored** (stat points changed the save format), so start a new run. This also resets your saved best run.
2. **Stat points:** level a unit, click it and try both a custom spread and Recommended. Does 3 per level (5 at levels 3 and 5) feel right? Is +3 HP per point worth it next to +1 ATK, DEF or SPD?
3. **Difficulty:** rounds 6–10 should now push back. Is it a fair challenge, or too much?
4. **New classes:** try a summoner with an empty slot or two (Engineer → Machinist, or Druid → Grove Warden). Try a Monk speed build (Prayer Beads, Featherweight Charm, a second spirit unit). Try a Warlock paying HP for damage.
5. **Full party:** once you have 5 units, the shop should lean toward items and training.
6. Your play is logged in dev as always; tell me and I'll read it with `npm run playlog`.

### Known issues

- **The bots never leave slots empty,** so the simulator under-rates summoners (Engineer −2.8, Machinist −3.8 lift). Your playtest is the real test for them.
- **#9 is only partly answered.** The speed items barely widen the speed gap in bot play: the fastest unit is 1.82× the slowest, against 1.80× without the items. Stat points and the Monk already widened it from M4's 1.6×. If speed should matter more for everyone, widening class base SPD is the next step. Your call.
- **Watch list:** Knight (+9.9 lift) and Inquisitor's Zeal talent (+15.9) are the strongest picks; tank + support pairs lead overall.
- **Replaying pre-M5 play logs** runs them under the new rules, so they diverge from what you played. That's expected.
- **Placeholder art:** emoji glyphs remain until the Juice milestone.

### Simulator balance numbers

Seed `m3`, 2,000 runs per bot:

| Bot | Completed | Fight win rate | Avg rounds |
|---|---:|---:|---:|
| random | 4.9% | 35.6% | 7.5 |
| sensible | 20.7% | 61.3% | 11.1 |
| greedy | 29.1% | 65.4% | 11.5 |
| synergy | 11.3% | 52.2% | 9.7 |

Lift spreads: base classes −2.8 to +6.0, advanced classes −3.8 to +9.9, synergies −4.3 to +11.3, items −6.6 to +2.8. 0 tick-cap hits, 0 stuck runs. Full report in [BALANCE.md](BALANCE.md).

## Milestone 4 — Playable UI (2026-10-17)

### What was built

The debug view is gone; the game now has real screens.

- **Title screen:** continue your saved run, start a new one (optionally with a custom seed), see your best run and a short how-to. The combat lab is linked at the bottom.
- **Shop screen:**
  - A HUD with round, gold, lives as hearts, a wins bar and streaks.
  - The six offers as cards: a recruit card shows the class's stats, ability and tags; item cards show the class bonus.
  - **The party board with drag and drop:**
    - Drag a recruit into a slot to buy it there.
    - Drag an item or training card onto a unit to give it to that unit.
    - Drag units to reposition or swap them.
    - Drag a unit or an item to the sell zone that appears at the bottom.
    - Everything also works by clicking.
  - **A unit inspector** with the full build: final stats, ability, talents, items with their own Move/Sell buttons, and draggable item chips.
  - **Synergy progress,** e.g. "1/2 guardian → Shield Wall", so you can plan toward a tier.
  - Warning badges for melee units in the back row without reach, and ⭐ on units with a level-up waiting.
- **Combat screen:**
  - The fight plays back turn by turn from the engine's event log. The acting unit lunges, hit units shake, and floating numbers show damage, healing, shields and stat changes.
  - Ability and trigger names pop up, HP bars drain, taunts show 🎯, and sudden death is announced.
  - **Action gauges** (review feedback): each unit has a bar under its HP that fills by its SPD and turns gold when it acts, with the SPD shown beside it. Time between turns now scales with how many ticks passed, so faster units visibly act more often.
  - Controls: pause, 1x, 2x, skip and replay.
  - **End-of-fight panel:** victory/defeat, lives, XP and income, **every level-up with the stats it rolled** (review feedback; also shown on the level-up choice panel, including level-ups from training), a per-unit dealt/taken/healed table for both sides, and the full combat log on request.
- **Run summary:** every round's result and enemy classes, the final party with each unit's run totals, and an MVP.
- **Saving:** the run is saved to localStorage after every action, so a refresh doesn't lose it. Best run and playback speed are remembered. Every storage access is guarded.
- **Works on phones:** drag uses pointer events, so touch works, and the page auto-scrolls while you drag near the screen edge. The layout goes down to phone width with no sideways scrolling.
- **Small fix:** recruit names are unique within your party and the shop. Two units called "Lark" in one party made fights confusing.

**Tests:** 205, up from 180. New tests cover:
- Turn events record every living unit's gauge; the playback shows the actor full and never drains a gauge except when its unit acts.
- Level-up stat gains between two boards.
- The playback timeline: frame per turn, every event replayed once, final HP and survivors match the engine.
- Drag-and-drop rules and their encoding.
- Merged floating text.
- Storage: round-trip, corrupt/old/invalid data, and blocked or missing storage never throwing.
- Saved-run validation, run stats, best-run ordering, unique recruit names, and play-log resume.

**Verified in a real browser** (headless Chrome, scripted):
- Mouse drag-buy into a slot, click-buy, drag-move, drag an item onto a unit, and drag an item to the sell zone.
- Touch drag from the shop to the board on a 390px-wide screen, with auto-scroll.
- Fight → playback → skip → result → continue, reload → Continue run, and a full run through to the summary.
- No console errors, no horizontal overflow.

### What to playtest (and how)

1. `npm run dev`, then open the printed URL. On a phone on the same network, `npm run dev -- --host` also works.
2. **Feel of the shop:** does dragging feel natural? Try buying straight into a back-row slot, giving an item to a unit by dropping it on them, and swapping two units.
3. **Combat readability:** at 1x, can you follow who hits whom and why units die? Is 2x the right "fast" speed? Watch a Knight taunt (🎯) and a sudden-death fight.
4. **The result panel:** is the damage table useful? Is the combat log worth keeping?
5. **Refresh mid-run** and use Continue. Try a custom seed twice to see the same run.
6. Your play is logged in dev; afterwards, tell me and I'll read it with `npm run playlog` and send pointers.

### Known issues

- **Placeholder art:** emoji glyphs stand in for icons. The game-icons.net set and the credits screen come in M5, as the brief schedules them, along with sound.
- **Phone combat view is tight:** on a 390px screen, unit names truncate and the floating numbers overlap the name. It's readable, but I'd polish it in M5.
- **Balance is unchanged from M3:** the late-game wall (about 19% at round 11) is still the top M5 item. The simulator re-run gives identical numbers, since the name fix uses the same random draws.
- **The bots don't sell items,** so the simulator doesn't exercise item selling.

### Open question for you

- **Should you see the next enemy before the fight?** Right now you find out when combat starts. Showing it (or part of it, e.g. its classes) during the shop would make positioning and item choices more deliberate, but it's a design change, so it's your call. It would be an easy add in M5.

### Simulator balance numbers

No rule or content changes in M4, and the re-run matches M3's follow-up report exactly: completion is sensible 24.3%, greedy 21.1%, synergy 16.4%, random 5.9%; 0 tick-cap hits, 0 stuck runs. Full tables are in [BALANCE.md](BALANCE.md).

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

**Tests:** 180, up from 129 (171 at the first review; the follow-ups add taunt, item selling and play-log replay tests). They cover every new effect, trait and trigger; build resolution and stacking; item class bonuses; synergy tiers and tag changes on advancing; XP thresholds and growth rolls; choice queues, including deferred post-advance options; items, training, selling and moving; enemy development; integrity of all build content (every talent in exactly one pool, every reference valid); simulator determinism; the lift maths; and a real-content end-to-end run.

### Review follow-ups (after Brandon's first playtest)

- **Sell items:** each equipped item has a Sell button (+1g) in the unit panel, so a full unit can make room for a better item.
- **Taunt:** a new `taunt` effect. While a unit taunts, enemy single-target attacks and abilities must target it; area attacks still hit everyone.
  - **Knight:** Holy Bulwark now taunts for 1 turn every 3rd turn (about a third of the time, more with cooldown reduction), with a smaller shield to pay for it.
  - **Warrior:** a new base talent, Challenge, taunts for 1 turn at the start of combat. It replaces Bulwark.
  - **Result:** backline deaths while a front-liner still stood fell from 62% to 56%. Knight's lift is +5.4 (it was +4.3).
- **Dev play log:** under `npm run dev`, your run's seed, every shop action and each fight result are appended to `playlogs/<date>.jsonl` (gitignored). `npm run playlog` replays them through the engine, round by round: what you bought and chose, both parties' builds, damage per unit, death order, and notes such as gold past the interest cap or back-row melee without reach.

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

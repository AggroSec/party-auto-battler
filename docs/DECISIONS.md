# Decisions log

Dated record of choices Claude Code made autonomously under the working agreement in [CLAUDE.md](../CLAUDE.md). Design-level choices that change what the player sees are asked about first, not logged here.

## 2026-10-19 — Export play log

- **Every build now keeps the play log for the last 5 runs in localStorage** (about 500 KB at most), so a run played on the Pages site can be sent to me. Old runs are dropped whole, oldest first, and the current run is always kept, so every exported run replays from its start. A `SAVE_VERSION` bump clears the stored log, which is fine because old logs replay differently under new rules anyway.
- **Export uses the share sheet when the browser can share files** (phones), and downloads the file otherwise. "Copy play log" covers pasting into a chat. The file is the same JSONL that `npm run playlog -- <file>` reads.
- **The buttons sit on the title and run-summary screens,** out of the way during a run.
- **Restored the Milestone 5 and GitHub Pages entries below.** Both were dropped when the conflict between those PRs was resolved.

## 2026-10-19 — GitHub Pages deploy (moved up from Milestone 9)

Brandon asked for the deploy early, so he can play on his phone and share a link.
- **The repo is public, at Brandon's request.** GitHub Pages on a free account only works for public repos, and even paid private-repo Pages sites are public to anyone with the link. Before switching, I checked the full git history for secrets and for files that should be ignored; there were none.
- **`deploy.yml` builds and deploys on every push to `main`,** and can be run by hand (`workflow_dispatch`). It uses the official Pages actions (`upload-pages-artifact`, `deploy-pages`), so there is no `gh-pages` branch to maintain.
- **The Vite `base` is `/party-auto-battler/` only when `GITHUB_PAGES` is set.** The dev server and local builds keep `/`, so nothing changes for local play.
- **Play logs stay dev-only.** The deployed site doesn't record them, since there's no server to send them to. (Replaced the same day by the export button, above.)

## 2026-10-18 — Milestone 5

Brandon decided the direction (in conversation after M4): stat points the player allocates, with recommended spreads; no XP at max level; fewer recruits once the party is full; an actions column; five new classes (Monk, Bard, Druid, Warlock, Engineer) added now so they can be balanced; speed items first for #9; simulations for #10; and the new milestone plan in CLAUDE.md. Everything below was decided autonomously within that direction.

### Stat points
- **Numbers:** 3 points per level, 5 at levels 3 and 5 (Brandon asked for a bump at 3 and 5), so 16 by level 5. One point = +3 HP or +1 ATK/DEF/SPD. That's a little more than the old random rolls averaged (about 13 point-equivalents), and the enemy curve was retuned to match.
- **Unspent points are auto-spent on the recommended spread when you fight,** instead of blocking the fight the way talent choices do. With five units levelling, a blocking prompt every round would nag, and players who don't want to min-max never have to touch it.
- **The recommended spread is relative weights per class** (some advanced classes override it). Points go one at a time to the stat furthest below its weighted share of everything spent so far, so a unit you customised early drifts back toward its spread instead of doubling down. It's deterministic. Enemies use the same spread.
- **Spending is a single `allocate` action per confirm;** the UI keeps a draft (+/−, Recommended, Reset) until Confirm. There is no respec.
- **Save version bumped to 2:** old saves used random growth and lack unspent points, so they're ignored. This also resets the saved best run and playback speed.

### New classes and mechanics
- **Summons are a new engine effect.** Grove Warden's treants, the Engineer's turrets and the Demonologist's imps needed real units on the board. A summon takes the first empty slot (preferred row first, including a fallen unit's slot). It scales from the summoner's HP and ATK times ability power, and fights on the gauge. When the board is full, a **fallback** effect fires instead. That keeps summoners viable in a full party while rewarding the choice to leave slots open. It's a soft trade-off, per the build-variety principle.
- **`payHp` effect** for the Warlock's blood cost. As ordinary self-damage it would have fed the Warlock's own lifesteal and set off "when hurt, hit the attacker" effects on itself.
- **Tags:** new `spirit` (Monk, Bard), `nature` (Druid), `occult` (Warlock) and `tech` (Engineer) tags, each with a synergy. Druid also carries `wild` and Bard `arcane`, so the new classes plug into existing synergies too. Necromancer's tags are unchanged.
- **Each class lives in one file** (`src/data/builds/<class>.ts`): the base class, its talents and its advanced classes. `classes.ts` had hit the size limit with 6 classes.
- **New enemy archetypes** for every new class, appearing from rounds 2–4.
- **Summoned units get their own colours and glyphs** (the summoner's colour) and a dashed border in combat. Their damage is credited to the summon in the summary, labelled "(summon)".

### Balance
- **#10 (Knight + Priest + Chronomancer):**
  - **Time Warp hastened the Chronomancer itself.** That turned "every 3rd turn" into every 2nd turn, and the description didn't match. It now hastes only other allies, never brings an ability closer than 2 turns away (a new `min` floor on haste), casts every 2nd turn on purpose, and hits for 150% ATK instead of 100% to make up for the lost haste power.
  - **Knight + Chronomancer:** taunt uptime went from 49% to 36% of the Knight's turns (28% without a Chronomancer).
  - **Knight itself was the bigger outlier** (+12.5 lift on its own). Holy Bulwark's shield went from 2 + 100% DEF to 2 + 60% DEF (players can now pour points into DEF), and Stalwart's chance went from 25% to 20%.
- **#9 (speed):** four new speed items plus Prayer Beads (Monk). Class SPD was left alone for now, as Brandon asked. The new classes widen the spread a little: Monk has 14 base SPD and builds more.
- **Difficulty:** stat points made the bots stronger (greedy completion jumped from 21% to 45%), and Brandon went 10–0 twice in M4.
  - **New curve:** enemies start at full strength and grow 8% HP / 5% ATK per round. They reach level 3 by round 7, more gradually than before, and plateau after round 10, so the late game is hard without being a wall.
  - **Result:** sensible 15.8%, greedy 22.1%, synergy 8.6%.
  - **Harder runs will come from the difficulty ladder** (Milestone 7), not from the base game.
- **Class tuning:** several passes, all in BALANCE.md. Druid, Grove Warden, Machinist, Windwalker, Assassin and Warlock were buffed; Trickster, Iron Fist, Pyromancer, Inquisitor, Knight and Arcane Circle tier 2 were nerfed.

### Simulator
- **Bots spend stat points:** random spends randomly; greedy point by point, by its party-power estimate; sensible and synergy leave them to the fight's auto-spend (the recommended spread). The greedy bot's power estimate accounts for unspent points.
- **The dev play log records `allocate` actions.** Replaying pre-M5 logs runs them under the new rules, so old runs diverge (expected: logs are tied to the rules they were played under).

## 2026-10-17 — Milestone 4

All decided autonomously. The UI is in scope for this milestone, and none of these choices changes a game rule.

### Rendering and architecture
- **Combat is rendered with DOM and CSS animations, not canvas** (the brief left this to me). The battlefield is at most 10 cards. DOM gives free text layout, accessibility (buttons, ARIA meters for HP) and responsive CSS, and needs no extra dependencies.
- **Playback is a pure function of the event log.** `buildTimeline` turns the log into frames: one for start-of-combat effects, one per turn, one per sudden-death pulse, and a final one. The UI only steps through them. Tests check that the last frame's HP and survivors match the engine exactly, so the playback can't drift from the real result.
- **A frame is a whole turn,** not a single event, so an attack and its knock-on triggers animate together. At 1x a basic attack shows for 0.65s, an ability for 0.95s and sudden death for 1s; 2x halves these. Skip jumps to the final frame, and Replay restarts from the beginning. The chosen speed is remembered.
- **Floating text is merged per unit per frame** (total damage, total healing, net stat change), with trigger names shown as a callout. Start-of-combat frames with many synergy and talent effects were unreadable as separate pop-ups.
- **`useGame` owns the screen state and calls the engine**; components stay presentational. Pure helpers (drop rules, run records, storage, synergy progress, timeline) are separate, tested modules.
- **The debug run view was removed.** Everything it did is in the real screens. The combat lab stays, linked from the title screen, because it's useful for playtesting matchups.

### Drag and drop
- **A small custom pointer-events implementation,** not the HTML5 drag API (which doesn't fire on touch screens) and not a library (that would be a new dependency). It's about 170 lines: a press that moves more than 6px becomes a drag, otherwise it's a click, so every draggable is also clickable. A ghost card follows the pointer; Escape cancels; the page scrolls while the pointer rests near the top or bottom edge.
- **Every drag has a click alternative** (see DESIGN.md → UI), for keyboard users and for precision.
- **The sell zone appears only while you drag a unit or an item,** fixed at the bottom of the screen and showing the refund, so it's always reachable and never clutters the shop.

### Persistence
- **The run is saved after every action and fight** (localStorage, versioned envelope, every access in try/catch). Refreshing the page offers "Continue run". Saves that fail validation (wrong version, a class that no longer exists) are ignored. The best run (most wins, then fewest rounds) and the playback speed are saved too. Finished runs are cleared.
- **New runs get a random seed by default;** the title screen offers a custom seed for reproducible runs and bug reports. The dev play log records resumed runs with their saved state, so `npm run playlog` still replays them.

### Review follow-ups (2026-10-18)
- **The engine's `turn` event now carries every living unit's gauge** (the actor's still full, before it pays 100). The playback shows gauges from the log instead of re-implementing the fill rules in the UI, so it can't drift from the engine. Outcomes are unchanged; the simulator numbers are identical.
- **Turn pacing includes gauge time:** each frame waits an extra 40ms per tick since the previous frame (capped at 10 ticks), so the gauges fill visibly and units that share a tick act back to back.
- **HP and gauge bars animate from the previous frame's value** via a CSS keyframe. The unit card is re-mounted every frame to replay its animations, which had silently disabled the HP bar's transition.
- **Level-up stat gains are worked out in the UI by diffing the board before and after** a fight or a training purchase (growth is cumulative in the run state). They're kept in memory only, so after a page reload the choice panel shows the choice without the gains.

### Small rule-adjacent fix
- **Recruit names are unique within your party and the current shop.** Two units called Lark in one party made combat and summaries ambiguous. It still uses one RNG draw per name, so seeds and simulator results are unchanged.

### Look
- **One colour per base class, plus an emoji placeholder glyph.** Advanced classes keep their base class's look, so the party reads by role at a glance. Real icons from game-icons.net, with the credits screen, are M5 work as the brief schedules them.

## 2026-10-17 — Milestone 3 review follow-ups

Brandon's playtest asked for: selling items, a taunt for Warrior or at least Knight ("doesn't need to be 100% uptime unless they invest in lowering the cooldown"), and a dev play log. The details below were decided autonomously.

- **Taunt is an effect, not a trait,** so any ability, talent or item can grant it with a duration. It redirects single-target enemy selectors only; AoE and splash still reach the back row, so mages and Berserkers keep their role.
- **Duration counts the taunter's own turns** and ticks down at the start of its turn, like ability cooldowns. Reapplying takes the longer duration instead of stacking, so cooldown-reduction builds raise uptime without making it permanent.
- **Tuning:** 1 turn on Knight's 3-turn Holy Bulwark is about 33% uptime. The shields were trimmed (3 + 150% DEF → 2 + 100% DEF) because 2-turn taunts with full shields gave Knight +7.7 lift. Base Warriors get taunt through Challenge (start of combat, 1 turn), which replaces Bulwark (a self-shield talent that had −0.9 lift).
- **Item selling refunds 1 gold** (the existing `itemSellRefund`), the same value an item adds when you sell its unit. The bots don't use it yet.
- **Play log:** dev builds post the run seed, every shop action and each fight result to a Vite dev-server endpoint, appended to `playlogs/<date>.jsonl` (gitignored). The engine is deterministic, so `npm run playlog` replays the log exactly and flags it if a result ever differs. Logging is compiled out of production builds and needs no extra dependencies.

## 2026-10-17 — Milestone 3

Brandon decided: weighted random stat growth per class (in conversation during the M2 review); no merging, XP via random class training in the shop (#5). Everything below was decided autonomously.

### Engine
- **One shared `UnitModifier` shape** for talents, items, advanced classes and synergies: stats, triggers, reach, lifesteal, ability power and cooldown change. Everything stacks additively, and nothing class-specific is coded.
- **New effects and traits were added only where content needed them:**
  - `debuff` and `cooldown` effects: Chronomancer, Plaguelord and the debuff talents.
  - `onAbility` and `onBloodied` triggers: spell-echo talents, Berserker rage, "second wind" effects.
  - `reach`, `lifesteal` and `abilityPower` traits.
- **`abilityPower` scales damage, heals and shields from the ability itself.** It doesn't affect triggers or basic attacks, so it stays a caster stat.
- **`onBloodied` fires once per combat** and never on a killing blow.
- **Damage resolution moved to `hits.ts`,** to keep files under ~300 lines.

### Progression and choices
- **XP:** every unit on the board gets win 2, loss 1, draw 1. Levels 1–5 at 0/2/5/9/14 XP, so a round-1 unit advances around round 4 and maxes around round 8. A loss still grants XP, a soft comeback mechanic.
- **The choice schedule:**
  - Level 2: talent from the base pool.
  - Level 3: advanced class.
  - Levels 4–5: talents from the advanced pool.

  This gives 4 meaningful decisions per unit, each with 3 options (2 for the advance). All of them are choices, never flat stat bumps; stat growth is the automatic random roll Brandon asked for.
- **Pending choices block the next fight but not shopping.** You can buy training, level up several times and resolve them in order. Talent options for levels after the advance are rolled only once the advanced class is picked, so they always come from the right pool.
- **Talent pools have 4 per class or advanced class,** with 3 offered per level. A unit sees most of its pool across a run, and still chooses.

### Shop, items, training
- **Shop layout:** 4 unit slots + 2 extra slots. Each extra slot rolls training 35% of the time (only for classes on your board) and an item otherwise. Training is class-specific per #5, so chasing XP for one unit means rerolling.
- **Training costs 3 gold for +2 XP,** about the XP of one win per unit, for the price of a unit.
- **Class-tied items are soft:** anyone can equip them, and the tied class gets an extra effect. This follows Brandon's build-variety preference (costs and bonuses, not locks).
- **Items:** movable between units during the shop phase. Selling a unit refunds 1 per item, and there's no stash (no bench in the brief).

### Synergies
- **Tags drive synergies,** and advanced classes replace their base tags. Advancing a Warrior to Knight adds divine (which can complete Vanguard or Divine Choir); advancing to Berserker drops guardian. The level-3 choice therefore also reshapes party synergies.
- **The brief's examples map to:** "2+ casters" is Arcane Circle, and "frontline + healer" is Vanguard (guardian + divine).
- **Adventuring Party (4–5 different classes)** rewards variety directly.
- **Synergies apply to enemies too,** to keep the rules symmetric.

### Enemies
- **Enemies level and gear up with the same code as the player:** random talents, advanced classes and items. This keeps one system, gives enemy variety and puts every advanced class, talent and item into the fights on both sides.
- **Fractional level and item curves.** Integer steps made every enemy advance or gain an item on the same round, creating sharp cliffs (98% → 56% win rate in one round). A fractional value is the chance each unit gets one more, which produces a smooth ramp.

### Simulator
- **Four bots:** random, sensible, greedy (maximizes an estimated party power) and synergy (picks a tag per run and builds toward it).
  - Greedy's power estimate (effective HP × damage) undervalues effects and over-values ability power, so it's no better than sensible.
  - It's a useful foil, because it exposed builds that look strong on paper but aren't (Pyromancer, arcane). A smarter bot is a possible M5 task.
- **Round-adjusted lift.** Raw pick-to-win rates were badly confounded: items, advanced classes and level-4–5 talents only exist in later, harder rounds, so they all looked weak, while 2-of-a-tag synergies looked strong because they appear early.
  - Lift compares each fight with that round's average. Balancing was done on lift.
  - The brief's raw 65%/35% flags are still reported as specified.

### Balance (see BALANCE.md)
- **Difficulty targets:** random about 5%, sensible about 25% completion, a smooth decline by round, and average fight win rate around 60%.
- **Notable changes:**
  - Pyromancer's Meteor now casts every 2nd turn.
  - Arcane Circle's tier 2 grants HP rather than faster casting (faster casting overshot to +16.5 lift).
  - Chronomancer's Time Warp no longer delays enemies, and its talents were trimmed.
  - Call of the Wild and Adventuring Party were reduced to modest bonuses.
- **Remaining for M5:** Accelerate (+8 lift), the late-game wall (rounds 11+ about 20% for every bot), and greedy-bot quality.

### UI
- **Clicking a unit selects it** (shows details, targets items and training). Moving units and items uses explicit Move buttons, because selecting no longer doubles as moving: inspecting units shouldn't rearrange them by accident.
- **Verified in headless Chrome:** a full run with 18 level-up choices, item and training purchases, and an item move, with no console errors.

## 2026-10-17 — Milestone 2

Brandon decided: sudden death (#1, option 3); back-row melee at 50% damage (#2, option 3); play until 10 wins or 0 lives; draws count as neither. Everything below was decided autonomously.

### Combat rules
- **Sudden death tuning:** starts at tick 300 (about 3× an average fight), pulses every 10 ticks, and deals stage × 5% of max HP as true damage. True damage means DEF and shields can't stall it out, and a % of max HP means it neither favours nor punishes big HP pools: the side holding a higher HP percentage wins. A consequence worth knowing: two untouched units fall on the same pulse, a draw.
- **Sudden-death damage has no source unit.** It's logged with `source: 'overtime'`, credits no damage or kills, and doesn't fire `onKill`. `onHurt` and `onAllyDeath` still fire, without a `triggerSource`.
- **The back-row melee penalty covers all damage a melee unit deals,** abilities and triggers included, not just basic attacks. Otherwise Rogue's Backstab (its main damage) would dodge the trade-off. It's checked per hit, so it lifts the moment the front row falls. It's a soft cost that talents and items can remove later (see the build-variety note in #2).
- **Cross-side ties are broken by a seeded coin flip** (from M2 review). It's flipped once per tick, and only when units on opposite sides tie on gauge and SPD, so the Rng isn't consumed needlessly. Within a side, board order still decides. Exact mirror matches went from 78/22 to about 50/50, and a regression test now guards it.
- **Units declare `range: 'melee' | 'ranged'`** explicitly. The `'melee'` target selector was renamed `'nearest'`, because casters use it too and "melee" now means the unit property.

### Run loop
- **Pure reducer over JSON-safe state:** `createRun`, `applyShopAction`, `fight`. The UI, the simulator bots and future saves all drive the same functions. `RunState` round-trips through `JSON.stringify` (tested), ready for `localStorage` in M4/M5.
- **Three RNG streams:**
  - the shop draws from a stream stored in `RunState`
  - enemies use `seed:enemy:round`
  - combat uses `seed:combat:round`

  So rerolls never change the upcoming enemy, and two players on the same seed face the same enemies.
- **Content is passed in** as a `RunContext` (config + content), not imported by the engine. Run-layer tests use small synthetic content, so rebalancing classes never breaks rule tests.
- **Selling is allowed** (refund 1g). With a fixed 5-slot party, replacing a unit would otherwise be impossible.
- **No bench and no shop freezing.** Neither is in the brief, and both are visible mechanics. They can be added later if wanted.
- **Fighting needs at least one unit** (`emptyBoard` error) instead of auto-losing. This prevents a misclick from costing a life.
- **Duplicates are allowed with no merging.** Merging is a design question (raised in DESIGN.md).
- **The shop refreshes free each round,** and unspent gold carries over (it's needed for interest).
- **Unit names are random picks from a name list,** shown as "Brom the Warrior". They're flavour that makes the event log easier to follow.

### Economy (first pass, tune again in M3)
- Starting gold is 10, enough for 3 units in round 1. Base income is 5 (about 1–2 units a round).
- Interest is +1 per 5 gold, capped at **2** rather than 3. With nothing to spend on after the party fills, a higher cap only inflates hoards.
- Streak bonuses apply to win *and* loss streaks: momentum and a comeback cushion.
- **Known gap:** there's no gold sink once the party is full, and bots average 30+ unspent gold. Items and progression in M3 are the intended sinks.

### Enemies
- **Archetypes reuse class templates** with small stat multipliers (a Brute is a Warrior with +10% HP and −10% ATK). One combat system, and the enemy roster reads as its own faction.
- **Archetypes unlock by round** (Hedge Mage from round 2, Acolyte from 3, Bonecaller from 5), so early fights are simpler to read.
- **Difficulty curve:** the first scaling (+6% HP / +5% ATK per round, 5 units at round 6) produced a cliff, with sensible-bot win rate going from 74% in round 5 to 1% in round 6. Replaced with full-size parties by round 4 at 75% stats, growing 4% HP / 3% ATK per round, which gives a gradual decline. After the tie-break fix removed the player's hidden edge, sensible-bot completion fell from 14% to 6%, so growth was eased to 3.75% HP / 2.75% ATK, restoring about 14%. Player units don't grow until M3, so this curve will be retuned then.

### Simulator
- Two bots for now: **random** and **sensible** (wants 2 frontliners, then class variety). The brief's greedy and synergy-focused bots need M3 systems to mean anything.
- The run report covers: completion rate, wins distribution, win rate by round (the difficulty curve), average unspent gold (economy health), and fight win rate per class.

### UI
- **The debug view gains a playable Run tab:** shop, a click-to-move board laid out with back slots between front lanes, fight and event log, and a run-end banner.
- **The UI was verified in headless Chrome.** A script drives Chrome over the DevTools protocol using Node's built-in WebSocket, plays a full run and takes screenshots. No test dependency was added. Real drag-and-drop arrives in M4.

## 2026-10-17 — Toolchain: Node 24

- **Local dev moved to Node 24 LTS** (via nvm), matching CI's `lts/*`. Node 20 stopped receiving security patches in April 2026. This also retires the Debian npm 9 workaround.
- **Vitest 4 → 5**, ESLint 10.12 → 10.13, `@types/node` 20 → 24. `engines.node` is now `>=22.12` (Vitest 5's minimum).
- **TypeScript stays on 6.0.** typescript-eslint still supports only versions below 6.1. Revisit when it adds TS 7 support.
- **esbuild's install script is explicitly denied** (`allowScripts` in `package.json`). npm 11 blocks dependency install scripts by default. esbuild (pulled in by `tsx` and Vite) works without its optional postinstall check, so the safer default stays in place.

## 2026-10-15 — Milestone 1

### Tooling
- **Versions:** Vite 8, React 19, TypeScript 6.0, Vitest 4.1, ESLint 10 with typescript-eslint 8.
  - TypeScript 7 is out, but typescript-eslint supports only versions below 6.1, so TS is pinned to `~6.0`.
  - Vitest 5 requires Node 22 or newer. The local dev machine runs Node 20.19, so Vitest stays on 4.x. CI runs on Node LTS (`lts/*`). Upgrade both once local Node is 22+.
- **Dev-only dependencies added:** ESLint and its plugins (needed for the `lint` step of `npm run check`), `tsx` (runs the TS simulator in Node), and `@types/*`. These ship nothing to players, so they don't count as the extra runtime deps CLAUDE.md asks about.
- **No `seedrandom`:** a 30-line inline mulberry32 PRNG (`src/engine/rng.ts`) covers what's needed, so there's no runtime dependency.
- **Engine purity is enforced by lint,** not just convention. ESLint bans `Math.random`, `Date`, `window`, `document`, `localStorage`, `performance` and React imports inside `src/engine/` and `src/data/`.
- **Three TS projects** (`app`, `sim`, `node`) so Node types don't leak into browser code and DOM types don't leak into the simulator.
- **The local npm 9 from Debian has a peer-dependency resolver bug.** Installs were run with `npx npm@10`. The lockfile is standard v3 and works with any npm 9+.

### Engine
- **The engine doesn't look up content by id.** `simulateCombat` takes fully resolved `UnitSetup`s (stats, attack target, ability, triggers). `src/data/units.ts` builds them from class data. The run loop and build systems (M2/M3) will layer level, talents and items on top before combat, and the engine stays content-agnostic.
- **Timeline:** an SPD-filled action gauge with threshold 100, rather than a priority queue of next-action times. It's simple to reason about, it gives integer ticks for the UI to play back, and overflow carry-over keeps speed ratios exact. SPD is clamped to 1–100, so at most one action per tick.
- **Tie-break order:** gauge → SPD → player side → board order. Player-first is a slight player bias, which suits a single-player game. The simulator alternates sides in duels to cancel it out.
  - **Correction (2026-10-17):** this wasn't slight. Brandon's mirror-match test in the Combat lab showed the player winning 78% of exact mirrors, because the side that always acts first on shared ticks snowballs. It also inflated M2's run completion rate. Replaced with a seeded coin flip; see the M2 entry.
- **Damage formula:** `max(1, round(raw × 10/(10+DEF)))`. Multiplicative with diminishing returns, so DEF stacking (talents/items later) can't create invulnerable units, and stats can stay small and readable.
- **Abilities use turn-count cooldowns** ("every Nth turn") rather than mana. They're readable on a unit card, they interact naturally with SPD (faster units cast more often), and they're easy for talents to modify later.
- **Buffs last for the whole combat** (no durations) in M1. Timed effects and debuffs can be added to the effect system when a talent or item needs them.
- **`onAttack` fires only on basic attacks,** not abilities. That keeps on-hit items (M3) from double-dipping on multi-hit abilities like Volley.
- **`onHurt` doesn't fire on a killing blow.** The unit is dead and can't react; `onKill` and `onAllyDeath` cover that moment.
- **Trigger chains are capped at depth 4** to guarantee termination. The tick cap already bounds the fight; the depth cap bounds a single action.
- **Event log** is a discriminated union carrying `tick`, `type`, and where relevant `source`, `target`, `value`. A `combatStart` event carries a snapshot of every unit, so the UI can render the board from the log alone.

### Data / classes
- **Class abilities and passives** (see `docs/DESIGN.md`) were chosen so each starting class exercises a different part of the trigger system:
  - Warrior: `onHurt` + `limit`
  - Rogue: `onKill`
  - Cleric: `startOfCombat` shields
  - Ranger: `onAttack` + `chance` + `triggerTarget`
  - Necromancer: `onAllyDeath`
  - Mage: splash
- **First balance pass** from the simulator, before any playtest:
  - Warrior HP 40→42, ATK 5→6
  - Mage HP 22→24, Fireball 160%→200%
  - Ranger ATK 6→5
  - Necromancer HP 26→24

  Result: every class lands at 44–56% in role-placed 5v5 fights.

### Simulator
- **M1 sim is a combat probe,** not the full run simulator. It runs class-vs-class 1v1 duels and random 5v5 parties. Bots, runs and pick-to-win rates come in M3, once a run loop exists.
- **5v5 probe places units by role** (Warrior forward, Mage back, and so on). Purely random placement mostly measured how often a class landed in the wrong row.

### UI
- **Combat rendering: DOM/CSS, not canvas.** Units are a handful of cards, and DOM gives accessible text, easy React integration, CSS transitions for hit/heal animations and crisp game-icons.net SVGs for free. Canvas is reserved for particle effects if M5 wants them.
- **M1 ships a debug view only:** two lineup pickers, a seed box, the event log and a damage summary. It exists to eyeball engine behaviour; the real UI is M4.

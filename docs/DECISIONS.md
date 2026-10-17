# Decisions log

Dated record of choices Claude Code made autonomously under the working agreement in [CLAUDE.md](../CLAUDE.md). Design-level choices that change what the player sees are asked about first, not logged here.

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

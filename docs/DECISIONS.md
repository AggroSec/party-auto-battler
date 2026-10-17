# Decisions log

Dated record of choices Claude Code made autonomously under the working agreement in [CLAUDE.md](../CLAUDE.md). Design-level choices that change what the player sees are asked about first, not logged here.

## 2026-10-17 — Milestone 2

Brandon decided: sudden death (#1, option 3); back-row melee at 50% damage (#2, option 3); play until 10 wins or 0 lives; draws count as neither. Everything below was decided autonomously.

### Combat rules
- **Sudden death tuning:** starts at tick 300 (about 3× an average fight), pulses every 10 ticks, and deals stage × 5% of max HP as true damage. True damage means DEF and shields can't stall it out, and a % of max HP means it neither favours nor punishes big HP pools: the side holding a higher HP percentage wins. A consequence worth knowing: two untouched units fall on the same pulse, a draw.
- **Sudden-death damage has no source unit.** It's logged with `source: 'overtime'`, credits no damage or kills, and doesn't fire `onKill`. `onHurt` and `onAllyDeath` still fire, without a `triggerSource`.
- **The back-row melee penalty covers all damage a melee unit deals,** abilities and triggers included, not just basic attacks. Otherwise Rogue's Backstab (its main damage) would dodge the trade-off. It's checked per hit, so it lifts the moment the front row falls. It's a soft cost that talents and items can remove later (see the build-variety note in #2).
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
- **Difficulty curve:** the first scaling (+6% HP / +5% ATK per round, 5 units at round 6) produced a cliff, with sensible-bot win rate going from 74% in round 5 to 1% in round 6. Replaced with full-size parties by round 4 at 75% stats, growing 4% HP / 3% ATK per round, which gives a gradual decline. Player units don't grow until M3, so this curve will be retuned then.

### Simulator
- Two bots for now: **random** and **sensible** (wants 2 frontliners, then class variety). The brief's greedy and synergy-focused bots need M3 systems to mean anything.
- The run report covers: completion rate, wins distribution, win rate by round (the difficulty curve), average unspent gold (economy health), and fight win rate per class.

### UI
- **The debug view gains a playable Run tab:** shop, a click-to-move board laid out with back slots between front lanes, fight and event log, and a run-end banner.
- **The UI was verified in headless Chrome.** A script drives Chrome over the DevTools protocol using Node's built-in WebSocket, plays a full run and takes screenshots. No test dependency was added. Real drag-and-drop arrives in M4.

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

# Decisions log

Dated record of choices Claude Code made autonomously under the working agreement in [CLAUDE.md](../CLAUDE.md). Design-level choices that change what the player sees are asked about first, not logged here.

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

# CLAUDE.md — Party Auto-Battler (working title)

## What this project is

A browser-playable party auto-battler with RPG classes and builds. The player drafts a party, positions it, equips it and levels it up between rounds. Then the fight resolves automatically. Think Super Auto Pets / Backpack Battles, but the depth comes from CRPG-style classes, talent choices and advanced-class upgrades.

This is an **AI-directed project**. Brandon (the owner) sets direction, design and priorities. Claude Code writes the code. The repo itself is part of the showcase: specs, decisions and process should be visible and tidy, not just the final game.

## Working agreement (read this first)

- **Work autonomously within a milestone.** Don't stop to ask about things you can decide sensibly yourself. Record those decisions in `docs/DECISIONS.md` and keep going.
- **Stop and ask only when** a choice changes the game's design in a way the player would notice (new mechanic, removing a class, changing the run structure). The same applies when a choice adds a runtime dependency not listed below, or when you're blocked.
- **Stop at the end of every milestone.** Write a checkpoint summary in `docs/CHECKPOINTS.md` covering what was built, what to playtest, known issues and balance numbers from the simulator. Then open a pull request (see Git workflow) and wait for Brandon's review.
- **Never mark work done with failing tests or type errors.** `npm run check` must pass before every commit.
- **Small, frequent commits** using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `balance:`).
- If a design detail in this file is ambiguous, pick the option that makes builds more interesting and log it.

## Git workflow

**Never commit directly to `main`.** Every change reaches `main` through a pull request that Brandon reviews and merges.

**Branches**
- Start each milestone from an up-to-date `main` on a branch named `milestone-<N>-<short-name>` (e.g. `milestone-1-engine`).
- Standalone fixes outside a milestone go on `fix/<short-name>`.

**Opening the PR (at each checkpoint)**
1. Make sure `npm run check` and `npm run build` pass locally.
2. Push the branch and open a PR with `gh pr create`:
   - Title: `Milestone <N>: <name>`
   - Body: the checkpoint summary (what was built, what to playtest and how, known issues, simulator balance numbers), plus `Closes #<issue>` for any related issues.
3. Stop and wait. **Never merge your own PRs.** Brandon reviews and squash-merges.

**Handling review feedback**
- Read comments with `gh pr view <number> --comments`.
- Address each comment in new commits on the same branch, push, then reply on the PR summarizing what changed.
- Don't force-push or rewrite history once a review has started.

**After a merge**
- `git checkout main && git pull`, delete the merged branch locally, then start the next milestone branch.

**Issues**
- If you find a bug or idea outside the current milestone's scope, open an issue with `gh issue create` instead of fixing it silently mid-milestone.

**CI/CD (set up in Milestone 1)**
- `.github/workflows/ci.yml`: on every pull request and push to `main`, use the current Node LTS and run `npm ci`, `npm run check` and `npm run build`. CI must stay green.
- `.github/workflows/deploy.yml` (added in the Ship milestone): deploy to GitHub Pages on push to `main` only.
- `.github/pull_request_template.md` with sections matching the checkpoint summary.

**Never commit**
- Secrets, tokens, `.env` files, `node_modules/`, build output (`dist/`), or `CLAUDE.local.md`. Keep `.gitignore` current.
- Don't change repo settings (visibility, branch protection, collaborators). Brandon owns those.

## Stack

- **TypeScript** (strict mode) everywhere.
- **Vite** for dev server and build.
- **React** for UI (shop, party board, menus). Combat playback rendered with DOM/CSS animations or a single `<canvas>`, your call. Log it.
- **Vitest** for tests.
- **Deploy:** GitHub Pages via GitHub Actions on push to `main`.
- **No backend.** Save data (unlocks, settings, best runs) lives in `localStorage`. Wrap every read and write in try/catch and fall back gracefully.
- Allowed extra deps without asking: `seedrandom` (or a tiny inline PRNG), `clsx`. Anything else gets asked about first.

## Architecture rules

```
src/
  engine/      # Pure game logic. NO DOM, NO React, NO Math.random, NO Date.
  data/        # Classes, talents, items, enemies as typed data (TS or JSON)
  sim/         # Headless simulator + bots (runs in Node)
  ui/          # React components; reads engine state, never mutates it directly
  assets/      # Icons/sprites + ATTRIBUTION.md
docs/
  DESIGN.md        # Living game design doc
  DECISIONS.md     # Dated log of decisions made autonomously
  CHECKPOINTS.md   # Milestone summaries
  BALANCE.md       # Latest simulator reports
```

- **The engine is deterministic.** All randomness goes through a seeded RNG passed in explicitly. Same seed + same inputs = same result, always.
- **Combat produces an event log** (`{ tick, type, source, target, value, ... }[]`). The UI plays back the log; it never computes outcomes itself.
- **Game content is data, not code.** Adding a class or item should mean adding a data entry. Special behaviors go through a small, typed effect/trigger system (e.g. `onAttack`, `onHurt`, `onAllyDeath`, `startOfCombat`).
- Keep files focused. If a file passes ~300 lines, split it.

## Game design (starting point, owned by Brandon, refine in docs/DESIGN.md)

**Run structure**
- A run continues until 10 wins or 0 lives (typically 10–14 rounds). Each round has a **Shop phase** followed by a **Combat phase**.
- The player starts with 5 lives and loses 1 per combat loss; draws count as neither a win nor a loss. 10 wins = run complete; 0 lives = run over.
- Enemy parties are generated per round from data, scaling with round number. No multiplayer.

**Shop phase**
- Gold per round, plus interest/streak bonuses (tune via simulator).
- The shop offers recruitable units (each unit is a class) and items. Reroll costs gold.
- Party size is 5, in a **front row (3) and back row (2)**. Melee targets the front row first; position matters.

**Units, classes and builds (the core fantasy)**
- Classes: Warrior, Rogue, Mage, Cleric, Ranger, Monk, Bard, Druid, Warlock and Engineer, plus Necromancer (the first unlock). More classes come after the core project ships, with Brandon choosing them.
- Stats: HP, ATK, DEF, SPD, plus a class ability on a cooldown or resource.
- Units gain XP from combat. **Every level-up offers a choice of 2–3 talents** from that class's talent pool. Meaningful choices, not flat stat bumps.
- **Every level-up also grants stat points the player distributes freely** (more at levels 3 and 5), with a recommended spread per class for players who don't want to min-max.
- At level 3, a unit **advances into one of two advanced classes** (e.g. Warrior → Knight or Berserker; Mage → Pyromancer or Chronomancer). Each advanced class changes its ability and talent pool.
- **Party synergies:** bonuses for class combinations (e.g. 2+ casters, frontline + healer). Build variety across runs is the goal.
- **Items:** up to 2 per unit. Some items are tied to a class, so there are build-defining combos to find.

**Combat**
- Tick-based timeline driven by SPD. Fully automatic.
- The UI shows a readable playback with speed controls (1x/2x/skip) and an end-of-fight summary (damage dealt/taken per unit).

**Meta progression**
- A **difficulty ladder**: winning a run unlocks the next, harder tier; each tier adds a modifier (and later tiers can add new enemies).
- **Achievements** unlock classes, items, synergies and starting perks. Unlocks mostly add variety, but some may help a little (Vampire Survivors-style), and the ladder's difficulty outpaces that help. Unlocked content joins the enemy pool too.
- A **daily seed** run (derived from the date, no backend).
- Planned later: level cap 10 with a tertiary class at level 7, and talents that grant new abilities.

## Art and assets

- **Icons:** game-icons.net (CC BY 3.0). Every icon used must be credited in `src/assets/ATTRIBUTION.md` and on an in-game credits screen.
- **Sprites/UI (optional):** Kenney.nl (CC0).
- Everything else is drawn in code: CSS, SVG, canvas effects. Aim for a clean, readable, cohesive style over detailed illustration.
- Never use assets with unclear licenses.

## Testing and self-verification

- Unit tests for every engine rule (damage, targeting, triggers, talents, shop economy).
- **Headless simulator** (`npm run sim`) plays N full runs (default 2,000) with several bot strategies (random, greedy, synergy-focused). It reports:
  - win rate per class, advanced class, item and synergy
  - average round reached
  - outliers (anything above 65% or below 35% pick-to-win rate, infinite loops, fights that exceed a tick cap)
- Use the simulator to balance **before** asking Brandon to playtest. Save reports to `docs/BALANCE.md`.
- Combat must always terminate; enforce a tick cap and treat a timeout as a draw.

## Scripts

- `npm run dev`: local dev server
- `npm run test`: Vitest
- `npm run sim`: headless balance simulator
- `npm run check`: typecheck + lint + tests (must pass before every commit)
- `npm run build`: production build

## Milestones (stop for a checkpoint after each)

1. **Scaffold + engine core:** Vite/TS/React/Vitest project setup, `.gitignore`, CI workflow, PR template, `docs/` files. Then units, stats, deterministic combat with event log, targeting, tests.
2. **Run loop:** shop, gold, party positioning, rounds, lives, enemy generation, tests.
3. **Builds:** XP, talent choices, advanced classes, items, synergies, and the simulator with bots.
4. **Playable UI:** shop screen, party board with drag-to-position, combat playback, run summary.
5. **Progression, balance and new classes:** stat-point allocation, max-level and full-party shop fixes, new classes (Monk, Bard, Druid, Warlock, Engineer), speed items, simulator-driven balance pass.
6. **Level cap 10:** tertiary classes at level 7, talents for levels 6–10, talents that grant abilities.
7. **Meta progression:** difficulty ladder, achievements, unlocks screen, starting perks, daily seed.
8. **Juice:** icons, animations, sound toggle, credits screen.
9. **Ship:** GitHub Pages deploy, README with screenshots/GIF, and a "How this was built" section.

## README requirements

The README must include a **"How this was built"** section that states plainly: Brandon designed and directed the project, and Claude Code wrote the code. Link to `CLAUDE.md` and the `docs/` folder as evidence of the process.

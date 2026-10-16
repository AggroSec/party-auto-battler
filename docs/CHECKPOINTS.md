# Checkpoints

Milestone summaries, newest first. Each one becomes the body of that milestone's pull request.

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

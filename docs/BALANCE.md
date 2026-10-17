# Balance reports

Latest simulator output first. Regenerate with `npm run sim` (add `-- --out <file>` to save the raw report).

## 2026-10-15 — Milestone 1 (combat probe)

Command: `npm run sim` (2,000 random 5v5 fights + 200 duels per class pairing). Class stats after the first balance pass (see DECISIONS.md).

Seed `m1`. Draws count as half a win.

#### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 2420 | 44.7% |
| Rogue | 2403 | 50.6% |
| Mage | 2416 | 44.3% |
| Cleric | 2396 | 53.0% |
| Ranger | 2346 | 54.5% |
| Necromancer | 2384 | 56.3% |

Draws: 3 (0.1%), tick-cap timeouts: 3, avg length: 98.8 ticks, longest: 1000 ticks (cap 1000).

#### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 55.0% | 100.0% | 71.0% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 56.5% | 100.0% | 71.3% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 100.0% | 40.0% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 100.0% | 40.0% |
| Ranger | 46.0% | 48.5% | 100.0% | 100.0% | – | 100.0% | 78.9% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

**Reading it**
- In 5v5 fights, every class is inside the 35–65% outlier band (44.3–56.3%). There are no outliers yet.
- The Necromancer is 0% in duels but strongest in teams. Dark Harvest only pays off when allies die, so that's working as intended.
- 1v1 duels are mostly deterministic (0% or 100%) because only Ranger uses randomness. They're a sanity check, not a target.
- 3 fights in 2,000 (0.15%) hit the tick cap. All were Cleric + Warrior walls out-healing incoming damage. See the open question in DESIGN.md.
- The real balance work starts in M3, when talents, items and synergies exist and bots play full runs.

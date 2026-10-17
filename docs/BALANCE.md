# Balance reports

Latest simulator output first. Regenerate with `npm run sim` (add `-- --out <file>` to save the raw report).

## 2026-10-17 — Milestone 2 (run loop)

Command: `npm run sim` (2,000 full runs per bot + the combat probe). Includes sudden death, the back-row melee penalty, and the coin-flip tie-break from review. Enemy scaling: 75% base, +3.75% HP / +2.75% ATK per round.

Seed `m2`. Draws count as half a win.

#### Full runs (2000 per bot, starter classes)

| Bot | Runs | Completed (10 wins) | Avg wins | Avg rounds | Draw rate | Avg unspent gold | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|
| random | 2000 | 11.3% | 6.45 | 11.0 | 0.1% | 32.2 | 0 |
| sensible | 2000 | 14.4% | 7.66 | 12.2 | 0.1% | 36.1 | 0 |

- **random**: Buys random affordable units into random slots; rerolls 30% of the time when it has spare gold.
- **sensible**: Wants 2 frontliners, then class variety; auto-places; rerolls only to find a missing frontliner.

##### Fight win rate by round

| Round | random | sensible |
|---:|---:|---:|
| 1 | 100.0% (2000) | 99.3% (2000) |
| 2 | 100.0% (2000) | 100.0% (2000) |
| 3 | 100.0% (2000) | 100.0% (2000) |
| 4 | 89.0% (2000) | 98.9% (2000) |
| 5 | 69.3% (2000) | 89.1% (2000) |
| 6 | 54.3% (2000) | 78.5% (2000) |
| 7 | 40.0% (2000) | 56.1% (2000) |
| 8 | 27.3% (2000) | 41.8% (2000) |
| 9 | 23.4% (1898) | 34.0% (1995) |
| 10 | 25.0% (1632) | 29.4% (1964) |
| 11 | 21.3% (1181) | 22.5% (1783) |
| 12 | 17.5% (767) | 19.5% (1395) |
| 13 | 15.8% (412) | 11.1% (875) |
| 14 | 7.3% (177) | 7.7% (352) |
| 15 | – | 0.0% (4) |

##### Runs ending with N wins

| Wins | random | sensible |
|---:|---:|---:|
| 0 | 0 | 0 |
| 1 | 0 | 0 |
| 2 | 0 | 0 |
| 3 | 103 | 5 |
| 4 | 266 | 32 |
| 5 | 370 | 115 |
| 6 | 354 | 318 |
| 7 | 315 | 445 |
| 8 | 202 | 473 |
| 9 | 163 | 323 |
| 10 | 227 | 289 |

##### Fight win rate with class on the board

| Class | random | sensible |
|---|---:|---:|
| Mage | 56.9% | 60.3% |
| Ranger | 60.4% | 61.7% |
| Rogue | 56.7% | 62.3% |
| Warrior | 53.7% | 62.4% |
| Cleric | 59.5% | 61.7% |

#### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 2353 | 45.5% |
| Rogue | 2369 | 49.1% |
| Mage | 2361 | 43.5% |
| Cleric | 2340 | 53.5% |
| Ranger | 2430 | 55.7% |
| Necromancer | 2392 | 56.7% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 97.8 ticks, longest: 367 ticks (cap 1000).

#### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.0% | 100.0% | 70.2% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 54.0% | 100.0% | 70.8% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 100.0% | 40.0% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 100.0% | 40.0% |
| Ranger | 48.5% | 42.0% | 100.0% | 100.0% | – | 100.0% | 78.1% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

**Reading it**
- **The difficulty curve is a ramp, not a wall.** Rounds 1–4 are near-certain wins (onboarding). The sensible bot's win rate falls from 89% in round 5 to about 50% in rounds 7–8 and about 10% by round 13. About 14% of runs reach 10 wins.
- **Choices matter a little.** Sensible beats random on completion (14.4% vs 11.3%) and average wins (7.7 vs 6.5). Every unit is still at base power; M3's talents, items and synergies are what create real decisions.
- **The tie-break fix mattered.** Before it, the player won about 78% of exact mirrors, which inflated run results. Fixing it dropped sensible completion to about 6% until enemy growth was eased.
- **There's no gold sink yet.** Bots enter combat with about 32–36 unspent gold on average. Items and progression in M3 should absorb it.
- **Sudden death works:** 0 tick-cap timeouts, the longest fight is about 370 ticks, and the draw rate is 0.1%.
- **Class balance holds:** every class is 44–57% in the 5v5 probe, with no outliers.

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

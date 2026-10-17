# Balance reports

Latest simulator output first. Regenerate with `npm run sim` (add `-- --out <file>` to save the raw report).

## 2026-10-17 — Milestone 2 (run loop)

Command: `npm run sim` (2,000 full runs per bot + the combat probe). Includes sudden death and the back-row melee penalty. Enemy scaling after the difficulty-curve pass (see DECISIONS.md).

Seed `m2`. Draws count as half a win.

#### Full runs (2000 per bot, starter classes)

| Bot | Runs | Completed (10 wins) | Avg wins | Avg rounds | Draw rate | Avg unspent gold | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|
| random | 2000 | 13.9% | 6.51 | 11.0 | 0.1% | 32.0 | 0 |
| sensible | 2000 | 14.0% | 7.68 | 12.2 | 0.1% | 36.0 | 0 |

- **random**: Buys random affordable units into random slots; rerolls 30% of the time when it has spare gold.
- **sensible**: Wants 2 frontliners, then class variety; auto-places; rerolls only to find a missing frontliner.

##### Fight win rate by round

| Round | random | sensible |
|---:|---:|---:|
| 1 | 100.0% (2000) | 99.3% (2000) |
| 2 | 100.0% (2000) | 100.0% (2000) |
| 3 | 100.0% (2000) | 100.0% (2000) |
| 4 | 88.3% (2000) | 99.1% (2000) |
| 5 | 76.0% (2000) | 94.2% (2000) |
| 6 | 48.8% (2000) | 68.1% (2000) |
| 7 | 38.9% (2000) | 52.3% (2000) |
| 8 | 31.5% (1999) | 46.7% (2000) |
| 9 | 27.6% (1892) | 40.7% (1997) |
| 10 | 24.7% (1616) | 30.5% (1968) |
| 11 | 24.0% (1140) | 26.3% (1765) |
| 12 | 16.2% (714) | 15.6% (1367) |
| 13 | 6.9% (398) | 7.8% (879) |
| 14 | 8.4% (154) | 3.7% (383) |
| 15 | 0.0% (1) | 0.0% (4) |

##### Runs ending with N wins

| Wins | random | sensible |
|---:|---:|---:|
| 0 | 0 | 0 |
| 1 | 0 | 0 |
| 2 | 1 | 0 |
| 3 | 107 | 3 |
| 4 | 278 | 29 |
| 5 | 362 | 136 |
| 6 | 336 | 299 |
| 7 | 271 | 430 |
| 8 | 229 | 461 |
| 9 | 138 | 363 |
| 10 | 278 | 279 |

##### Fight win rate with class on the board

| Class | random | sensible |
|---|---:|---:|
| Mage | 58.6% | 61.1% |
| Ranger | 61.6% | 62.1% |
| Rogue | 57.1% | 62.6% |
| Warrior | 54.1% | 62.4% |
| Cleric | 60.6% | 61.8% |

#### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 2353 | 45.0% |
| Rogue | 2369 | 48.6% |
| Mage | 2361 | 43.9% |
| Cleric | 2340 | 54.0% |
| Ranger | 2430 | 55.3% |
| Necromancer | 2392 | 57.0% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 97.1 ticks, longest: 367 ticks (cap 1000).

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
- **The difficulty curve is a ramp, not a wall.** Rounds 1–3 are near-certain wins (onboarding). The sensible bot's win rate falls from 94% in round 5 to about 50% in rounds 7–8 and under 10% by round 13. About 14% of runs reach 10 wins.
- **Choices barely matter yet.** Random and sensible bots complete at the same rate (about 14%), though sensible averages more wins (7.7 vs 6.5). Every unit is at base power, so composition and placement are the only levers. M3's talents, items and synergies are what create real decisions.
- **There's no gold sink yet.** Bots enter combat with about 30 unspent gold on average. Items and progression in M3 should absorb it.
- **Sudden death works:** 0 tick-cap timeouts (previously 0.15%), the longest fight is about 370 ticks, and the draw rate is 0.1%.
- **Class balance holds:** every class is 44–57% in the 5v5 probe, with no outliers. Per-class fight win rates in runs are 54–63%, all similar.

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

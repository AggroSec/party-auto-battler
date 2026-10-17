# Balance reports

Latest simulator output first. Regenerate with `npm run sim` (add `-- --out <file>` to save the raw report).

## 2026-10-17 — Milestone 3 review follow-up (taunt)

Command: `npm run sim` (same seed and settings as the M3 report below). Changes since then: the `taunt` effect, Knight's Holy Bulwark (shield 2 + 100% DEF and taunt for 1 turn, was 3 + 150% DEF), and the Warrior talent Bulwark replaced by Challenge (start of combat: taunt for 1 turn).

**Reading it**
- **Tuning taunt:** with 2-turn taunts and the old shields, Knight's lift went from +4.3 to +7.7 and Challenge from −0.9 to +9.0. 1-turn taunts, with the shields trimmed to pay for them, settle at Knight +5.4 and Challenge +5.9.
- **Backline protection:** player back-row deaths while a front-liner still stood fell from 62% to 56% of back-row deaths (sensible bot, 400 runs). Taunt uptime is about a third of a Knight's turns, so it helps without making the back row untouchable.
- **Unchanged overall:** completion is sensible 24.3%, greedy 21.1%, synergy 16.4%, random 5.9%, and the same 3 raw synergy outliers.
- **Lift spreads:** classes −1.3 to +2.4, advanced classes −2.5 to +5.4, items −2.0 to +3.8, synergies −1.2 to +7.4, talents −3.1 to +8.6. Adventuring Party tier 2 rose to +7.4, because Warrior-heavy parties got stronger. Accelerate (+8.6) is still the top talent.
- **The late-game wall Brandon hit in playtesting is visible here:** round 11 is about 19% for every bot, then 7%. This is the top item for M5.

Seed `m3`. Draws count as half a win.

##### Full runs (2000 per bot, starter classes)

| Bot | Completed (10 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 5.9% | 3.87 | 8.6 | 45.0% | 2.99 | 3.5 | 0.1% | 0 | 0 |
| sensible | 24.3% | 7.91 | 11.8 | 66.8% | 3.64 | 2.4 | 0.1% | 0 | 0 |
| greedy | 21.1% | 7.76 | 11.8 | 65.5% | 3.64 | 3.1 | 0.0% | 0 | 0 |
| synergy | 16.4% | 6.74 | 11.1 | 61.1% | 3.49 | 1.9 | 0.3% | 0 | 0 |

- **random**: Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices.
- **sensible**: Two frontliners then class variety; then items/training for its best units; random level-up choices.
- **greedy**: Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices the same way.
- **synergy**: Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.

###### Fight win rate by round

| Round | random | sensible | greedy | synergy |
|---:|---:|---:|---:|---:|
| 1 | 53.8% | 94.2% | 96.9% | 94.0% |
| 2 | 60.7% | 99.9% | 99.6% | 93.5% |
| 3 | 59.0% | 98.5% | 97.5% | 86.1% |
| 4 | 53.4% | 97.5% | 96.1% | 87.6% |
| 5 | 38.5% | 81.7% | 83.2% | 67.8% |
| 6 | 37.4% | 73.8% | 70.7% | 59.6% |
| 7 | 41.3% | 72.5% | 68.3% | 57.0% |
| 8 | 41.8% | 65.0% | 62.1% | 52.7% |
| 9 | 37.2% | 52.0% | 50.0% | 43.4% |
| 10 | 33.0% | 39.2% | 35.8% | 34.0% |
| 11 | 18.9% | 18.8% | 18.2% | 19.2% |
| 12 | 10.7% | 6.8% | 6.4% | 9.2% |
| 13 | 2.9% | 3.4% | 3.2% | 3.6% |
| 14 | 3.5% | 2.0% | 1.2% | 2.2% |
| 15 | 0.0% | 0.0% | 0.0% | 0.0% |
| 16 | – | – | – | 0.0% |

###### Pick-to-win rates (all bots combined)

Share of fights won while the entity was on the player's board (draws count half). Flagged if above 65.0% or below 35.0% with at least 300 fights. For reference, the overall fight win rate is 59.6%. **Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.

**Outliers (3):** Call of the Wild (tier 1) (synergy, 67.6%), Shadow Pact (tier 1) (synergy, 70.3%), Shield Wall (tier 1) (synergy, 68.8%)

####### Classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Warrior | 63646 | 61.7% | +2.4 |
| Ranger | 56509 | 61.3% | +1.8 |
| Rogue | 60786 | 61.2% | +1.8 |
| Cleric | 53573 | 60.5% | +0.9 |
| Mage | 46779 | 58.9% | −1.3 |

####### Advanced classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Knight | 30830 | 54.8% | +5.4 |
| Inquisitor | 24933 | 53.2% | +4.3 |
| Duelist | 31048 | 53.3% | +4.2 |
| Sharpshooter | 27591 | 53.3% | +3.8 |
| Chronomancer | 13742 | 52.4% | +2.5 |
| Pyromancer | 22371 | 51.3% | +1.4 |
| Berserker | 24732 | 49.5% | +0.3 |
| Beastmaster | 16302 | 49.6% | −0.5 |
| Priest | 15871 | 48.9% | −1.8 |
| Assassin | 17637 | 48.2% | −2.5 |

####### Synergies

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Adventuring Party (tier 2) | 4899 | 63.7% | +7.4 |
| Shield Wall (tier 1) | 14553 | 68.8% ⚠️ high | +6.3 |
| Martial Discipline (tier 2) | 31577 | 62.3% | +5.9 |
| Adventuring Party (tier 1) | 29930 | 61.2% | +4.6 |
| Vanguard (tier 1) | 40897 | 62.5% | +4.4 |
| Arcane Circle (tier 2) | 3895 | 61.1% | +4.4 |
| Divine Choir (tier 1) | 33905 | 55.5% | +3.0 |
| Shield Wall (tier 2) | 3853 | 63.9% | +1.1 |
| Shadow Pact (tier 1) | 10970 | 70.3% ⚠️ high | +0.7 |
| Call of the Wild (tier 1) | 8554 | 67.6% ⚠️ high | +0.6 |
| Martial Discipline (tier 1) | 42153 | 63.1% | −0.3 |
| Arcane Circle (tier 1) | 9611 | 58.4% | −1.2 |

####### Items

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Time Shard | 17224 | 46.9% | +3.8 |
| Giant's Belt | 21797 | 46.3% | +1.4 |
| Swift Boots | 20654 | 45.9% | +1.3 |
| Iron Sword | 21016 | 46.0% | +1.2 |
| Smoke Cloak | 20949 | 45.8% | +0.9 |
| Hourglass | 10742 | 44.0% | +0.4 |
| Chainmail | 20919 | 45.1% | +0.2 |
| Healing Charm | 20425 | 44.9% | +0.2 |
| Tower Shield | 17384 | 43.2% | +0.1 |
| Long Spear | 19642 | 44.8% | −0.1 |
| Spellbook | 18153 | 43.0% | −0.5 |
| Holy Symbol | 17679 | 42.2% | −1.0 |
| Rage Gauntlets | 17661 | 41.7% | −1.2 |
| Skull Totem | 17119 | 41.9% | −1.5 |
| Assassin's Dagger | 17531 | 42.1% | −1.7 |
| Vampiric Fang | 18316 | 41.4% | −1.7 |
| Hunting Bow | 17611 | 41.8% | −1.8 |
| Thorned Mail | 16987 | 41.4% | −2.0 |

####### Talents (top and bottom 10)

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Accelerate | 4418 | 47.4% | +8.6 |
| Aegis | 10806 | 44.3% | +7.1 |
| Righteous | 14833 | 45.4% | +6.4 |
| Challenge | 15936 | 61.3% | +5.9 |
| Steady Aim | 5632 | 44.3% | +5.9 |
| Haste | 4313 | 44.1% | +5.9 |
| Zeal | 12137 | 44.6% | +5.8 |
| En Garde | 16251 | 45.1% | +5.6 |
| Retribution | 11561 | 42.7% | +5.4 |
| Quickcast | 10717 | 61.1% | +5.1 |
| … 40 more … | | | |
| Evasion | 15338 | 55.5% | −0.7 |
| Divine Grace | 5209 | 39.3% | −0.7 |
| Holy Strike | 12164 | 55.9% | −0.8 |
| Frenzy | 4638 | 37.8% | −1.4 |
| Ignite | 11961 | 55.4% | −1.5 |
| Unstoppable | 4671 | 37.5% | −1.7 |
| Sanctuary | 11832 | 55.3% | −1.8 |
| Greater Heal | 5163 | 37.8% | −1.8 |
| Guardian Angel | 5321 | 37.2% | −2.3 |
| Toxin | 5965 | 36.3% | −3.1 |


##### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 2382 | 44.8% |
| Rogue | 2457 | 49.2% |
| Mage | 2377 | 43.9% |
| Cleric | 2360 | 53.3% |
| Ranger | 2349 | 56.7% |
| Necromancer | 2395 | 55.7% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 97.8 ticks, longest: 367 ticks (cap 1000).

##### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.5% | 100.0% | 70.3% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 52.5% | 100.0% | 70.5% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 100.0% | 40.0% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 100.0% | 40.0% |
| Ranger | 49.0% | 45.0% | 100.0% | 100.0% | – | 100.0% | 78.8% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

## 2026-10-17 — Milestone 3 (builds)

Command: `npm run sim`: 2,000 full runs for each of 4 bots, plus the combat probe. Includes XP and levels, talents, advanced classes, items, training, synergies, and enemies that develop the same way.

**Reading it**
- **Skill gradient:** sensible completes 24%, greedy 22%, synergy 15%, random 6%. The per-round win rate declines smoothly: about 95% through round 4, then 82, 72, 71, 65, 53, 39, 19, 7% (sensible).
- **Gold sinks work:** average unspent gold went from about 36 (M2) to 2–3. Items and training absorb it.
- **Raw outliers (brief's 65%/35% rule): 3,** all two-of-a-tag synergies (Call of the Wild, Shadow Pact, Shield Wall tier 1). They appear in early, easy rounds, which inflates their raw rate; round-adjusted lift puts them at +1 to +6.
- **Round-adjusted lift spreads:** classes −1.7 to +2.2, advanced classes −2.9 to +5.3, items −2.3 to +3.6, synergies −2.7 to +5.9, talents −3.2 to +8.2. Every advanced class and item sits within about ±5 points of an average fight in the same round.
- **For M5:** Accelerate (Chronomancer talent, +8.2) is the strongest remaining pick. From round 11 every bot wins only about 20% (then 7%, 4%), regardless of skill: a late-game wall. The greedy bot's power heuristic is no smarter than sensible.
- Combat stays healthy: 0 tick-cap hits, 0 stuck runs, and a 0.1–0.5% draw rate.

Seed `m3`. Draws count as half a win.

#### Full runs (2000 per bot, starter classes)

| Bot | Completed (10 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 5.9% | 3.87 | 8.6 | 44.9% | 2.99 | 3.4 | 0.1% | 0 | 0 |
| sensible | 24.4% | 7.89 | 11.8 | 66.8% | 3.64 | 2.5 | 0.1% | 0 | 0 |
| greedy | 21.5% | 7.75 | 11.8 | 65.6% | 3.64 | 3.1 | 0.1% | 0 | 0 |
| synergy | 15.1% | 6.68 | 11.1 | 60.6% | 3.49 | 1.9 | 0.5% | 0 | 0 |

- **random**: Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices.
- **sensible**: Two frontliners then class variety; then items/training for its best units; random level-up choices.
- **greedy**: Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices the same way.
- **synergy**: Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.

##### Fight win rate by round

| Round | random | sensible | greedy | synergy |
|---:|---:|---:|---:|---:|
| 1 | 54.7% | 94.2% | 96.9% | 94.0% |
| 2 | 62.8% | 99.9% | 99.6% | 93.2% |
| 3 | 58.3% | 98.2% | 97.5% | 86.1% |
| 4 | 53.8% | 96.0% | 96.3% | 86.5% |
| 5 | 38.5% | 82.3% | 82.0% | 65.8% |
| 6 | 37.2% | 72.4% | 70.4% | 57.6% |
| 7 | 38.9% | 71.2% | 68.1% | 56.9% |
| 8 | 40.1% | 65.0% | 61.6% | 52.0% |
| 9 | 36.7% | 53.4% | 50.9% | 43.9% |
| 10 | 31.4% | 39.3% | 35.6% | 33.1% |
| 11 | 20.8% | 19.4% | 19.9% | 20.1% |
| 12 | 9.3% | 7.3% | 6.3% | 10.1% |
| 13 | 4.3% | 4.5% | 3.1% | 5.7% |
| 14 | 1.0% | 1.9% | 1.9% | 2.4% |
| 15 | 0.0% | 0.0% | 0.0% | 12.5% |

##### Pick-to-win rates (all bots combined)

Share of fights won while the entity was on the player's board (draws count half). Flagged if above 65.0% or below 35.0% with at least 300 fights. For reference, the overall fight win rate is 59.5%. **Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.

**Outliers (3):** Call of the Wild (tier 1) (synergy, 70.1%), Shadow Pact (tier 1) (synergy, 71.6%), Shield Wall (tier 1) (synergy, 67.0%)

###### Classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Ranger | 57156 | 61.4% | +2.2 |
| Rogue | 60873 | 61.3% | +2.1 |
| Warrior | 63470 | 61.0% | +1.8 |
| Cleric | 53349 | 60.3% | +1.0 |
| Mage | 46812 | 58.4% | −1.7 |

###### Advanced classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Inquisitor | 24981 | 53.8% | +5.3 |
| Duelist | 31197 | 53.2% | +4.3 |
| Knight | 30350 | 53.6% | +4.3 |
| Sharpshooter | 28035 | 53.1% | +3.9 |
| Chronomancer | 13932 | 52.0% | +2.4 |
| Berserker | 24705 | 49.4% | +0.4 |
| Beastmaster | 16395 | 50.2% | +0.4 |
| Pyromancer | 22401 | 50.0% | +0.0 |
| Assassin | 17586 | 48.4% | −1.9 |
| Priest | 15931 | 47.4% | −2.9 |

###### Synergies

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Martial Discipline (tier 2) | 31728 | 62.2% | +5.9 |
| Adventuring Party (tier 2) | 4996 | 61.6% | +5.7 |
| Shield Wall (tier 1) | 14478 | 67.0% ⚠️ high | +4.9 |
| Adventuring Party (tier 1) | 30079 | 60.9% | +4.5 |
| Arcane Circle (tier 2) | 3982 | 60.3% | +3.9 |
| Vanguard (tier 1) | 40292 | 61.6% | +3.4 |
| Call of the Wild (tier 1) | 8388 | 70.1% ⚠️ high | +2.8 |
| Divine Choir (tier 1) | 33335 | 54.5% | +2.4 |
| Shadow Pact (tier 1) | 10806 | 71.6% ⚠️ high | +1.9 |
| Martial Discipline (tier 1) | 42043 | 62.6% | −0.8 |
| Shield Wall (tier 2) | 3941 | 60.6% | −2.1 |
| Arcane Circle (tier 1) | 9562 | 57.4% | −2.7 |

###### Items

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Time Shard | 17351 | 46.6% | +3.6 |
| Swift Boots | 20531 | 45.9% | +1.4 |
| Giant's Belt | 21718 | 46.1% | +1.3 |
| Smoke Cloak | 21054 | 45.9% | +1.2 |
| Hourglass | 10814 | 44.6% | +1.1 |
| Iron Sword | 20841 | 45.4% | +0.6 |
| Long Spear | 19621 | 44.8% | +0.3 |
| Chainmail | 20649 | 44.8% | +0.3 |
| Tower Shield | 17432 | 43.2% | −0.2 |
| Healing Charm | 20389 | 44.3% | −0.2 |
| Spellbook | 18234 | 42.8% | −0.8 |
| Holy Symbol | 17613 | 42.1% | −1.0 |
| Skull Totem | 16919 | 42.1% | −1.0 |
| Vampiric Fang | 18346 | 41.8% | −1.3 |
| Thorned Mail | 16880 | 41.9% | −1.5 |
| Assassin's Dagger | 17345 | 41.6% | −1.7 |
| Hunting Bow | 17602 | 41.7% | −1.9 |
| Rage Gauntlets | 17761 | 41.0% | −2.3 |

###### Talents (top and bottom 10)

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Accelerate | 4594 | 46.5% | +8.2 |
| Haste | 4327 | 44.9% | +7.1 |
| Zeal | 12314 | 45.6% | +6.9 |
| Aegis | 10923 | 43.2% | +5.6 |
| Alpha | 5668 | 43.9% | +5.5 |
| En Garde | 16445 | 44.8% | +5.5 |
| Piercing Arrows | 9761 | 42.7% | +5.5 |
| Steady Aim | 5556 | 44.0% | +5.4 |
| Righteous | 14648 | 44.8% | +5.4 |
| Shadowstep | 26826 | 59.8% | +4.8 |
| … 40 more … | | | |
| Fortress | 7498 | 37.5% | −0.8 |
| Bulwark | 15640 | 55.1% | −0.9 |
| Holy Strike | 11923 | 55.5% | −1.1 |
| Sanctuary | 11898 | 55.6% | −1.2 |
| Unstoppable | 4510 | 37.3% | −1.4 |
| Greater Heal | 5036 | 37.2% | −2.0 |
| Frenzy | 4710 | 37.1% | −2.2 |
| Toxin | 5935 | 36.6% | −2.4 |
| Ignite | 12089 | 53.7% | −3.0 |
| Guardian Angel | 4922 | 36.5% | −3.2 |


#### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 2382 | 44.8% |
| Rogue | 2457 | 49.2% |
| Mage | 2377 | 43.9% |
| Cleric | 2360 | 53.3% |
| Ranger | 2349 | 56.7% |
| Necromancer | 2395 | 55.7% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 97.8 ticks, longest: 367 ticks (cap 1000).

#### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.5% | 100.0% | 70.3% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 52.5% | 100.0% | 70.5% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 100.0% | 40.0% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 100.0% | 40.0% |
| Ranger | 49.0% | 45.0% | 100.0% | 100.0% | – | 100.0% | 78.8% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

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

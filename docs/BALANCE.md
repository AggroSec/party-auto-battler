# Balance reports

Latest simulator output first. Regenerate with `npm run sim` (add `-- --out <file>` to save the raw report).

## 2026-10-24 — After M7 (Runeblade, Dark Knight, Deathless Fury, Rivals)

Command: `npm run sim` (seed `m3`, 2,000 runs per bot, everything unlocked at tier 0, so both new classes are in every shop).

- **Completion is back near M7 after tuning:** sensible 21.8% (M7 18.8%), greedy 29.5% (M7 38.6%), synergy 10.3%, random 3.9%. The sensible bot gains a little because the Dark Knight gives it another frontliner to buy; greedy drops because it now spends picks on the new classes instead of the M7 synergy parties.
- **First pass was far too strong on the Dark Knight side:** Hellknight +16.6 lift, Dreadknight +14.5, Rivals +15.7, Dark Knight class +8.3. Dread was applied on every hit and a flat −1 ATK per stack (up to 3) nearly zeroes early enemies (ATK 5–6). Hellfire stacked to 9 on every attacker. Spellblade was weak (−10.7).
- **Changes, over three passes:** Dread caps at 2 stacks and lands by chance (30% base talent, 40% Dreadknight, 50% Subjugate); Dreadknight taunts 1 turn, not 2, with a smaller shield; Hellfire 20% ATK per stack up to 5, applied 50% of the time; Dark Knight HP 44 → 40 and Blood Price heals 50% ATK, not 75%; Blackguard and Crimson Lord lifesteal trimmed; Revenant rises at 30%, not 40%; Duskblade heals cut by about a third; Rivals became a single +3 ATK when an ally first falls. Spellblade carves 2 Runes per cast with an 80% splash on detonation; Stormblade and Dawnblade got small buffs; Earthwarden's shields were trimmed.
- **Where they landed (lift vs round average):** Dark Knight +3.7, Runeblade +1.9; Dreadknight +6.9, Duskblade +3.0, Spellblade +0.4, Blackguard −1.7. Tertiaries run from Revenant +7.6 and Earthwarden +7.1 (small samples, about 700–950 fights) to Crimson Lord −0.7. Rivals' +7.8 is mostly composition: it only exists in parties with two melee frontliners, which the sensible bot favours.
- **1v1 duels:** both new classes win most duels at level 1. A lone target means every Rune lands on the same enemy, and the Dark Knight drains through anything. Duels are a sanity check; in random 5v5 parties they sit mid-pack (Runeblade 50.1%, Dark Knight 56.8%, Warrior 59.4%).
- **Deathless Fury** shows up too rarely in the bot runs to judge (random talent picks, and only Berserkers).

- **Ladder:** not re-run for this PR (the ladder simulation takes about 40 minutes and Brandon asked to open the PR first). The ladder itself didn't change; a follow-up will add the table if anything stands out.

Seed `m3`. Draws count as half a win.

### Full runs (2000 per bot, all content, ladder tier 0)

| Bot | Completed (15 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 3.9% | 3.49 | 8.4 | 41.8% | 3.11 | 3.2 | 0.1% | 0 | 0 |
| sensible | 21.8% | 8.97 | 13.1 | 68.5% | 4.27 | 2.4 | 0.1% | 0 | 0 |
| greedy | 29.5% | 10.16 | 13.9 | 73.1% | 4.47 | 2.4 | 0.0% | 0 | 0 |
| synergy | 10.3% | 6.03 | 10.6 | 56.7% | 3.82 | 1.7 | 0.1% | 0 | 0 |

- **random**: Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices and stat points.
- **sensible**: Two frontliners then class variety; then items/training for its best units; random level-up choices.
- **greedy**: Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices and stat points the same way.
- **synergy**: Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.

#### Fight win rate by round

| Round | random | sensible | greedy | synergy |
|---:|---:|---:|---:|---:|
| 1 | 53.5% | 96.2% | 97.5% | 95.0% |
| 2 | 54.9% | 99.8% | 99.9% | 82.1% |
| 3 | 44.3% | 92.5% | 95.7% | 66.5% |
| 4 | 40.7% | 89.3% | 91.5% | 65.2% |
| 5 | 34.4% | 77.4% | 83.4% | 53.4% |
| 6 | 32.4% | 65.2% | 73.3% | 41.3% |
| 7 | 25.5% | 49.6% | 59.6% | 32.4% |
| 8 | 26.6% | 46.1% | 55.9% | 32.9% |
| 9 | 31.9% | 46.7% | 55.2% | 38.1% |
| 10 | 39.3% | 48.4% | 55.2% | 43.1% |
| 11 | 44.9% | 48.2% | 53.4% | 43.2% |
| 12 | 48.9% | 56.9% | 61.3% | 54.7% |
| 13 | 57.3% | 66.5% | 74.1% | 64.2% |
| 14 | 69.4% | 77.3% | 80.6% | 73.7% |
| 15 | 73.1% | 80.0% | 83.1% | 69.0% |
| 16 | 64.9% | 65.5% | 67.8% | 57.0% |
| 17 | 47.5% | 34.6% | 34.1% | 34.3% |
| 18 | 26.2% | 19.1% | 9.0% | 18.3% |
| 19 | 10.0% | 10.5% | 6.7% | 20.6% |
| 20 | 0.0% | – | – | 0.0% |

#### Pick-to-win rates (all bots combined)

Share of fights won while the entity was on the player's board (draws count half). Flagged if above 65.0% or below 35.0% with at least 300 fights. For reference, the overall fight win rate is 60.1%. **Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.

**Outliers (74):** Shadow Pact (tier 1) (synergy, 65.5%), Cleric (class, 65.8%), Vanguard (tier 1) (synergy, 66.1%), Holy Trinity (tier 1) (synergy, 67.8%), Legion of Night (tier 1) (synergy, 65.9%), Legion of Night (tier 2) (synergy, 68.2%), Twilight Pact (tier 1) (synergy, 67.1%), Necromancer (class, 65.3%), Arcane Circle (tier 1) (synergy, 65.9%), Life and Death (tier 1) (synergy, 70.1%), Inquisitor (advanced, 65.1%), Sanctified Blade (talent, 65.5%), Bard (class, 67.5%), Warrior (class, 66.4%), Shield Wall (tier 1) (synergy, 67.9%), Rivals (tier 1) (synergy, 67.7%), Polearm Training (talent, 68.2%), Battle Hymn (tier 1) (synergy, 73.1%), Allegro (talent, 68.0%), Quickcast (talent, 68.4%), Devotion (talent, 69.1%), Knight (advanced, 65.1%), Second Verse (talent, 65.4%), Zeal (talent, 67.7%), Harmony (talent, 67.3%), Trickster (advanced, 69.4%), Corpse Explosion (talent, 66.0%), Arcane Circle (tier 2) (synergy, 70.2%), Lorekeeper (tertiary, 71.9%), Oracle (tertiary, 73.8%), Nightblade (tertiary, 70.6%), Blightlord (tertiary, 67.8%), Jinx (talent, 68.7%), Cacophony (talent, 69.4%), Vanish (talent, 68.6%), Harlequin (tertiary, 75.6%), Warlord (tertiary, 72.9%), Trapper (tertiary, 68.9%), Pit Lord (tertiary, 72.3%), Soul Siphon (talent, 65.7%), Righteous (talent, 65.8%), Doombringer (tertiary, 67.0%), Siege Master (tertiary, 71.4%), Phoenix (tertiary, 74.5%), Soul Reaper (tertiary, 66.5%), Stoneguard (tertiary, 68.6%), Vanguard (tertiary, 70.6%), Warchanter (tertiary, 71.3%), Illusionist (tertiary, 71.5%), Chronarch (tertiary, 74.4%), Hellknight (tertiary, 65.1%), Revenant (tertiary, 70.6%), Rotcaller (tertiary, 68.3%), Backfire (talent, 69.6%), Swordmaster (tertiary, 65.1%), Templar (tertiary, 74.0%), Firelord (tertiary, 71.0%), Shadowdancer (tertiary, 71.8%), Archlich (tertiary, 74.3%), Bloodreaver (tertiary, 70.3%), Earthwarden (tertiary, 70.4%), Entropist (tertiary, 75.8%), Artificer (tertiary, 69.3%), Curseweaver (tertiary, 66.0%), Soulbinder (tertiary, 69.1%), High Priest (tertiary, 70.2%), Voidblade (tertiary, 65.2%), Paladin (tertiary, 71.2%), Tyrant (tertiary, 67.1%), Elder Bear (tertiary, 65.7%), Radiance (talent, 66.8%), Crusade (talent, 67.2%), Falconer (tertiary, 66.7%), Demon Skin (talent, 70.1%)

##### Classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Bard | 27925 | 67.5% ⚠️ high | +6.3 |
| Warrior | 34862 | 66.4% ⚠️ high | +5.4 |
| Cleric | 26625 | 65.8% ⚠️ high | +4.4 |
| Necromancer | 27516 | 65.3% ⚠️ high | +4.1 |
| Dark Knight | 35012 | 64.6% | +3.7 |
| Mage | 24662 | 63.7% | +2.2 |
| Runeblade | 34213 | 63.0% | +1.9 |
| Rogue | 32189 | 61.9% | +0.7 |
| Monk | 32513 | 61.2% | +0.2 |
| Ranger | 26444 | 60.4% | −0.8 |
| Warlock | 26056 | 60.2% | −1.3 |
| Druid | 27336 | 58.1% | −3.1 |
| Engineer | 21100 | 54.7% | −7.1 |

##### Advanced classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Trickster | 11944 | 69.4% ⚠️ high | +13.5 |
| Knight | 18533 | 65.1% ⚠️ high | +9.7 |
| Inquisitor | 12510 | 65.1% ⚠️ high | +9.5 |
| Lich | 14438 | 62.9% | +7.6 |
| Dreadknight | 15162 | 62.1% | +6.9 |
| Pyromancer | 12066 | 61.3% | +6.0 |
| Assassin | 14687 | 59.5% | +4.3 |
| Iron Fist | 12209 | 59.0% | +4.1 |
| Chronomancer | 6277 | 59.2% | +3.8 |
| Duskblade | 11979 | 58.0% | +3.0 |
| Priest | 7488 | 57.8% | +2.8 |
| Skald | 9373 | 57.0% | +2.2 |
| Demonologist | 9715 | 57.2% | +2.1 |
| Plaguelord | 6606 | 55.5% | +0.7 |
| Spellblade | 14435 | 55.4% | +0.4 |
| Grove Warden | 7451 | 55.0% | +0.2 |
| Hexer | 9354 | 54.3% | −0.4 |
| Berserker | 8928 | 54.5% | −0.4 |
| Beastmaster | 9810 | 54.2% | −0.6 |
| Blackguard | 12337 | 52.8% | −1.7 |
| Shapeshifter | 12688 | 52.6% | −2.2 |
| Sharpshooter | 10163 | 52.2% | −2.5 |
| Windwalker | 12589 | 50.2% | −4.4 |
| Demolitionist | 8905 | 50.0% | −4.7 |
| Duelist | 9746 | 47.8% | −6.6 |
| Machinist | 6079 | 47.2% | −7.3 |

##### Tertiary classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Entropist | 504 | 75.8% ⚠️ high | +12.0 |
| Harlequin | 1684 | 75.6% ⚠️ high | +11.8 |
| Oracle | 744 | 73.8% ⚠️ high | +11.7 |
| Templar | 2270 | 74.0% ⚠️ high | +11.2 |
| Phoenix | 1550 | 74.5% ⚠️ high | +11.2 |
| Archlich | 2220 | 74.3% ⚠️ high | +11.2 |
| Chronarch | 590 | 74.4% ⚠️ high | +11.1 |
| Lorekeeper | 565 | 71.9% ⚠️ high | +10.2 |
| Warlord | 542 | 72.9% ⚠️ high | +9.8 |
| Warchanter | 1054 | 71.3% ⚠️ high | +9.7 |
| Siege Master | 891 | 71.4% ⚠️ high | +9.6 |
| Shadowdancer | 2071 | 71.8% ⚠️ high | +9.5 |
| Pit Lord | 1335 | 72.3% ⚠️ high | +9.1 |
| High Priest | 672 | 70.2% ⚠️ high | +9.0 |
| Firelord | 813 | 71.0% ⚠️ high | +8.8 |
| Artificer | 472 | 69.3% ⚠️ high | +8.6 |
| Nightblade | 808 | 70.6% ⚠️ high | +8.6 |
| Paladin | 2632 | 71.2% ⚠️ high | +8.4 |
| Illusionist | 1245 | 71.5% ⚠️ high | +8.4 |
| Soulbinder | 372 | 69.1% ⚠️ high | +8.3 |
| Vanguard | 1591 | 70.6% ⚠️ high | +8.2 |
| Revenant | 707 | 70.6% ⚠️ high | +7.6 |
| Rotcaller | 526 | 68.3% ⚠️ high | +7.4 |
| Earthwarden | 943 | 70.4% ⚠️ high | +7.1 |
| Stoneguard | 1723 | 68.6% ⚠️ high | +6.9 |
| Blightlord | 611 | 67.8% ⚠️ high | +6.8 |
| Trapper | 1050 | 68.9% ⚠️ high | +6.7 |
| Bloodreaver | 892 | 70.3% ⚠️ high | +6.5 |
| Curseweaver | 403 | 66.0% ⚠️ high | +5.7 |
| Doombringer | 1156 | 67.0% ⚠️ high | +4.7 |
| Soul Reaper | 786 | 66.5% ⚠️ high | +4.7 |
| Tyrant | 2517 | 67.1% ⚠️ high | +4.7 |
| Falconer | 1043 | 66.7% ⚠️ high | +4.3 |
| Elder Bear | 1528 | 65.7% ⚠️ high | +4.1 |
| Swordmaster | 767 | 65.1% ⚠️ high | +3.9 |
| Hellknight | 709 | 65.1% ⚠️ high | +3.7 |
| Grandmaster | 596 | 64.4% | +3.2 |
| Packlord | 617 | 63.3% | +3.0 |
| Voidblade | 1401 | 65.2% ⚠️ high | +3.0 |
| Deadeye | 546 | 63.2% | +2.9 |
| Stormfist | 1486 | 62.7% | +1.6 |
| Roboticist | 280 | 63.9% | +1.2 |
| Stormblade | 1527 | 62.9% | +0.2 |
| Bombardier | 369 | 62.6% | −0.2 |
| Dawnblade | 853 | 61.7% | −0.5 |
| Archdruid | 763 | 60.9% | −0.6 |
| Wildstalker | 709 | 60.8% | −0.6 |
| Crimson Lord | 1358 | 60.2% | −0.7 |
| Zealot | 588 | 60.5% | −0.9 |
| Treelord | 507 | 61.1% | −1.8 |
| Swashbuckler | 465 | 60.2% | −2.3 |
| Mistwalker | 318 | 58.5% | −3.3 |

##### Synergies

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Battle Hymn (tier 1) | 9457 | 73.1% ⚠️ high | +12.9 |
| Twilight Pact (tier 1) | 7806 | 67.1% ⚠️ high | +12.8 |
| Legion of Night (tier 2) | 8711 | 68.2% ⚠️ high | +10.9 |
| Arcane Circle (tier 2) | 13797 | 70.2% ⚠️ high | +10.3 |
| Champions of Light (tier 1) | 3423 | 64.7% | +9.9 |
| Life and Death (tier 1) | 7108 | 70.1% ⚠️ high | +9.7 |
| Divine Choir (tier 1) | 15640 | 63.5% | +8.2 |
| Vanguard (tier 1) | 34278 | 66.1% ⚠️ high | +8.2 |
| Shield Wall (tier 1) | 16757 | 67.9% ⚠️ high | +7.8 |
| Rivals (tier 1) | 12143 | 67.7% ⚠️ high | +7.8 |
| Holy Trinity (tier 1) | 40163 | 67.8% ⚠️ high | +7.7 |
| Legion of Night (tier 1) | 14196 | 65.9% ⚠️ high | +6.3 |
| Shield Wall (tier 2) | 7504 | 63.8% | +5.9 |
| Adventuring Party (tier 2) | 36371 | 64.3% | +5.4 |
| Shadow Pact (tier 1) | 44288 | 65.5% ⚠️ high | +4.9 |
| Martial Discipline (tier 2) | 19211 | 62.8% | +4.1 |
| Arcane Circle (tier 1) | 23721 | 65.9% ⚠️ high | +4.0 |
| Inner Harmony (tier 2) | 2740 | 63.3% | +3.6 |
| Wild Hunt (tier 1) | 9596 | 62.2% | +2.4 |
| Call of the Wild (tier 1) | 10723 | 64.2% | +1.9 |
| Nature's Bond (tier 1) | 5821 | 61.3% | +1.9 |
| Inner Harmony (tier 1) | 9243 | 63.8% | +1.8 |
| Martial Discipline (tier 1) | 49059 | 64.0% | +1.5 |
| Adventuring Party (tier 1) | 33069 | 60.8% | +1.3 |
| Dark Covenant (tier 1) | 4459 | 59.9% | −0.1 |
| Mad Science (tier 1) | 5402 | 59.7% | −1.3 |
| Champions of Light (tier 2) | 786 | 52.0% | −1.5 |
| Workshop (tier 1) | 2468 | 49.5% | −10.7 |

##### Items

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Gravebound Plate | 6 | 100.0% | +36.2 |
| Grandmaster's Sash | 6 | 100.0% | +34.0 |
| Crimson Chalice | 2 | 100.0% | +28.1 |
| Hellforge Collar | 4 | 100.0% | +27.5 |
| Hourglass of Ruin | 4 | 100.0% | +27.5 |
| Jester's Bells | 8 | 100.0% | +27.5 |
| Shadowfang | 3 | 100.0% | +26.2 |
| Siege Plans | 10 | 80.0% | +19.6 |
| Hall of Mirrors | 11 | 81.8% | +16.9 |
| Black Grimoire | 5 | 80.0% | +14.9 |
| Dawnbringer | 8 | 62.5% | +6.6 |
| Crusader's Oath | 26 | 61.5% | +6.1 |
| Phylactery Crystal | 13 | 61.5% | +4.0 |
| Featherweight Charm | 16798 | 58.3% | +3.0 |
| Gearbox | 18186 | 58.0% | +2.8 |
| Aegis of the Unbroken | 10 | 50.0% | +2.2 |
| Smoke Cloak | 16692 | 57.2% | +2.0 |
| Iron Sword | 17777 | 56.8% | +1.7 |
| Giant's Belt | 17890 | 56.9% | +1.7 |
| Payload Detonator | 18 | 61.1% | +1.6 |
| Swift Boots | 16709 | 56.9% | +1.5 |
| Chainmail | 18093 | 56.5% | +1.4 |
| Horde Banner | 8 | 62.5% | +1.3 |
| Quicksilver Rapier | 11831 | 55.9% | +1.1 |
| Oak Heart | 17288 | 56.1% | +1.0 |
| Cursed Tome | 16926 | 55.9% | +0.8 |
| Prayer Beads | 16126 | 55.8% | +0.6 |
| Adrenaline Vial | 14540 | 55.6% | +0.5 |
| Long Spear | 16099 | 55.6% | +0.4 |
| Alpha's Fang | 21 | 66.7% | +0.3 |
| Winged Sandals | 6962 | 55.1% | +0.3 |
| Time Shard | 9955 | 54.7% | −0.0 |
| Soulstone | 9247 | 54.2% | −0.6 |
| Healing Charm | 13686 | 54.3% | −0.6 |
| Ashen Heart | 9 | 55.6% | −0.9 |
| Executioner's Axe | 9158 | 53.7% | −1.0 |
| Phoenix Feather | 6808 | 53.2% | −1.7 |
| Soul Gem | 14 | 57.1% | −2.0 |
| Enchanted Lute | 10749 | 52.8% | −2.0 |
| Veil of Night | 16 | 56.3% | −2.0 |
| Vampiric Fang | 12201 | 52.7% | −2.1 |
| Spellbook | 10902 | 52.5% | −2.2 |
| Holy Symbol | 10444 | 52.1% | −2.6 |
| Rage Gauntlets | 8932 | 51.9% | −2.8 |
| War Banner | 6961 | 52.1% | −2.9 |
| Thorned Mail | 8887 | 51.8% | −3.2 |
| Skull Totem | 9667 | 51.5% | −3.2 |
| Hourglass | 6083 | 51.8% | −3.3 |
| Assassin's Dagger | 10429 | 51.2% | −3.5 |
| Tome of Sagas | 12 | 50.0% | −3.5 |
| Tower Shield | 10029 | 50.7% | −4.1 |
| Hunting Bow | 9612 | 49.7% | −4.9 |
| Mirror Shard | 6468 | 49.1% | −5.5 |
| Master Toolkit | 5 | 60.0% | −5.6 |
| Gambler's Coin | 6724 | 47.1% | −7.8 |
| Moonfang Claws | 7 | 42.9% | −14.1 |
| Chalice of Mercy | 8 | 37.5% | −15.0 |
| Warhorn | 6 | 50.0% | −15.6 |
| Plague Censer | 22 | 36.4% | −20.6 |
| Hawkeye Scope | 6 | 50.0% | −20.8 |
| Blood Moon Idol | 2 | 50.0% | −23.0 |
| Spiked Snares | 2 | 50.0% | −23.0 |
| Tempest Edge | 3 | 33.3% | −41.6 |
| Brand of Zeal | 1 | 0.0% | −68.4 |

##### Talents (top and bottom 10)

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Net Throw | 43 | 69.8% | +24.4 |
| Phylactery | 34 | 67.6% | +20.6 |
| Null Field | 58 | 72.4% | +19.7 |
| Clarity | 111 | 68.0% | +17.9 |
| Second Grave | 88 | 70.5% | +16.2 |
| Fate Ward | 127 | 68.9% | +15.9 |
| Epic | 75 | 72.0% | +15.7 |
| Stasis | 82 | 69.5% | +15.5 |
| Hex Ward | 66 | 63.6% | +14.3 |
| Backfire | 5391 | 69.6% ⚠️ high | +14.2 |
| … 345 more … | | | |
| Vengeance | 3302 | 43.8% | −9.1 |
| Exsanguinate | 194 | 40.2% | −9.5 |
| Void Bloom | 135 | 41.5% | −9.5 |
| Repair Kit | 4714 | 49.5% | −9.6 |
| Flourish | 3120 | 43.1% | −9.8 |
| Sapling | 76 | 47.4% | −10.1 |
| Veil | 34 | 35.3% | −10.4 |
| Short Fuse | 2046 | 41.6% | −10.8 |
| Harass | 60 | 40.0% | −12.1 |
| Serenity | 37 | 35.1% | −18.1 |


### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 1310 | 59.4% |
| Rogue | 1293 | 40.8% |
| Mage | 1335 | 45.2% |
| Cleric | 1397 | 59.2% |
| Ranger | 1291 | 52.1% |
| Monk | 1325 | 52.7% |
| Bard | 1315 | 51.4% |
| Druid | 1338 | 41.0% |
| Warlock | 1263 | 52.9% |
| Engineer | 1315 | 39.3% |
| Necromancer | 1305 | 51.3% |
| Runeblade | 1311 | 50.1% |
| Dark Knight | 1334 | 56.8% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 87.1 ticks, longest: 271 ticks (cap 1000).

### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Monk | Bard | Druid | Warlock | Engineer | Necromancer | Runeblade | Dark Knight | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.5% | 0.0% | 100.0% | 97.5% | 100.0% | 17.0% | 100.0% | 0.0% | 0.0% | 55.5% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 62.5% | 0.0% | 100.0% | 83.0% | 100.0% | 33.0% | 100.0% | 0.0% | 0.0% | 56.5% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 0.0% | 100.0% | 0.0% | 48.0% | 0.0% | 100.0% | 0.0% | 0.0% | 29.0% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 100.0% | 0.0% | 0.0% | 0.0% | 100.0% | 0.0% | 0.0% | 25.0% |
| Ranger | 45.0% | 39.0% | 100.0% | 100.0% | – | 0.0% | 100.0% | 57.0% | 6.0% | 11.5% | 100.0% | 0.0% | 0.0% | 46.5% |
| Monk | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | – | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 0.0% | 0.0% | 83.3% |
| Bard | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| Druid | 0.5% | 14.0% | 100.0% | 100.0% | 45.5% | 0.0% | 100.0% | – | 75.5% | 5.0% | 87.0% | 0.0% | 0.0% | 44.0% |
| Warlock | 0.0% | 0.0% | 57.5% | 100.0% | 93.0% | 0.0% | 100.0% | 23.5% | – | 87.0% | 100.0% | 0.0% | 0.0% | 46.8% |
| Engineer | 84.5% | 71.5% | 100.0% | 100.0% | 84.5% | 0.5% | 100.0% | 95.5% | 8.0% | – | 100.0% | 0.0% | 17.3% | 63.5% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 100.0% | 21.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 10.1% |
| Runeblade | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | – | 100.0% | 100.0% |
| Dark Knight | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 83.5% | 100.0% | 0.0% | – | 90.3% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

## 2026-10-22 — Milestone 7 (meta progression, ladder, signature items)

Command: `npm run sim` (seed `m3`, 2,000 runs per bot). The simulator plays with **everything unlocked at tier 0**, so this run includes the Necromancer, the 6 new items, 44 signature items and 8 new synergies. The ladder table comes from `runBot` at each tier (800 runs per bot per tier). `npm run sim -- --only ladder` reproduces it, more slowly.

- **Sensible bot unchanged** (18.8% completion; M6 20.3%). **Greedy rose from 28.1% to 38.6%,** almost entirely from the new synergies steering its picks. Adding Holy Trinity alone took it from 27% to 34%, and Legion of Night alone to 32%. The bonuses are small (+3 HP for Holy Trinity), so the gain is the bot buying tank-plus-healer and shadow parties it previously didn't. Adding the Necromancer and the new items moved it by 2–5 points.
- **New synergy lifts** run from +16.5 (Twilight Pact) down to +1.3 (Mad Science). Lift here is composition-biased: Twilight needs four mature units (two Light, two Dark advanced classes), which only invested parties field. All were trimmed twice (see DECISIONS.md).
- **Signature items barely appear in the bot runs** (3–20 fights each), because few bot units reach level 7 and the bots value items only by stats. Their lifts are noise. Your play is the test.
- **Ladder** (completion, average wins):

| Tier | Adds | Sensible | Greedy |
|---:|---|---|---|
| 0 | — | 17.1% · 8.5 | 39.0% · 10.9 |
| 1 | Reroll +1g | 20.9% · 8.8 | 36.6% · 10.9 |
| 2 | Start −1 gold | 14.8% · 7.6 | 27.0% · 9.6 |
| 3 | Interest cap −1 | 12.1% · 7.1 | 27.4% · 9.4 |
| 4 | −1 life | 14.8% · 7.3 | 28.6% · 9.7 |
| 5 | Enemies +5% | 5.6% · 5.7 | 16.0% · 7.7 |
| 6 | Enemy items from round 8 | 3.6% · 5.2 | 8.4% · 6.7 |
| 7 | Elites from round 8 | 2.8% · 5.1 | 5.8% · 6.4 |
| 8 | Bosses on 5/10/15 | 1.5% · 4.2 | 1.3% · 5.2 |
| 9 | Elites from round 5 | 0.4% · 4.1 | 0.9% · 4.9 |
| 10 | +5% and empowered bosses | 0.0% · 3.4 | 0.1% · 4.0 |

  Tiers 0–4 are within noise of each other for the bots; they mostly cost tempo, which bots use poorly anyway. Enemy strength is what bites, so it comes from tier 5 on in small steps. The first pass (+10% enemy stats at tier 1, a full extra enemy level at tier 7, Elites +30% and a level) made tier 1 halve completion and tier 7+ hopeless.
- **Bots are much weaker than a person** (you clear tier 0 nearly every run), so tiers 8–10 are meant to be hard for a skilled player. They're the first thing to tune from your playtests.

Seed `m3`. Draws count as half a win.

### Full runs (2000 per bot, all content, ladder tier 0)

| Bot | Completed (15 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 5.0% | 3.60 | 8.4 | 42.8% | 3.14 | 3.2 | 0.0% | 0 | 0 |
| sensible | 18.8% | 8.60 | 12.9 | 66.8% | 4.22 | 2.2 | 0.1% | 0 | 0 |
| greedy | 38.6% | 10.83 | 14.2 | 76.4% | 4.54 | 2.4 | 0.0% | 0 | 0 |
| synergy | 11.9% | 6.39 | 10.9 | 58.6% | 3.87 | 1.7 | 0.1% | 0 | 0 |

- **random**: Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices and stat points.
- **sensible**: Two frontliners then class variety; then items/training for its best units; random level-up choices.
- **greedy**: Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices and stat points the same way.
- **synergy**: Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.

#### Fight win rate by round

| Round | random | sensible | greedy | synergy |
|---:|---:|---:|---:|---:|
| 1 | 49.1% | 92.7% | 94.7% | 92.2% |
| 2 | 55.8% | 99.9% | 99.7% | 81.7% |
| 3 | 45.3% | 90.4% | 95.7% | 69.5% |
| 4 | 42.0% | 89.4% | 91.4% | 67.0% |
| 5 | 35.4% | 76.3% | 85.6% | 56.4% |
| 6 | 34.6% | 63.4% | 77.0% | 45.6% |
| 7 | 26.7% | 46.6% | 64.4% | 35.3% |
| 8 | 28.6% | 43.8% | 63.1% | 36.9% |
| 9 | 35.2% | 44.1% | 62.4% | 41.8% |
| 10 | 43.8% | 43.6% | 59.0% | 45.2% |
| 11 | 45.4% | 45.9% | 58.9% | 46.4% |
| 12 | 48.6% | 54.8% | 67.5% | 54.7% |
| 13 | 62.5% | 65.9% | 79.0% | 66.1% |
| 14 | 71.9% | 75.1% | 85.8% | 72.6% |
| 15 | 84.3% | 80.9% | 88.8% | 77.1% |
| 16 | 67.9% | 65.8% | 71.9% | 62.3% |
| 17 | 45.4% | 34.5% | 33.3% | 36.2% |
| 18 | 24.2% | 21.1% | 13.7% | 12.8% |
| 19 | 16.7% | 12.6% | 12.1% | 11.3% |
| 20 | – | – | 0.0% | 0.0% |

#### Pick-to-win rates (all bots combined)

Share of fights won while the entity was on the player's board (draws count half). Flagged if above 65.0% or below 35.0% with at least 300 fights. For reference, the overall fight win rate is 61.2%. **Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.

**Outliers (90):** Necromancer (class, 66.3%), Cleric (class, 66.9%), Shadow Pact (tier 1) (synergy, 67.4%), Life and Death (tier 1) (synergy, 71.1%), Call of the Wild (tier 1) (synergy, 68.2%), Nature's Bond (tier 1) (synergy, 65.7%), Vanguard (tier 1) (synergy, 67.2%), Holy Trinity (tier 1) (synergy, 68.4%), Divine Choir (tier 1) (synergy, 66.2%), Falconer (tertiary, 69.6%), Elder Bear (tertiary, 69.4%), Blightlord (tertiary, 68.2%), High Priest (tertiary, 68.5%), Legion of Night (tier 1) (synergy, 68.0%), Bard (class, 67.5%), Warrior (class, 67.3%), Battle Hymn (tier 1) (synergy, 73.0%), Second Verse (talent, 65.5%), Arcane Circle (tier 1) (synergy, 69.0%), Devotion (talent, 70.5%), Shield Wall (tier 1) (synergy, 66.6%), Inquisitor (advanced, 67.4%), Dirge (talent, 67.1%), Soul Siphon (talent, 68.4%), Trickster (advanced, 68.9%), Inner Harmony (tier 1) (synergy, 66.5%), Legion of Night (tier 2) (synergy, 70.7%), Lich (advanced, 65.3%), Frost Armor (talent, 66.0%), Undying (talent, 66.4%), Zeal (talent, 71.6%), Shadowdancer (tertiary, 75.8%), Sanctified Blade (talent, 70.5%), Archlich (tertiary, 76.6%), Quickcast (talent, 65.5%), Long Stance (talent, 65.9%), Arcane Circle (tier 2) (synergy, 74.4%), Allegro (talent, 67.5%), Polearm Training (talent, 69.6%), Knight (advanced, 66.8%), Champions of Light (tier 1) (synergy, 67.8%), Martial Discipline (tier 2) (synergy, 66.2%), Harmony (talent, 66.7%), Cacophony (talent, 70.0%), Vanish (talent, 69.3%), Righteous (talent, 68.3%), Necrotic Power (talent, 67.1%), Soul Reaper (tertiary, 66.4%), Rotcaller (tertiary, 67.2%), Vanguard (tertiary, 74.8%), Illusionist (tertiary, 69.7%), Bulwark (talent, 65.4%), Aegis (talent, 66.6%), Shield Wall (tier 2) (synergy, 67.4%), Backfire (talent, 68.9%), Jinx (talent, 68.9%), Harlequin (tertiary, 81.1%), Warchanter (tertiary, 72.7%), Inner Harmony (tier 2) (synergy, 68.6%), Arcane Focus (talent, 66.4%), Inferno (talent, 65.4%), Twilight Pact (tier 1) (synergy, 74.4%), Nightblade (tertiary, 69.7%), Entropist (tertiary, 75.0%), Packlord (tertiary, 65.3%), Stormfist (tertiary, 65.1%), Chronarch (tertiary, 73.9%), Bombardier (tertiary, 67.9%), Phoenix (tertiary, 77.7%), Firelord (tertiary, 71.9%), Curseweaver (tertiary, 69.2%), Pit Lord (tertiary, 75.8%), Bloodreaver (tertiary, 67.9%), Lorekeeper (tertiary, 75.1%), Siege Master (tertiary, 76.0%), Stoneguard (tertiary, 72.4%), Deadeye (tertiary, 65.7%), Trapper (tertiary, 71.0%), Oracle (tertiary, 77.1%), Mistwalker (tertiary, 66.3%), Templar (tertiary, 77.2%), Crusade (talent, 70.5%), Paladin (tertiary, 71.4%), Swordmaster (tertiary, 68.7%), Artificer (tertiary, 71.8%), Radiance (talent, 67.5%), Warlord (tertiary, 69.3%), Slapstick (talent, 72.7%), Demon Skin (talent, 68.6%), Entrench (talent, 67.8%)

##### Classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Bard | 32889 | 67.5% ⚠️ high | +4.9 |
| Warrior | 41598 | 67.3% ⚠️ high | +4.9 |
| Cleric | 30164 | 66.9% ⚠️ high | +4.2 |
| Necromancer | 32622 | 66.3% ⚠️ high | +3.7 |
| Mage | 29229 | 64.9% | +2.1 |
| Monk | 39172 | 64.3% | +2.0 |
| Rogue | 38142 | 62.5% | +0.0 |
| Ranger | 32610 | 62.4% | −0.1 |
| Warlock | 33125 | 60.7% | −2.0 |
| Druid | 33412 | 60.3% | −2.2 |
| Engineer | 26379 | 58.0% | −4.8 |

##### Advanced classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Trickster | 13172 | 68.9% ⚠️ high | +11.3 |
| Inquisitor | 14111 | 67.4% ⚠️ high | +9.7 |
| Knight | 22379 | 66.8% ⚠️ high | +9.3 |
| Lich | 17412 | 65.3% ⚠️ high | +7.9 |
| Iron Fist | 15892 | 62.8% | +5.7 |
| Pyromancer | 14322 | 63.0% | +5.7 |
| Skald | 11939 | 60.9% | +3.8 |
| Demonologist | 11795 | 59.8% | +2.8 |
| Chronomancer | 7772 | 59.6% | +2.5 |
| Assassin | 15868 | 58.8% | +1.7 |
| Priest | 8845 | 58.4% | +1.6 |
| Beastmaster | 12350 | 57.4% | +0.5 |
| Shapeshifter | 16594 | 56.7% | −0.0 |
| Demolitionist | 11656 | 55.5% | −1.2 |
| Berserker | 11303 | 54.8% | −1.8 |
| Sharpshooter | 12655 | 54.7% | −1.9 |
| Windwalker | 15210 | 54.0% | −2.6 |
| Grove Warden | 8377 | 53.9% | −2.6 |
| Plaguelord | 7710 | 53.7% | −3.1 |
| Duelist | 13529 | 52.5% | −4.1 |
| Hexer | 12658 | 51.5% | −5.0 |
| Machinist | 7363 | 49.9% | −6.6 |

##### Tertiary classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Harlequin | 1657 | 81.1% ⚠️ high | +14.7 |
| Oracle | 700 | 77.1% ⚠️ high | +12.7 |
| Templar | 2674 | 77.2% ⚠️ high | +11.2 |
| Phoenix | 2034 | 77.7% ⚠️ high | +11.0 |
| Siege Master | 1414 | 76.0% ⚠️ high | +10.9 |
| Archlich | 2832 | 76.6% ⚠️ high | +10.5 |
| Shadowdancer | 2089 | 75.8% ⚠️ high | +10.5 |
| Lorekeeper | 841 | 75.1% ⚠️ high | +10.2 |
| Pit Lord | 1775 | 75.8% ⚠️ high | +10.1 |
| Entropist | 663 | 75.0% ⚠️ high | +10.0 |
| Chronarch | 792 | 73.9% ⚠️ high | +9.2 |
| Vanguard | 2001 | 74.8% ⚠️ high | +9.1 |
| Firelord | 762 | 71.9% ⚠️ high | +8.0 |
| Stoneguard | 2709 | 72.4% ⚠️ high | +7.0 |
| Warchanter | 1499 | 72.7% ⚠️ high | +6.5 |
| Trapper | 1531 | 71.0% ⚠️ high | +6.4 |
| Paladin | 3428 | 71.4% ⚠️ high | +6.0 |
| Illusionist | 1428 | 69.7% ⚠️ high | +5.8 |
| Artificer | 538 | 71.8% ⚠️ high | +5.7 |
| Warlord | 597 | 69.3% ⚠️ high | +5.4 |
| Nightblade | 851 | 69.7% ⚠️ high | +5.0 |
| Falconer | 1558 | 69.6% ⚠️ high | +4.3 |
| High Priest | 879 | 68.5% ⚠️ high | +4.2 |
| Elder Bear | 2202 | 69.4% ⚠️ high | +4.0 |
| Bombardier | 445 | 67.9% ⚠️ high | +3.9 |
| Curseweaver | 415 | 69.2% ⚠️ high | +3.9 |
| Rotcaller | 635 | 67.2% ⚠️ high | +3.6 |
| Swordmaster | 1452 | 68.7% ⚠️ high | +3.6 |
| Blightlord | 595 | 68.2% ⚠️ high | +3.3 |
| Bloodreaver | 1281 | 67.9% ⚠️ high | +3.3 |
| Mistwalker | 574 | 66.3% ⚠️ high | +1.9 |
| Soul Reaper | 1005 | 66.4% ⚠️ high | +1.7 |
| Deadeye | 527 | 65.7% ⚠️ high | +1.2 |
| Packlord | 625 | 65.3% ⚠️ high | +1.2 |
| Soulbinder | 472 | 64.1% | +1.1 |
| Stormfist | 1935 | 65.1% ⚠️ high | +0.1 |
| Doombringer | 1452 | 63.8% | +0.1 |
| Roboticist | 460 | 63.9% | −0.5 |
| Grandmaster | 694 | 62.7% | −0.6 |
| Wildstalker | 935 | 63.8% | −0.6 |
| Swashbuckler | 557 | 61.6% | −1.8 |
| Archdruid | 856 | 58.9% | −3.8 |
| Treelord | 555 | 59.3% | −3.9 |
| Zealot | 554 | 61.0% | −4.2 |

##### Synergies

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Twilight Pact (tier 1) | 3611 | 74.4% ⚠️ high | +16.5 |
| Arcane Circle (tier 2) | 9799 | 74.4% ⚠️ high | +13.3 |
| Battle Hymn (tier 1) | 13264 | 73.0% ⚠️ high | +11.3 |
| Legion of Night (tier 2) | 5133 | 70.7% ⚠️ high | +11.0 |
| Champions of Light (tier 1) | 3318 | 67.8% ⚠️ high | +9.8 |
| Life and Death (tier 1) | 9280 | 71.1% ⚠️ high | +9.1 |
| Shield Wall (tier 2) | 5798 | 67.4% ⚠️ high | +8.6 |
| Divine Choir (tier 1) | 15541 | 66.2% ⚠️ high | +8.3 |
| Vanguard (tier 1) | 33173 | 67.2% ⚠️ high | +7.8 |
| Holy Trinity (tier 1) | 40664 | 68.4% ⚠️ high | +7.7 |
| Shield Wall (tier 1) | 15339 | 66.6% ⚠️ high | +7.5 |
| Martial Discipline (tier 2) | 14026 | 66.2% ⚠️ high | +6.7 |
| Legion of Night (tier 1) | 10399 | 68.0% ⚠️ high | +6.7 |
| Inner Harmony (tier 2) | 4688 | 68.6% ⚠️ high | +6.6 |
| Arcane Circle (tier 1) | 18753 | 69.0% ⚠️ high | +5.3 |
| Nature's Bond (tier 1) | 7363 | 65.7% ⚠️ high | +4.9 |
| Call of the Wild (tier 1) | 14623 | 68.2% ⚠️ high | +4.6 |
| Shadow Pact (tier 1) | 32286 | 67.4% ⚠️ high | +4.3 |
| Adventuring Party (tier 2) | 29994 | 64.1% | +3.5 |
| Adventuring Party (tier 1) | 37225 | 64.3% | +3.1 |
| Inner Harmony (tier 1) | 13069 | 66.5% ⚠️ high | +2.8 |
| Wild Hunt (tier 1) | 13041 | 63.8% | +2.4 |
| Martial Discipline (tier 1) | 44958 | 64.7% | +1.5 |
| Mad Science (tier 1) | 7890 | 63.5% | +1.3 |
| Dark Covenant (tier 1) | 6819 | 60.3% | −1.4 |
| Champions of Light (tier 2) | 818 | 52.8% | −4.4 |
| Workshop (tier 1) | 3359 | 55.2% | −6.1 |

##### Items

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Crimson Chalice | 3 | 100.0% | +22.9 |
| Aegis of the Unbroken | 6 | 100.0% | +22.4 |
| Hourglass of Ruin | 3 | 100.0% | +21.8 |
| Chalice of Mercy | 12 | 83.3% | +20.1 |
| Dawnbringer | 8 | 75.0% | +16.9 |
| Alpha's Fang | 11 | 81.8% | +16.5 |
| Blood Moon Idol | 9 | 88.9% | +16.0 |
| Phylactery Crystal | 12 | 83.3% | +14.7 |
| Hellforge Collar | 7 | 85.7% | +13.1 |
| Kensei Blade | 12 | 58.3% | +9.0 |
| Grave Banner | 15 | 73.3% | +8.2 |
| Hooded Falcon | 10 | 70.0% | +7.9 |
| Heartwood Staff | 10 | 80.0% | +7.6 |
| Moonfang Claws | 6 | 50.0% | +5.7 |
| Ember Crown | 11 | 63.6% | +3.5 |
| Quicksilver Rapier | 11246 | 60.6% | +3.5 |
| Gearbox | 18009 | 60.6% | +3.2 |
| Featherweight Charm | 16882 | 60.4% | +3.1 |
| Crusader's Oath | 28 | 67.9% | +2.7 |
| Giant's Belt | 18430 | 59.9% | +2.6 |
| Tome of Sagas | 9 | 55.6% | +2.5 |
| Chainmail | 18174 | 59.5% | +2.2 |
| Iron Sword | 18004 | 59.6% | +2.2 |
| Long Spear | 16642 | 59.4% | +2.1 |
| Smoke Cloak | 16696 | 59.1% | +1.8 |
| Reaper's Scythe | 11 | 63.6% | +1.8 |
| Oak Heart | 17241 | 58.9% | +1.7 |
| Cursed Tome | 16877 | 58.9% | +1.6 |
| Swift Boots | 17064 | 58.6% | +1.4 |
| Prayer Beads | 16525 | 58.6% | +1.3 |
| Executioner's Axe | 9476 | 57.1% | +0.0 |
| Adrenaline Vial | 14602 | 56.9% | −0.2 |
| Vampiric Fang | 12828 | 56.7% | −0.2 |
| Plague Censer | 10 | 70.0% | −0.7 |
| Healing Charm | 14131 | 55.9% | −1.0 |
| Spellbook | 11133 | 55.5% | −1.4 |
| Winged Sandals | 7391 | 55.8% | −1.4 |
| Phoenix Feather | 7116 | 56.0% | −1.5 |
| Time Shard | 9914 | 55.2% | −1.6 |
| Soulstone | 9814 | 55.2% | −1.7 |
| Enchanted Lute | 10517 | 55.0% | −1.9 |
| Mountain Heart | 11 | 68.2% | −2.2 |
| Holy Symbol | 11145 | 54.0% | −2.9 |
| Tower Shield | 10019 | 53.1% | −3.7 |
| Skull Totem | 9729 | 53.1% | −3.8 |
| War Banner | 6867 | 52.9% | −4.0 |
| Assassin's Dagger | 10681 | 52.7% | −4.3 |
| Master Toolkit | 11 | 63.6% | −4.6 |
| Mirror Shard | 7322 | 52.1% | −4.7 |
| Hunting Bow | 9888 | 51.8% | −5.0 |
| Hourglass | 5992 | 52.1% | −5.0 |
| Thorned Mail | 8734 | 50.9% | −5.9 |
| Veil of Night | 9 | 66.7% | −6.2 |
| Rage Gauntlets | 9040 | 50.5% | −6.2 |
| Gambler's Coin | 6875 | 48.0% | −9.1 |
| Ashen Heart | 18 | 61.1% | −11.7 |
| Warhorn | 9 | 44.4% | −19.7 |
| Hall of Mirrors | 13 | 38.5% | −20.9 |
| Horde Banner | 6 | 33.3% | −26.4 |
| Brand of Zeal | 5 | 40.0% | −32.4 |

##### Talents (top and bottom 10)

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Stasis | 67 | 83.6% | +27.9 |
| Juggle | 175 | 76.9% | +21.5 |
| Omen | 104 | 69.2% | +17.8 |
| Potency | 44 | 65.9% | +16.1 |
| Punchline | 91 | 71.4% | +14.9 |
| Zeal | 8148 | 71.6% ⚠️ high | +14.7 |
| Ballad of Ages | 106 | 71.7% | +14.1 |
| Clarity | 112 | 68.3% | +13.6 |
| Collapse | 94 | 68.1% | +13.4 |
| Sanctified Blade | 7440 | 70.5% ⚠️ high | +13.2 |
| … 288 more … | | | |
| Flowing Blade | 58 | 37.9% | −8.5 |
| Scourge | 77 | 40.3% | −8.8 |
| Taunting Grin | 73 | 38.4% | −8.9 |
| Quivering Palm | 117 | 43.6% | −8.9 |
| Fervor | 54 | 42.6% | −9.0 |
| Rangefinder | 5254 | 50.9% | −9.4 |
| Soul Well | 82 | 42.1% | −9.5 |
| Cycle of Life | 100 | 40.0% | −10.0 |
| Chain Lightning | 96 | 49.0% | −10.5 |
| Shred | 45 | 33.3% | −11.5 |


### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 1528 | 59.7% |
| Rogue | 1496 | 42.1% |
| Mage | 1558 | 46.7% |
| Cleric | 1535 | 59.3% |
| Ranger | 1507 | 50.8% |
| Monk | 1540 | 58.6% |
| Bard | 1489 | 50.4% |
| Druid | 1500 | 42.9% |
| Warlock | 1520 | 52.2% |
| Engineer | 1524 | 40.1% |
| Necromancer | 1528 | 50.2% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 84.2 ticks, longest: 223 ticks (cap 1000).

### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Monk | Bard | Druid | Warlock | Engineer | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.5% | 0.0% | 100.0% | 97.5% | 100.0% | 17.0% | 100.0% | 66.6% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 58.0% | 0.0% | 100.0% | 85.5% | 100.0% | 31.0% | 100.0% | 67.5% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 0.0% | 100.0% | 0.0% | 51.0% | 0.0% | 100.0% | 35.1% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 100.0% | 0.0% | 0.0% | 0.0% | 100.0% | 30.0% |
| Ranger | 48.0% | 45.5% | 100.0% | 100.0% | – | 0.0% | 100.0% | 63.0% | 5.5% | 15.0% | 100.0% | 57.7% |
| Monk | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | – | 100.0% | 100.0% | 100.0% | 99.0% | 100.0% | 99.9% |
| Bard | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| Druid | 0.5% | 13.5% | 100.0% | 100.0% | 40.0% | 0.0% | 100.0% | – | 74.5% | 4.0% | 85.0% | 51.7% |
| Warlock | 0.0% | 0.0% | 47.0% | 100.0% | 94.0% | 0.0% | 100.0% | 30.0% | – | 90.5% | 100.0% | 56.1% |
| Engineer | 84.0% | 70.0% | 100.0% | 100.0% | 86.0% | 0.0% | 100.0% | 93.5% | 8.5% | – | 100.0% | 74.2% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 100.0% | 18.0% | 0.0% | 0.0% | – | 11.8% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

## 2026-10-20 — Milestone 6 (level cap 10, tertiary classes, 15-win runs)

Command: `npm run sim` (seed `m3`, 2,000 runs per bot). Changes since M5: levels 6–10, 44 tertiary classes with one ability-granting talent each, runs to 15 wins, enemies that level into tertiary classes, and enemy HP/ATK growth through round 16 at +8.5% / +5% per round.

- **Completion matches the M5 targets** with a longer run: sensible 20.3% (M5: 20.7%), greedy 28.1% (29.1%). Enemy growth was tuned for that across five variants. Stopping growth at round 10 made rounds 12–16 a walkover once units reached level 6+.
- **Tertiary win rates are high across the board** (65–85% raw) because only invested runs reach level 7. Use the round-adjusted lift. After the balance pass it spans −3.8 (Archdruid) to +13.8 (Firelord), down from −5.2 to +21.9 on the first pass. Samples are small (500–2,000 fights each), so differences under ~4 points are noise.
- **First-pass outliers were the timing-control classes** (Illusionist, Chronarch, Oracle, Entropist, Harlequin). Their specific skills were cut back (see DECISIONS.md).
- **Late-round win rates are survivor-biased:** by round 17 only runs that already lost several fights are still playing.

Seed `m3`. Draws count as half a win.

### Full runs (2000 per bot, starter classes)

| Bot | Completed (15 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 3.8% | 3.26 | 8.1 | 40.1% | 3.05 | 2.9 | 0.0% | 0 | 0 |
| sensible | 20.3% | 8.57 | 12.8 | 67.2% | 4.20 | 1.8 | 0.0% | 0 | 0 |
| greedy | 28.1% | 9.96 | 13.8 | 72.3% | 4.47 | 2.3 | 0.0% | 0 | 0 |
| synergy | 8.9% | 6.12 | 10.8 | 56.9% | 3.81 | 1.4 | 0.1% | 0 | 0 |

- **random**: Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices and stat points.
- **sensible**: Two frontliners then class variety; then items/training for its best units; random level-up choices.
- **greedy**: Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices and stat points the same way.
- **synergy**: Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.

#### Fight win rate by round

| Round | random | sensible | greedy | synergy |
|---:|---:|---:|---:|---:|
| 1 | 48.2% | 90.9% | 93.2% | 90.5% |
| 2 | 52.1% | 99.8% | 99.6% | 79.3% |
| 3 | 40.9% | 90.5% | 95.4% | 69.0% |
| 4 | 39.1% | 89.3% | 91.0% | 68.3% |
| 5 | 32.1% | 78.5% | 84.9% | 56.5% |
| 6 | 34.7% | 62.4% | 74.1% | 45.9% |
| 7 | 24.4% | 48.8% | 59.7% | 32.9% |
| 8 | 26.8% | 43.2% | 55.0% | 34.5% |
| 9 | 32.1% | 42.2% | 54.0% | 34.8% |
| 10 | 41.8% | 43.3% | 50.9% | 39.3% |
| 11 | 40.1% | 44.2% | 50.8% | 42.0% |
| 12 | 42.0% | 56.4% | 58.3% | 54.9% |
| 13 | 59.3% | 68.0% | 74.7% | 64.8% |
| 14 | 71.2% | 76.2% | 84.7% | 67.5% |
| 15 | 80.6% | 82.7% | 85.0% | 75.2% |
| 16 | 64.6% | 69.8% | 69.1% | 59.2% |
| 17 | 44.0% | 39.5% | 31.4% | 40.3% |
| 18 | 26.8% | 19.7% | 7.6% | 15.8% |
| 19 | 18.2% | 20.6% | 11.4% | 3.6% |
| 20 | 100.0% | – | – | – |

#### Pick-to-win rates (all bots combined)

Share of fights won while the entity was on the player's board (draws count half). Flagged if above 65.0% or below 35.0% with at least 300 fights. For reference, the overall fight win rate is 59.1%. **Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.

**Outliers (45):** Harmony (talent, 65.5%), Inner Harmony (tier 1) (synergy, 66.1%), Warrior (class, 65.6%), Martial Discipline (tier 2) (synergy, 66.0%), Shield Wall (tier 1) (synergy, 65.4%), Inner Harmony (tier 2) (synergy, 70.1%), Arcane Circle (tier 2) (synergy, 68.7%), Inferno (talent, 65.1%), Oracle (tertiary, 74.4%), Phoenix (tertiary, 74.6%), Bloodreaver (tertiary, 69.9%), Entropist (tertiary, 74.1%), Devotion (talent, 68.3%), Stoneguard (tertiary, 72.3%), High Priest (tertiary, 66.3%), Nightblade (tertiary, 73.2%), Firelord (tertiary, 76.3%), Pit Lord (tertiary, 70.9%), Sanctified Blade (talent, 65.9%), Zeal (talent, 67.5%), Polearm Training (talent, 66.4%), Chronarch (tertiary, 74.9%), Templar (tertiary, 74.4%), Grandmaster (tertiary, 66.9%), Paladin (tertiary, 66.1%), Siege Master (tertiary, 73.7%), Harlequin (tertiary, 77.7%), Soulbinder (tertiary, 65.4%), Warchanter (tertiary, 73.6%), Illusionist (tertiary, 65.6%), Swordmaster (tertiary, 67.5%), Stormfist (tertiary, 66.2%), Lorekeeper (tertiary, 74.0%), Elder Bear (tertiary, 66.0%), Vanguard (tertiary, 75.1%), Shadowdancer (tertiary, 73.5%), Artificer (tertiary, 72.3%), Packlord (tertiary, 67.3%), Deadeye (tertiary, 69.4%), Curseweaver (tertiary, 72.7%), Trapper (tertiary, 69.4%), Bulwark (talent, 65.7%), Warlord (tertiary, 69.7%), Entrench (talent, 66.5%), Radiance (talent, 71.8%)

##### Classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Warrior | 44222 | 65.6% ⚠️ high | +5.3 |
| Cleric | 30295 | 64.8% | +4.1 |
| Bard | 32558 | 64.3% | +3.7 |
| Monk | 42672 | 63.9% | +3.6 |
| Mage | 28979 | 62.4% | +1.4 |
| Rogue | 40185 | 60.7% | +0.3 |
| Ranger | 35772 | 60.6% | +0.2 |
| Warlock | 34660 | 57.9% | −2.7 |
| Engineer | 30668 | 57.8% | −3.1 |
| Druid | 33824 | 57.2% | −3.3 |

##### Advanced classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Inquisitor | 13804 | 64.2% | +9.2 |
| Knight | 18552 | 62.5% | +7.8 |
| Pyromancer | 13941 | 62.1% | +7.3 |
| Iron Fist | 13018 | 61.9% | +7.2 |
| Skald | 13312 | 61.7% | +6.9 |
| Berserker | 18622 | 61.0% | +6.4 |
| Trickster | 11041 | 60.4% | +5.8 |
| Priest | 9135 | 57.6% | +3.1 |
| Sharpshooter | 16946 | 56.2% | +1.8 |
| Chronomancer | 7500 | 56.3% | +1.8 |
| Windwalker | 20228 | 55.4% | +1.0 |
| Assassin | 14425 | 54.4% | +0.1 |
| Demolitionist | 13838 | 54.5% | −0.1 |
| Duelist | 16980 | 53.9% | −0.3 |
| Demonologist | 10107 | 53.4% | −0.9 |
| Shapeshifter | 16575 | 52.8% | −1.2 |
| Hexer | 15163 | 51.2% | −2.8 |
| Grove Warden | 8355 | 51.4% | −2.9 |
| Machinist | 8402 | 50.3% | −3.8 |
| Beastmaster | 10186 | 49.9% | −4.0 |

##### Tertiary classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Firelord | 937 | 76.3% ⚠️ high | +13.8 |
| Harlequin | 921 | 77.7% ⚠️ high | +13.2 |
| Oracle | 806 | 74.4% ⚠️ high | +11.9 |
| Chronarch | 614 | 74.9% ⚠️ high | +11.9 |
| Vanguard | 1969 | 75.1% ⚠️ high | +11.6 |
| Nightblade | 695 | 73.2% ⚠️ high | +11.3 |
| Entropist | 657 | 74.1% ⚠️ high | +11.2 |
| Templar | 2518 | 74.4% ⚠️ high | +11.0 |
| Phoenix | 1976 | 74.6% ⚠️ high | +10.9 |
| Lorekeeper | 699 | 74.0% ⚠️ high | +10.9 |
| Shadowdancer | 1723 | 73.5% ⚠️ high | +10.9 |
| Siege Master | 1597 | 73.7% ⚠️ high | +9.8 |
| Curseweaver | 486 | 72.7% ⚠️ high | +9.7 |
| Warchanter | 1967 | 73.6% ⚠️ high | +9.3 |
| Stoneguard | 1948 | 72.3% ⚠️ high | +9.0 |
| Pit Lord | 1191 | 70.9% ⚠️ high | +8.4 |
| Artificer | 624 | 72.3% ⚠️ high | +8.4 |
| Warlord | 660 | 69.7% ⚠️ high | +7.3 |
| Bloodreaver | 3266 | 69.9% ⚠️ high | +7.2 |
| Deadeye | 831 | 69.4% ⚠️ high | +6.7 |
| Trapper | 2053 | 69.4% ⚠️ high | +6.1 |
| Packlord | 626 | 67.3% ⚠️ high | +5.6 |
| Swordmaster | 1907 | 67.5% ⚠️ high | +4.7 |
| Grandmaster | 803 | 66.9% ⚠️ high | +3.8 |
| Elder Bear | 1708 | 66.0% ⚠️ high | +3.6 |
| High Priest | 880 | 66.3% ⚠️ high | +3.4 |
| Illusionist | 1263 | 65.6% ⚠️ high | +3.2 |
| Stormfist | 2945 | 66.2% ⚠️ high | +2.9 |
| Paladin | 2224 | 66.1% ⚠️ high | +2.9 |
| Soulbinder | 454 | 65.4% ⚠️ high | +2.7 |
| Falconer | 849 | 63.6% | +1.6 |
| Zealot | 617 | 63.5% | +0.7 |
| Mistwalker | 624 | 62.3% | +0.5 |
| Bombardier | 647 | 62.9% | +0.4 |
| Doombringer | 1727 | 62.6% | +0.3 |
| Treelord | 550 | 63.3% | +0.2 |
| Wildstalker | 1006 | 61.2% | −0.3 |
| Roboticist | 498 | 62.0% | −1.0 |
| Swashbuckler | 825 | 59.4% | −3.5 |
| Archdruid | 670 | 58.7% | −3.8 |

##### Synergies

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Inner Harmony (tier 2) | 6219 | 70.1% ⚠️ high | +10.5 |
| Arcane Circle (tier 2) | 4938 | 68.7% ⚠️ high | +10.4 |
| Martial Discipline (tier 2) | 21188 | 66.0% ⚠️ high | +9.1 |
| Shield Wall (tier 1) | 13933 | 65.4% ⚠️ high | +7.9 |
| Vanguard (tier 1) | 30324 | 64.9% | +7.5 |
| Divine Choir (tier 1) | 15503 | 62.4% | +6.9 |
| Shield Wall (tier 2) | 5003 | 62.4% | +6.2 |
| Inner Harmony (tier 1) | 14656 | 66.1% ⚠️ high | +4.6 |
| Adventuring Party (tier 2) | 25651 | 61.9% | +3.4 |
| Nature's Bond (tier 1) | 7922 | 62.0% | +3.4 |
| Adventuring Party (tier 1) | 36890 | 61.3% | +2.4 |
| Arcane Circle (tier 1) | 12036 | 63.4% | +2.3 |
| Shadow Pact (tier 1) | 19099 | 63.4% | +1.7 |
| Martial Discipline (tier 1) | 44937 | 63.0% | +1.4 |
| Call of the Wild (tier 1) | 13571 | 64.1% | +1.4 |
| Dark Covenant (tier 1) | 7591 | 56.2% | −3.2 |
| Workshop (tier 1) | 4467 | 56.6% | −3.3 |

##### Items

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Iron Sword | 20545 | 57.0% | +2.5 |
| Gearbox | 19862 | 56.7% | +2.3 |
| Featherweight Charm | 18857 | 56.2% | +1.7 |
| Chainmail | 20060 | 55.8% | +1.5 |
| Quicksilver Rapier | 12998 | 55.3% | +1.1 |
| Smoke Cloak | 17982 | 55.4% | +1.0 |
| Giant's Belt | 19533 | 55.2% | +0.9 |
| Time Shard | 10865 | 55.0% | +0.8 |
| Winged Sandals | 8221 | 54.9% | +0.6 |
| Prayer Beads | 18549 | 54.9% | +0.5 |
| Swift Boots | 19126 | 54.8% | +0.4 |
| Cursed Tome | 18119 | 54.5% | +0.3 |
| Oak Heart | 18307 | 54.3% | +0.2 |
| Long Spear | 17603 | 53.9% | −0.4 |
| Healing Charm | 15752 | 52.7% | −1.5 |
| Holy Symbol | 12056 | 52.3% | −1.8 |
| Adrenaline Vial | 14980 | 52.2% | −2.0 |
| Vampiric Fang | 12882 | 51.9% | −2.0 |
| Spellbook | 12016 | 51.7% | −2.2 |
| Enchanted Lute | 11511 | 51.4% | −2.6 |
| Hourglass | 7442 | 50.8% | −3.3 |
| Assassin's Dagger | 11191 | 50.2% | −3.8 |
| Thorned Mail | 9695 | 49.6% | −4.0 |
| Rage Gauntlets | 10197 | 49.5% | −4.3 |
| Tower Shield | 10449 | 49.3% | −4.5 |
| Skull Totem | 9561 | 49.2% | −4.8 |
| Hunting Bow | 11508 | 48.4% | −5.5 |

##### Talents (top and bottom 10)

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Fate Ward | 114 | 73.7% | +20.9 |
| Ember Shield | 167 | 79.0% | +20.5 |
| Malediction | 88 | 68.2% | +17.9 |
| Hex Ward | 95 | 69.5% | +17.2 |
| Omen | 156 | 68.6% | +16.6 |
| Slapstick | 188 | 71.8% | +14.8 |
| Stasis | 88 | 69.3% | +14.5 |
| Blind | 145 | 64.8% | +14.4 |
| Battle Standard | 98 | 70.4% | +14.2 |
| Sap | 48 | 72.9% | +14.0 |
| … 260 more … | | | |
| Rangefinder | 6468 | 52.4% | −5.9 |
| Feral Instinct | 126 | 44.4% | −6.7 |
| Savage Bite | 3214 | 44.4% | −7.6 |
| Titanium Frames | 55 | 34.5% | −9.1 |
| Scrap Armor | 77 | 40.3% | −9.2 |
| Entangling Roots | 76 | 40.8% | −9.6 |
| Sapling | 88 | 40.9% | −10.1 |
| Panache | 201 | 40.8% | −10.7 |
| Soul Well | 53 | 43.4% | −10.7 |
| Pistol Shot | 67 | 35.8% | −10.9 |


### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 1528 | 59.7% |
| Rogue | 1496 | 42.1% |
| Mage | 1558 | 46.7% |
| Cleric | 1535 | 59.3% |
| Ranger | 1507 | 50.8% |
| Monk | 1540 | 58.6% |
| Bard | 1489 | 50.4% |
| Druid | 1500 | 42.9% |
| Warlock | 1520 | 52.2% |
| Engineer | 1524 | 40.1% |
| Necromancer | 1528 | 50.2% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 84.2 ticks, longest: 223 ticks (cap 1000).

### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Monk | Bard | Druid | Warlock | Engineer | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.5% | 0.0% | 100.0% | 97.5% | 100.0% | 17.0% | 100.0% | 66.6% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 58.0% | 0.0% | 100.0% | 85.5% | 100.0% | 31.0% | 100.0% | 67.5% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 0.0% | 100.0% | 0.0% | 51.0% | 0.0% | 100.0% | 35.1% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 100.0% | 0.0% | 0.0% | 0.0% | 100.0% | 30.0% |
| Ranger | 48.0% | 45.5% | 100.0% | 100.0% | – | 0.0% | 100.0% | 63.0% | 5.5% | 15.0% | 100.0% | 57.7% |
| Monk | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | – | 100.0% | 100.0% | 100.0% | 99.0% | 100.0% | 99.9% |
| Bard | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| Druid | 0.5% | 13.5% | 100.0% | 100.0% | 40.0% | 0.0% | 100.0% | – | 74.5% | 4.0% | 85.0% | 51.7% |
| Warlock | 0.0% | 0.0% | 47.0% | 100.0% | 94.0% | 0.0% | 100.0% | 30.0% | – | 90.5% | 100.0% | 56.1% |
| Engineer | 84.0% | 70.0% | 100.0% | 100.0% | 86.0% | 0.0% | 100.0% | 93.5% | 8.5% | – | 100.0% | 74.2% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 100.0% | 18.0% | 0.0% | 0.0% | – | 11.8% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

## 2026-10-18 — Milestone 5 (progression, new classes, difficulty)

Command: `npm run sim` (seed `m3`, 2,000 runs per bot). Changes since M4: player-allocated stat points, no XP at max level, the full-party shop, five new classes with 10 advanced classes and summons, new synergies and items, the Time Warp fix, and a new enemy curve. Bots now spend stat points (see DECISIONS.md).

**Reading it**
- **Completion:** sensible 20.7%, greedy 29.1%, synergy 11.3%, random 4.9% (M4: 24.3 / 21.1 / 16.4 / 5.9). Stat points first pushed greedy to 45%; the enemy curve brings it back.
- **Late-game wall gone:** fight win rate in rounds 11–14 now holds at roughly 21–28% for every bot. It was 19% at round 11, then 7% and 4%. Enemy HP/ATK growth stops after round 10, and enemy levels and items flatten. Rounds 6–10 got harder instead (sensible 62% → 27% across them), which is where Brandon was cruising in M4.
- **Classes:** base classes from −2.8 (Engineer) to +6.0 (Warrior) lift; advanced classes from −3.8 (Machinist) to +9.9 (Knight). The bots always fill the board, so summoners (Engineer, Machinist) mostly fire their fallback. Leaving slots open is a human strategy the bots don't use, so these classes are likely under-rated here.
- **Issue #10:** Knight + Chronomancer taunt uptime fell from 49% to 36% of the Knight's turns (28% without a Chronomancer). Of 185 advanced-class pairs with 400+ fights, Knight + Chronomancer ranks 18th at +12.9 lift. The top pairs are tank + support combos at +15 to +20 (Iron Fist + Skald, Knight + Trickster, Priest + Skald). So it's good, but no longer the obvious lock-in. The full trio sample is small (220 fights).
- **Issue #9:** with the new speed items, the fastest unit in a party (rounds 6–10) averages 19.9 SPD and the slowest 11.3, a 1.82× gap. Without them the gap is 1.80×, so the bots barely change it. Stat points and the Monk already widened the gap from M4's 1.6× (base stats). A player can deliberately stack speed (Monk, Prayer Beads, Featherweight Charm, Inner Harmony), but if speed should matter more for everyone, widening class base SPD is the next step.
- **Synergies:** Inner Harmony tier 2 (+11.3), Martial Discipline tier 2 (+10.3) and Arcane Circle tier 2 (+9.6) lead; Dark Covenant is lowest (−4.3).
- **Talents:** Zeal (+3 ATK, Inquisitor) is the top talent at +15.9, so Inquisitor talents are worth watching. The low raw-win "outliers" are mostly late-game talents and items that only appear in the hardest rounds. Their round-adjusted lift is what to read.

Seed `m3`. Draws count as half a win.

##### Full runs (2000 per bot, starter classes)

| Bot | Completed (10 wins) | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold | Draws | Tick-cap | Stuck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 4.9% | 2.68 | 7.5 | 35.6% | 2.69 | 2.8 | 0.0% | 0 | 0 |
| sensible | 20.7% | 6.78 | 11.1 | 61.3% | 3.53 | 2.6 | 0.0% | 0 | 0 |
| greedy | 29.1% | 7.50 | 11.5 | 65.4% | 3.65 | 1.9 | 0.0% | 0 | 0 |
| synergy | 11.3% | 5.04 | 9.7 | 52.2% | 3.28 | 2.3 | 0.1% | 0 | 0 |

- **random**: Random purchases and targets, rerolls 30% of the time with spare gold, random level-up choices and stat points.
- **sensible**: Two frontliners then class variety; then items/training for its best units; random level-up choices.
- **greedy**: Buys the offer that most raises estimated party power (HP×DEF × ATK×SPD); picks choices and stat points the same way.
- **synergy**: Chooses a synergy tag per run, recruits and advances toward it, gears its tagged units, random talents.

##### Fight win rate by round

| Round | random | sensible | greedy | synergy |
|---:|---:|---:|---:|---:|
| 1 | 47.0% | 90.9% | 93.2% | 90.5% |
| 2 | 49.5% | 99.8% | 99.6% | 78.8% |
| 3 | 38.4% | 90.1% | 95.5% | 68.0% |
| 4 | 35.4% | 87.0% | 90.6% | 67.1% |
| 5 | 28.5% | 77.2% | 83.0% | 55.1% |
| 6 | 30.5% | 62.2% | 72.3% | 43.3% |
| 7 | 19.8% | 41.3% | 55.3% | 28.9% |
| 8 | 24.5% | 39.8% | 51.5% | 28.4% |
| 9 | 28.7% | 35.5% | 43.0% | 28.3% |
| 10 | 33.4% | 27.3% | 30.1% | 26.7% |
| 11 | 32.2% | 28.4% | 27.9% | 25.5% |
| 12 | 32.3% | 25.4% | 25.1% | 28.3% |
| 13 | 29.2% | 26.1% | 24.0% | 28.4% |
| 14 | 30.9% | 20.9% | 21.6% | 24.1% |
| 15 | – | – | – | 100.0% |

##### Pick-to-win rates (all bots combined)

Share of fights won while the entity was on the player's board (draws count half). Flagged if above 65.0% or below 35.0% with at least 300 fights. For reference, the overall fight win rate is 53.6%. **Lift** compares each fight with the average result for that round (points), removing the bias from things that only show up in later, harder rounds; tables are sorted by it.

**Outliers (25):** Assassin's Dagger (item, 35.0%), Salvage (talent, 32.0%), Plating (talent, 33.8%), Blight (talent, 28.9%), Hardened Frames (talent, 33.9%), Savage Bite (talent, 31.3%), Rage Gauntlets (item, 34.3%), Savage Roar (talent, 33.4%), Doom (talent, 34.8%), Rend (talent, 31.6%), Vengeance (talent, 34.0%), Agony (talent, 33.6%), Follow-Through (talent, 34.0%), Thick Hide (talent, 33.7%), Feral Bond (talent, 32.1%), Short Fuse (talent, 33.1%), Bloom (talent, 34.8%), Killshot (talent, 34.4%), Feedback (talent, 29.2%), Toxin (talent, 30.7%), Lunge (talent, 31.1%), Flourish (talent, 30.6%), Hibernate (talent, 33.1%), Frenzy (talent, 34.8%), Sacrifice (talent, 34.9%)

##### Classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Warrior | 37430 | 59.2% | +6.0 |
| Monk | 36689 | 57.6% | +4.4 |
| Cleric | 25360 | 57.9% | +4.1 |
| Bard | 27881 | 57.2% | +3.5 |
| Mage | 24834 | 55.8% | +1.3 |
| Ranger | 31754 | 54.6% | +0.7 |
| Rogue | 35153 | 54.2% | +0.2 |
| Warlock | 30960 | 51.9% | −2.6 |
| Druid | 30034 | 51.7% | −2.8 |
| Engineer | 26904 | 52.0% | −2.8 |

##### Advanced classes

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Knight | 14695 | 53.4% | +9.9 |
| Inquisitor | 10781 | 53.6% | +9.9 |
| Iron Fist | 10418 | 51.3% | +7.6 |
| Skald | 10607 | 50.8% | +7.4 |
| Pyromancer | 11006 | 51.3% | +7.3 |
| Trickster | 9043 | 50.2% | +6.6 |
| Berserker | 14789 | 49.6% | +6.3 |
| Chronomancer | 6223 | 48.6% | +4.0 |
| Priest | 7280 | 47.6% | +3.5 |
| Windwalker | 16590 | 46.3% | +2.7 |
| Sharpshooter | 14197 | 46.0% | +2.0 |
| Duelist | 14458 | 44.8% | +0.9 |
| Demolitionist | 11523 | 45.6% | +0.9 |
| Demonologist | 8506 | 44.8% | +0.4 |
| Grove Warden | 7065 | 43.8% | −0.6 |
| Shapeshifter | 13841 | 43.3% | −1.1 |
| Assassin | 11604 | 42.6% | −2.0 |
| Hexer | 12858 | 42.1% | −2.3 |
| Beastmaster | 8661 | 41.7% | −2.7 |
| Machinist | 7082 | 41.1% | −3.8 |

##### Synergies

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Inner Harmony (tier 2) | 5005 | 62.6% | +11.3 |
| Martial Discipline (tier 2) | 17327 | 57.2% | +10.3 |
| Arcane Circle (tier 2) | 3658 | 58.9% | +9.6 |
| Shield Wall (tier 1) | 11684 | 57.7% | +9.3 |
| Divine Choir (tier 1) | 13007 | 54.1% | +8.7 |
| Vanguard (tier 1) | 24069 | 56.7% | +8.6 |
| Shield Wall (tier 2) | 3435 | 52.0% | +7.2 |
| Inner Harmony (tier 1) | 12356 | 59.9% | +5.0 |
| Adventuring Party (tier 2) | 21957 | 54.8% | +4.1 |
| Nature's Bond (tier 1) | 6795 | 55.1% | +3.9 |
| Arcane Circle (tier 1) | 10417 | 57.7% | +3.2 |
| Adventuring Party (tier 1) | 31373 | 54.3% | +2.8 |
| Martial Discipline (tier 1) | 39844 | 57.8% | +2.2 |
| Call of the Wild (tier 1) | 11927 | 59.3% | +1.8 |
| Shadow Pact (tier 1) | 15987 | 57.3% | +1.2 |
| Workshop (tier 1) | 3931 | 49.1% | −4.1 |
| Dark Covenant (tier 1) | 5566 | 48.2% | −4.3 |

##### Items

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Winged Sandals | 6198 | 43.4% | +2.8 |
| Iron Sword | 15814 | 43.8% | +2.6 |
| Quicksilver Rapier | 9587 | 42.0% | +2.6 |
| Gearbox | 15133 | 43.0% | +2.4 |
| Featherweight Charm | 14402 | 43.3% | +2.2 |
| Chainmail | 15932 | 43.1% | +2.2 |
| Swift Boots | 14375 | 42.4% | +1.0 |
| Giant's Belt | 15358 | 41.5% | +0.9 |
| Prayer Beads | 14433 | 41.9% | +0.9 |
| Smoke Cloak | 14163 | 41.5% | +0.8 |
| Long Spear | 13610 | 41.8% | +0.5 |
| Oak Heart | 14513 | 40.8% | +0.1 |
| Cursed Tome | 14240 | 40.8% | −0.1 |
| Time Shard | 8103 | 39.3% | −1.2 |
| Adrenaline Vial | 11815 | 39.4% | −1.9 |
| Vampiric Fang | 9930 | 37.4% | −2.2 |
| Healing Charm | 12350 | 38.9% | −2.3 |
| Spellbook | 9276 | 37.8% | −2.6 |
| Holy Symbol | 8913 | 37.3% | −3.2 |
| Enchanted Lute | 8338 | 36.9% | −3.2 |
| Hourglass | 5821 | 37.7% | −3.7 |
| Skull Totem | 7079 | 36.4% | −4.2 |
| Thorned Mail | 7129 | 35.6% | −5.0 |
| Hunting Bow | 8754 | 35.3% | −5.2 |
| Tower Shield | 7926 | 35.3% | −5.2 |
| Assassin's Dagger | 8567 | 35.0% ⚠️ low | −5.9 |
| Rage Gauntlets | 7798 | 34.3% ⚠️ low | −6.6 |

##### Talents (top and bottom 10)

| | Fights | Win rate | Lift vs round avg |
|---|---:|---:|---:|
| Zeal | 4864 | 51.9% | +15.9 |
| Sanctified Blade | 4588 | 48.3% | +13.6 |
| Righteous | 6654 | 48.8% | +13.1 |
| Inferno | 4867 | 48.5% | +12.4 |
| Stone Body | 3870 | 46.8% | +11.5 |
| Aegis | 4429 | 45.7% | +10.9 |
| Vanish | 2743 | 45.5% | +10.9 |
| Jinx | 2727 | 45.6% | +10.8 |
| Divine Grace | 2218 | 45.8% | +10.5 |
| Cacophony | 2704 | 45.0% | +10.2 |
| … 100 more … | | | |
| Soul Shield | 5739 | 46.9% | −4.2 |
| Scrap Plating | 5417 | 47.0% | −4.2 |
| Flourish | 3439 | 30.6% ⚠️ low | −4.3 |
| Opportunist | 6639 | 46.6% | −4.6 |
| Toxin | 3216 | 30.7% ⚠️ low | −4.6 |
| Savage Bite | 1874 | 31.3% ⚠️ low | −4.7 |
| Repair Kit | 5408 | 46.2% | −5.4 |
| Feedback | 3385 | 29.2% ⚠️ low | −6.0 |
| Rangefinder | 5562 | 45.6% | −6.0 |
| Blight | 3423 | 28.9% ⚠️ low | −6.3 |


##### Random 5v5 fights (2000 fights)

Random 5-unit parties, placed by role (frontliners forward, casters back). Win rate of parties containing at least one of the class.

| Class | Appearances | Win rate |
|---|---:|---:|
| Warrior | 1528 | 59.7% |
| Rogue | 1496 | 42.1% |
| Mage | 1558 | 46.7% |
| Cleric | 1535 | 59.3% |
| Ranger | 1507 | 50.8% |
| Monk | 1540 | 58.6% |
| Bard | 1489 | 50.4% |
| Druid | 1500 | 42.9% |
| Warlock | 1520 | 52.2% |
| Engineer | 1524 | 40.1% |
| Necromancer | 1528 | 50.2% |

Draws: 0 (0.0%), tick-cap timeouts: 0, avg length: 84.2 ticks, longest: 223 ticks (cap 1000).

##### 1v1 duels (200 per pairing, sides alternated)

| Row beats column | Warrior | Rogue | Mage | Cleric | Ranger | Monk | Bard | Druid | Warlock | Engineer | Necromancer | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Warrior | – | 100.0% | 100.0% | 0.0% | 51.5% | 0.0% | 100.0% | 97.5% | 100.0% | 17.0% | 100.0% | 66.6% |
| Rogue | 0.0% | – | 100.0% | 100.0% | 58.0% | 0.0% | 100.0% | 85.5% | 100.0% | 31.0% | 100.0% | 67.5% |
| Mage | 0.0% | 0.0% | – | 100.0% | 0.0% | 0.0% | 100.0% | 0.0% | 51.0% | 0.0% | 100.0% | 35.1% |
| Cleric | 100.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 100.0% | 0.0% | 0.0% | 0.0% | 100.0% | 30.0% |
| Ranger | 48.0% | 45.5% | 100.0% | 100.0% | – | 0.0% | 100.0% | 63.0% | 5.5% | 15.0% | 100.0% | 57.7% |
| Monk | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | – | 100.0% | 100.0% | 100.0% | 99.0% | 100.0% | 99.9% |
| Bard | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | – | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| Druid | 0.5% | 13.5% | 100.0% | 100.0% | 40.0% | 0.0% | 100.0% | – | 74.5% | 4.0% | 85.0% | 51.7% |
| Warlock | 0.0% | 0.0% | 47.0% | 100.0% | 94.0% | 0.0% | 100.0% | 30.0% | – | 90.5% | 100.0% | 56.1% |
| Engineer | 84.0% | 70.0% | 100.0% | 100.0% | 86.0% | 0.0% | 100.0% | 93.5% | 8.5% | – | 100.0% | 74.2% |
| Necromancer | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 100.0% | 18.0% | 0.0% | 0.0% | – | 11.8% |

_Duels are a sanity check, not a balance target: supports and backliners are expected to lose 1v1._

## 2026-10-17 — Milestone 4 (UI)

No rule or content changes. `npm run sim -- --only runs` reproduces the M3 follow-up report below exactly. Making recruit names unique still uses one random draw per name, so every seeded shop is the same apart from names.

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

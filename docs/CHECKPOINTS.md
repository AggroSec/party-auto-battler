# Checkpoints

Milestone summaries, newest first. Each one becomes the body of that milestone's pull request.

## After M8 — Cultist, a second favored class, release prep (2026-10-31)

Not a numbered milestone: your last requests before shipping 1.0.

### What was built
- **Cultist** 🔒, your evil healer. Unlocked by **Unholy Communion**: win a fight with a Cleric and a Warlock, both level 5+.
  - **Siphon** drains the nearest enemy and heals your most wounded ally. Basic attacks give **Blight**, a stacking damage over time whose every tick heals the Cultist's most wounded ally for half the damage.
  - **Hemomancer** pays its own HP for bigger heals. **Sanguine Bishop** gives big party heals and shields; **Vampire Lord** damages every enemy and heals the party on every kill.
  - **Plague Doctor** spreads Blight. **Pestilent Saint** puts Blight on every enemy; with **Rot Mother**, every enemy death heals the party and spreads more Blight.
  - Four signature items, an enemy version (Plague Cultist, from round 3), the Blight glossary entry and its own icon.
- **Sacred and Profane** synergy (Cleric + Cultist: both +20% ability power), unlocked with the Cultist.
- **A second favored class** from the **Chosen One** achievement: win a run on tier 5+ with a unit of your favored class at level 10. The setup screen then shows two pickers, and every shop in rounds 1–2 offers both, rerolls included. Dailies keep one.
- **Unlock everything and the combat lab are gone from the released game** (their code isn't in the download). Both still appear in `npm run dev`. A saved profile with Unlock everything on is ignored in the released game, so you'll see what you've actually earned.

### What to playtest (and how)
1. **Unlock the Cultist:** win a fight with a Cleric and a Warlock at level 5+. Does the toast appear, and does the Cultist show in the shop next run?
2. **The Cultist in a party:** does Blight healing read in playback (the 🦠 pips and the heals on enemy turns)? Does it feel like a healer, or like damage that happens to heal?
3. **Both paths:** a Hemomancer and a Plague Doctor. Pestilent Saint is the one the simulator still rates high.
4. **Two favored classes:** once Chosen One unlocks (on your next tier 5+ win with your favored class at level 10), pick a tank and a healer.
5. **Release build:** on the live site after merge, the title screen should have no Unlock everything toggle and no Combat lab link.

### Known issues
- **Pestilent Saint sits at +11.2 lift** on a small sample (557 fights). Older tertiaries like Firelord and Chronarch are in the same range in this report.
- **The Cultist wins most 1v1 duels** (alone, it heals itself), though it now loses to the Dark Knight. In 5v5 fights it's mid-pack.
- **Achievements are checked when a run ends,** so Chosen One unlocks on your next qualifying run, not retroactively from your past tier 10 wins.

### Simulator balance numbers
- **Full runs** (2,000 per bot, everything unlocked, tier 0): random 4.3%, sensible 19.4%, greedy 23.4%, synergy 8.3% (was 3.9 / 21.8 / 29.5 / 10.3). Partly the new Plague Cultist enemy. No stuck runs, no tick-cap hits.
- **Cultist:** +4.5 lift (Dark Knight +3.9, Cleric +2.8); Hemomancer +6.1, Plague Doctor +6.1; 53.8% in random 5v5.
- **First pass was far too strong** (69% in 5v5; Pestilent Saint +24.5); three tuning passes are in BALANCE.md.
- **Ladder:** not re-run (about 40 minutes); unchanged.
- Tests: 325 passing.

## Milestone 8 — Juice (2026-10-28)

### What was built
- **Icons from game-icons.net** for the 13 base classes, the 10 summons, the four stats, shop offers (item, signature item, training) and the sound toggle: 32 icons, all CC BY 3.0. Advanced and tertiary classes use their base class's icon in their colour. Stat icons are coloured (HP red, ATK orange, DEF blue, SPD teal). On phones, a small class icon now sits beside each unit's name (the big avatar is hidden there for space).
- **Retro sound effects, made in code** (no audio files):
  - **Fights:** hits, blocked hits, casts, heals, shields, deaths, Rune detonations, summons and sudden death, plus a victory or defeat jingle.
  - **Shop:** buying, selling, rerolls, locks, choices, level-ups, an error buzz and the Fight button. Achievements chime.
  - **Sound toggle** on the title screen, in the shop header and in the fight controls. It's on by default and remembered.
- **Animations:**
  - **Fights:** casts glow, heals and shields pulse, big hits (a quarter of max HP or more) flash red and shake harder, Rune detonations burst, and dying units flare and collapse. The Victory or Defeat title lands with weight.
  - **Shop:** new offers deal in after a reroll or a new round, levels pop when they go up, and gold and wins bump when they change.
- **Credits screen** (title screen → Credits): you as designer and director, Claude Code as the coder, every icon with author and link, and how the sound is made. `src/assets/ATTRIBUTION.md` lists the same icons, and a test checks they match.
- `npm run icons` re-fetches the icons and regenerates their credits, so the icon set is reproducible.

### What to playtest (and how)
1. **On your phone with sound on:** play a few rounds. Are the sounds pleasant or grating after 10 minutes? Is anything too loud or too frequent (hits at 2x)? Try the toggle in the shop and in a fight.
2. **Fight readability:** do casts, big hits, deaths and detonations read better than before? Anything too flashy?
3. **Icons:** do the 13 class icons read as their classes at a glance, on the board and in fights? Any you'd swap? (Changing one is a one-line edit plus `npm run icons`.)
4. **Credits:** title screen → Credits. Is anything missing from "Made by"?

### Known issues
- **Statuses and HUD markers are still emoji** (Runes, Dread, burns, gold, lives, wins, locks). That's in line with the agreed scope (classes, item types, stats); they can get icons later.
- **Sound only starts after your first tap**, a browser rule. Every sound follows a tap anyway.
- **I checked the screens in headless Chrome, at phone and desktop width, with no errors.** I couldn't listen to the sounds there, so their mix is untested by ear.

### Simulator balance numbers
- **No rule or content changes** in this milestone, so the numbers from the post-M7 report stand: full runs (2,000 per bot, tier 0) random 3.9%, sensible 21.8%, greedy 29.5%, synergy 10.3%; ladder tier 10 0.2% / 0.3% (sensible / greedy). Details in BALANCE.md.
- Tests: 319 passing (5 new: icons, credits and sounds).

## After M7 — Playtest fixes, shop locks, Runeblade and Dark Knight (2026-10-24)

Not a numbered milestone: your playtest notes plus the two classes you designed, in one PR as you asked.

### What was built

**Fixes from your notes**
- **Dailies no longer count toward progress:** no achievements, discoveries or lifetime stats. The daily setup screen says so.
- **Reset progress** button at the bottom of the Collection (with a confirm). Your current achievements include the ones the daily gave you; I can't tell which, so this lets you start clean. It keeps Unlock everything and today's daily attempt.
- **Lifeline (Druid unlock)** is now "Heal or shield 400 HP in one fight", so a Cleric's shields count.
- **By a Thread (Warlock)** is unchanged while you try it.
- **Shop locks:** a 🔒 button on every offer. 1 gold, stays through rerolls and into the next round until bought or unlocked (unlocking is free, no refund). One lock at a time.
  - **Haggler** perk: locks are free (unlocked by Penny Pincher: 3 fights in a row with 10+ gold unspent).
  - **Layaway** perk: one more lock (unlocked by Window Shopper: buy 5 locked offers in one run).

**Engine: stacking statuses.** One general system for buildup, damage over time and timed effects. A status can change stats per stack, deal damage each turn, expire after some turns, burst at a threshold, or keep a unit above 0 HP. Stack counts show as pips on unit cards during fights, and bursts pop a 💥.

**Runeblade** 🔒 (unlocked by Spellsword: win a fight with a Warrior and a Mage, both level 5+)
- Every basic attack carves a Rune; Runestrike carves 2. At 5 Runes they detonate for 250% ATK.
- **Spellblade:** detonations splash the row. **Stormblade** fights from the back row: Runes land everywhere and detonations arc to random enemies. **Earthwarden** turns into a rune tank whose detonations shield it.
- **Duskblade** (divine and shadow, so it counts as Light *and* Dark): detonations heal. **Dawnblade** fights from the back row and heals the party with each detonation. **Voidblade** turns Runes into Corruption (damage over time), with lifesteal and execute damage.

**Dark Knight** 🔒 (unlocked by Last One Standing: win a fight with only one unit left)
- Pays HP to power Blood Price, heals it back, and hits harder the more HP it's missing. When bloodied, gains DEF and ATK.
- **Blackguard** (blood): **Crimson Lord** (lifesteal, missing-HP damage to every enemy) and **Hellknight** (Hellfire burns whoever hits it).
- **Dreadknight** (fear): attackers gain **Dread** (−1 ATK per stack, up to 2). **Tyrant** spreads Dread to the whole enemy party; **Revenant** rises once after falling.

**Also**
- 8 signature items (one per new tertiary), 2 enemy archetypes (Hexblade Sellsword, Fallen Knight), glossary entries for Runes, Dread, damage over time and missing HP.
- **Berserker: Deathless Fury.** The first time it would fall, it holds at 1 HP for 2 turns with +4 ATK and +4 SPD.
- **Rivals** synergy (Warrior + Dark Knight, unlocked with the Dark Knight): the first time an ally falls, both gain +3 ATK.

### What to playtest (and how)
1. **Locks:** lock something, reroll, fight, and check it's still there. Does 1 gold feel right?
2. **The new classes:** turn Unlock everything on to get them straight away, or earn them with it off. Does the Rune rhythm read in playback? Do the four paths feel distinct? Try a back-row Stormblade or Dawnblade.
3. **Dark Knight:** does the low-HP play feel good? Is Dread noticeable without feeling oppressive?
4. **Deathless Fury** on a Berserker.
5. **Unlocks with the toggle off:** consider pressing Reset progress first. Are Lifeline, Spellsword and Last One Standing reachable?
6. **By a Thread:** your call after trying it.

### Known issues
- **Bots barely use the new mechanics' synergies** (they don't plan around Runes), so new-class numbers are rougher than usual. Revenant and Earthwarden sit around +7 lift on small samples.
- **Both new classes win most 1v1 duels at level 1** (every Rune lands on the only target). In 5v5 parties they're mid-pack.
- **The "Carve" callout** shows on Runeblade basic attacks, like other on-attack passives.
- **Old play logs with Berserker level-ups may replay slightly differently,** because the Berserker's talent pool grew.
- Saved runs carry over (no reset this time).

### Simulator balance numbers
- **Full runs** (2,000 per bot, everything unlocked, tier 0): random 3.9%, sensible 21.8%, greedy 29.5%, synergy 10.3%. No stuck runs, no tick-cap hits. M7 was 5.0 / 18.8 / 38.6 / 11.9.
- **New classes (lift vs round average):** Dark Knight +3.7, Runeblade +1.9. Advanced: Dreadknight +6.9, Duskblade +3.0, Spellblade +0.4, Blackguard −1.7.
- **The first pass was far too strong on the Dark Knight side** (Hellknight +16.6, Dreadknight +14.5, Rivals +15.7); three tuning passes are logged in BALANCE.md.
- **Ladder** (finished after the merge): nothing alarming. Sensible / greedy completion: tier 0 20% / 29%, tier 2 14% / 17%, tier 5 7% / 10%, tier 7 3% / 3%, tier 8 0.9% / 0.4%, tier 10 0.2% / 0.3%. Full table in BALANCE.md.
- Tests: 305 passing.

## Milestone 7 — Meta progression (2026-10-22)

### What was built

**Your calls, as planned**
- **Locked content plus an "Unlock everything" toggle** on the title screen, which stays until 1.0.
  - New players start with Warrior, Rogue, Mage, Cleric and Ranger, 17 items, most synergies and 3 perks.
  - 30 achievements unlock the rest: Monk, Bard, Druid, Warlock, Engineer and Necromancer (each with its class item), 10 items, 3 synergies, 9 perks and two Perkception slots.
  - With the toggle on, everything is open, but achievements still track, so turning it off later shows what you've really earned.
- **10 stacking ladder tiers.** Winning a run on your highest tier unlocks the next. In order: pricier rerolls, less starting gold, a lower interest cap, one less life, stronger enemies, extra enemy items, **Elites**, **bosses** on rounds 5/10/15, earlier Elites, then empowered bosses with a second ability.
- **Perks with Perkception:** you're offered 3 perks and keep 1. Perkception (win on tier 3) offers 4 and lets you keep 2. Perkception II (tier 7) offers 5 and lets you keep 3. There are 12 perks: Deep Pockets, Armory, Bargain Hunter, Veteran, Second Wind, Tutor, Investor, Mentor, Recruiter, Extra Life, Quartermaster and Drill Sergeant.
- **Six new items:** Phoenix Feather (survive a lethal hit), War Banner, Gambler's Coin (+1 gold per win), Executioner's Axe, Mirror Shard and Soulstone.
- **44 signature items, one per tertiary class,** at 7–8 gold.
  - Only that class can equip one, a unit holds one at most, and it only shows up while that class is in your party (30% per item slot until bought).
  - Each one changes how the class plays. Examples: Ember Crown (Firelord: Wildfire spreads to your allies' kills), Ashen Heart (Phoenix rises again), Hall of Mirrors (Illusionist: images when bloodied), Heartwood Staff (Treelord: fallen allies become Ancients), Lucky Doubloon (Swashbuckler: gold per win).
- **Eight new synergies that don't need duplicate classes:**
  - **Holy Trinity:** a guardian, a support, and a striker or caster.
  - **Champions of Light** and **Legion of Night:** Light is divine, Dark is shadow or occult, so advancing can switch sides.
  - **Twilight Pact:** two of each.
  - Four class duos: **Life and Death** (Necromancer + Cleric), **Mad Science** (Engineer + Mage), **Wild Hunt** (Ranger + Druid) and **Battle Hymn** (Bard + Warrior).
- **Daily run:**
  - Date-based seed, tier (2–6) and perk offer, the same for everyone, with everything unlocked.
  - One attempt per day; the title screen shows the result.

**Screens**
- **New run:** tier picker and perk cards.
- **Collection:** six tabs (Achievements, Classes, Items, Synergies, Perks, Ladder). Every locked entry names the achievement that unlocks it.
- **Achievement toasts** during play, and the run summary lists achievements earned and any ladder tier unlocked.
- **HUD:** shows your tier and perks.
- **Shop:** marks signature items with 🌟 "Firelord only" and shows free rerolls.
- **Unit details:** name the signature item until it's equipped, and show boss passives, revives and execute damage.
- **Glossary:** eight new terms.

**Under the hood**
- **Progress is saved separately from runs** with its own version, so future save resets won't wipe unlocks. Your stored play logs now survive updates too.
- **Each run stores its setup** (tier, perks, unlocked content), so new unlocks never change a run in progress. Play-log reports print the setup.

**Tests:** 283, up from 248. New tests cover:
- Revives, execute damage, the new triggers and selectors.
- Run setups, every perk type, signature-item rules and shop offers, Elites and bosses.
- Role and party synergies.
- Unlocks, perk offers, daily runs and achievements.
- Content integrity: earning every achievement unlocks everything, and every tertiary class has exactly one signature item.
- Profile storage.

**Verified in headless Chrome at phone width:**
- A fresh profile: title screen, Collection and run setup.
- A run with a perk.
- The unlock-all toggle and a tier-10 setup.
- The daily setup.
- An injected tier-10 round-5 save, which checked:
  - The HUD shows the tier and perk.
  - Signature items show their class tag in the shop.
  - Dawnbringer is refused on a Firelord.
  - Ember Crown equips on a Firelord.
  - The fight has **Archmage Ozric** (boss) and an **Elite Cult Acolyte**.
- No overflow and no console errors.

### What to playtest (and how)

1. Merge this and play at https://aggrosec.github.io/party-auto-battler/.
   - **Old saved runs are ignored** (save format v4), but **your stored play logs are kept.**
   - Your profile starts fresh. Leave **Unlock everything** off for a run or two to feel the starting game.
2. **Unlock pacing:** do the five starting classes feel thin? Do the achievements come at a good rate?
3. **The ladder:** win a run, then climb. Which tiers feel like a fair step, and which like a wall? (The bots barely clear tier 7+, but you play far better than they do.)
4. **Signature items:** get a tertiary class and reroll a little. Do they show up often enough, and feel worth 7–8 gold?
5. **New synergies:** try a Holy Trinity party, Light vs Dark, and a duo or two.
6. **The daily run.** Then turn on Unlock everything to try the rest. Send play logs as usual.

### Known issues

- **Daily:** the date uses your phone's local time, so the daily changes at your midnight, not a global one.
- **Simulator coverage:**
  - The simulator plays with everything unlocked. Starter-only balance (5 classes) isn't simulated separately.
  - Signature items rarely appear in bot runs, so their numbers are untested by the simulator.
- **Greedy bot:** completion is up to 38.6% (from 28.1%), because the new synergies steer it into better parties. The sensible bot is unchanged at 18.8%.
- **Achievements:**
  - "Kill 3 enemies at once" counts kills in the same tick by the same unit (one attack or ability and its chain reactions).
  - Achievements earned in the daily run count.
- **Mirror Shard and Holy Trinity** differ slightly from the plan's examples, because of engine limits. DECISIONS.md lists each change.

### Simulator balance numbers

2,000 runs per bot, everything unlocked, tier 0 (full report in BALANCE.md):

| Bot | Completed | Avg wins | Fight win rate |
|---|---:|---:|---:|
| random | 5.0% | 3.6 | 42.8% |
| sensible | 18.8% | 8.6 | 66.8% |
| greedy | 38.6% | 10.8 | 76.4% |
| synergy | 11.9% | 6.4 | 58.6% |

Ladder completion (sensible / greedy): tier 0 17% / 39%, tier 2 15% / 27%, tier 5 6% / 16%, tier 7 3% / 6%, tier 8 1.5% / 1.3%, tier 10 0% / 0.1% (about 3–4 wins).

New synergy lifts: Twilight Pact +16.5, Battle Hymn +11.3, Legion of Night +6.7/+11.0, Champions of Light +9.8, Life and Death +9.1, Holy Trinity +7.7, Wild Hunt +2.4, Mad Science +1.3. Lift here partly reflects which parties can field them.

0 stuck runs and 0 tick-cap hits.

## Milestone 6 — Level cap 10, tertiary classes and granted abilities (2026-10-20)

### What was built

**Your three calls**
- **Two tertiary classes per advanced class, chosen at level 7:** 44 new classes, e.g. Knight → **Paladin** or **Vanguard**, Pyromancer → **Firelord** or **Phoenix**.
  - Each has a new ability, a passive, a stat bonus and four talents.
  - Like advancing at level 3, the ability, tags and talent pool change. Passives from the base and advanced class stay.
- **Longer runs:** a run now goes to **15 wins** (5 lives), about 15–19 rounds.
- **Second ability slot:** every tertiary pool has one talent that grants a **second ability** with its own cadence, e.g. Paladin's *Lay on Hands* every 4th turn.
  - A unit still acts once per turn. If two abilities are ready, the one that has waited longest goes first, and the other fires next turn.
  - Cooldown reduction and ability power apply to both.

**Levels 6–10**
- XP thresholds go 0 / 2 / 5 / 9 / 14 / 19 / 25 / 31 / 38 / 46. A round-1 unit reaches level 7 around round 12 without training. Level 10 takes a unit you've invested in.
- Stat points: 3 per level, 5 at levels 3, 5, **7 and 10**.
- Talent choices: base pool at 2, advanced pool at 4–6, tertiary pool at 8–10. When a pool runs low, the offer is topped up with talents the unit skipped earlier, so every level-up is a choice of 3.

**Six new summoners:** Packlord (Wolves), Illusionist (Mirror Images), Treelord (Ancients), Pit Lord (Fiends), Roboticist (Golems) and Rotcaller (Ghouls). Each does something else when the board is full, like the M5 summoners.

**Enemies** keep levelling through the longer run (into tertiary classes from about round 16). HP/ATK growth runs through round 16 at a slightly gentler rate.

**UI**
- The level-7 choice uses the same panel as advancing.
- Unit details show the lineage ("Firelord (Mage → Pyromancer)") and every granted ability with a *Talent* tag and its real cadence. They also show passives from each class tier.
- New glossary entries cover granted abilities and class tiers. The title-screen how-to now reads the numbers from the game's config.

**Tests:** 248, up from 239. New tests cover:
- Casting order with granted abilities.
- Cooldown shifts on every ability.
- The level-7 choice, including deferred choices.
- Tertiary talent pools and top-ups.
- Every advanced class having exactly 2 tertiary classes with 4 talents and one granted ability.
- Every ability's text matching its real cooldown (granted abilities included).
- The stat breakdown adding up for all 66 advanced and tertiary classes.
- Save validation of class choices.

**Verified in a real browser** (headless Chrome, 390px wide):
- A level-7 Knight choosing Paladin.
- A level-9 Firelord with Pyroblast (granted) and an Hourglass: both cadences shown changed.
- A fight with the new UI.
- No overflow and no console errors.

### What to playtest (and how)

1. Merge this and play on your phone at https://aggrosec.github.io/party-auto-battler/. **Old saves are ignored** (save format v3), so start a new run. Your saved best run resets too.
2. **Run length:** does 15 wins feel right, or does it drag on a phone?
3. **Level 7:** feed one unit training to reach level 7 sooner, and pick a tertiary class. Is round 12 or so the right time for it?
4. **Granted abilities:** take one at level 8–10 and watch it in combat. Is it clear when it fires?
5. **Summoners:** leave a slot open for Packlord, Illusionist, Treelord, Pit Lord, Roboticist or Rotcaller.
6. If a run shows something, send the play log (Export play log on the title screen).

### Known issues

- **Watch list:** Firelord (+13.8 lift), Harlequin (+13.2), Oracle and Chronarch (+11.9) lead the tertiary classes. Archdruid (−3.8) and Swashbuckler (−3.5) trail. The samples are small, so your play matters more here than the simulator.
- **The bots never leave slots empty,** so the six new summoners are under-rated in the simulator, as in M5.
- **Bots rarely reach level 10** (the average unit level across all fights is 4.2), so level-9 and level-10 talents and granted abilities have the least simulator coverage.
- **Base-tier leaders are unchanged from M5:** Warrior (+5.3) and Inquisitor (+9.2) lead; Druid (−3.3) and Beastmaster (−4.0) trail.
- **Pre-M6 play logs** replay under the new rules and diverge. That's expected.
- **Placeholder art:** emoji glyphs remain until the Juice milestone.

### Simulator balance numbers

Seed `m3`, 2,000 runs per bot:

| Bot | Completed (15 wins) | Fight win rate | Avg rounds | Avg unit level |
|---|---:|---:|---:|---:|
| random | 3.8% | 40.1% | 8.1 | 3.05 |
| sensible | 20.3% | 67.2% | 12.8 | 4.20 |
| greedy | 28.1% | 72.3% | 13.8 | 4.47 |
| synergy | 8.9% | 56.9% | 10.8 | 3.81 |

Lift spreads: base classes −3.3 to +5.3, advanced classes −4.0 to +9.2, tertiary classes −3.8 to +13.8, synergies −3.3 to +10.5, items −5.5 to +2.5. 0 tick-cap hits, 0 stuck runs. Full report in [BALANCE.md](BALANCE.md).

## Milestone 5 — Progression, balance and new classes (2026-10-18)

### What was built

**Your notes**
- **Stat points you spend yourself.**
  - Every level-up gives 3 points, or 5 at levels 3 and 5. A point buys +3 HP, or +1 ATK, DEF or SPD.
  - Click a unit with a gold **+N** badge to open the stat panel. It has +/− per stat, a **Recommended** button that fills in the class's spread (shown as dots), Reset, and Confirm.
  - Points you leave unspent go on the recommended spread when you fight. You never have to min-max, but a Berserker that skips HP for ATK and SPD is now possible.
- **No XP at max level.** Training is no longer offered for classes whose units are all level 5, and a max-level unit can't take it.
- **Fewer recruits once the party is full:** 2 recruit offers and 4 item/training offers.
- **Actions column** in the end-of-fight summary: attacks plus ability casts, e.g. "8 (2✨)".

**Five new classes**, each with 4 talents and two advanced classes (4 talents each):

| Class | Plays as | Advanced classes |
|---|---|---|
| **Monk** | Fast melee striker, 14 SPD, speeds up as it attacks | **Windwalker** (multi-hit speedster), **Iron Fist** (counter-attacking tank who taunts) |
| **Bard** | Back-row support: party SPD at the start, ATK every song | **Skald** (war chants: big party ATK buffs), **Trickster** (delays enemy abilities, saps ATK) |
| **Druid** | Slows the enemy front line | **Shapeshifter** (bear tank who taunts), **Grove Warden** (heals, summons Treants) |
| **Warlock** | Huge single-target bolts that cost its own HP | **Hexer** (curses the whole enemy party), **Demonologist** (summons Imps) |
| **Engineer** | Builds turrets in empty slots | **Machinist** (sentries every 3 turns), **Demolitionist** (cluster bombs) |

- **Summons are a new mechanic.**
  - Turrets, Sentries, Treants and Imps appear in an **empty slot** on your side, fight on their own gauge, and vanish after the fight.
  - **If your board is full, the summoner does something else instead** (a rocket, a party heal, a bolt). Running four units plus summons is a real choice, but summoners still work in a full party.
- **Four new synergies:** Inner Harmony (spirit: Monk, Bard), Nature's Bond (nature: Druid), Dark Covenant (occult: Warlock) and Workshop (tech: Engineer).
- **New enemy archetypes** for every new class, from rounds 2–4.
- **New items:** a class-tied item for each new class, plus four speed items for #9 (Quicksilver Rapier, Featherweight Charm, Winged Sandals, Adrenaline Vial).

**Balance**
- **#10, Knight + Priest + Chronomancer.**
  - Time Warp was hasting the Chronomancer itself, so it really cast every 2nd turn, not every 3rd as described.
  - It now speeds up only *other* allies, never brings an ability closer than 2 turns away, casts every 2nd turn on purpose, and hits harder to compensate.
  - The Knight's shield was trimmed, because players can now pour stat points into DEF.
  - **Results:**
    - Knight taunt uptime with a Chronomancer fell from 49% to 36% of its turns (28% without one).
    - Of 185 advanced-class pairs, Knight + Chronomancer now ranks 18th. The strongest pairs are other tank + support combos.
- **Difficulty.** You went 10–0 twice, and stat points made the bots stronger too, so the enemy curve was rebuilt.
  - **Rounds 6–10 are noticeably harder.**
  - **No more late-game wall:** enemy growth stops after round 10, so rounds 11+ hold at about 25% for the bots instead of dropping to single digits.
  - Bigger challenges are meant to come from the difficulty ladder (Milestone 7).
- **Class tuning:** several simulator passes; details in BALANCE.md and DECISIONS.md.

**Process:** CLAUDE.md now has the new milestone plan (6: level cap 10, 7: meta progression, 8: juice, 9: ship) and the updated meta-progression direction.

**Tests:** 226, up from 205. New tests cover:
- Summons: slot choice, scaling, fallback, a fallen unit's slot, fighting on the gauge.
- `payHp`, attack/ability counts, haste floors and the `otherAllies` selector.
- Stat points: grants, the allocate action, recommended spreads, auto-spend at fight time.
- The XP cap, max-level training, the full-party shop and the enemy growth cap.

**Verified in a real browser** (headless Chrome):
- A saved run with an Engineer and unspent points.
- The +N badges and the Fight-bar reminder.
- Recommended → Confirm updates stats.
- A Sentry appears in combat and is listed as a summon with its actions.
- The level-up line shows the points earned.
- The stat panel at 390px width, with no overflow and no console errors.

### What to playtest (and how)

1. `npm run dev` (or `npm run dev -- --host` for your phone). **Old saves are ignored** (stat points changed the save format), so start a new run. This also resets your saved best run.
2. **Stat points:** level a unit, click it and try both a custom spread and Recommended. Does 3 per level (5 at levels 3 and 5) feel right? Is +3 HP per point worth it next to +1 ATK, DEF or SPD?
3. **Difficulty:** rounds 6–10 should now push back. Is it a fair challenge, or too much?
4. **New classes:** try a summoner with an empty slot or two (Engineer → Machinist, or Druid → Grove Warden). Try a Monk speed build (Prayer Beads, Featherweight Charm, a second spirit unit). Try a Warlock paying HP for damage.
5. **Full party:** once you have 5 units, the shop should lean toward items and training.
6. Your play is logged in dev as always; tell me and I'll read it with `npm run playlog`.

### Known issues

- **The bots never leave slots empty,** so the simulator under-rates summoners (Engineer −2.8, Machinist −3.8 lift). Your playtest is the real test for them.
- **#9 is only partly answered.** The speed items barely widen the speed gap in bot play: the fastest unit is 1.82× the slowest, against 1.80× without the items. Stat points and the Monk already widened it from M4's 1.6×. If speed should matter more for everyone, widening class base SPD is the next step. Your call.
- **Watch list:** Knight (+9.9 lift) and Inquisitor's Zeal talent (+15.9) are the strongest picks; tank + support pairs lead overall.
- **Replaying pre-M5 play logs** runs them under the new rules, so they diverge from what you played. That's expected.
- **Placeholder art:** emoji glyphs remain until the Juice milestone.

### Simulator balance numbers

Seed `m3`, 2,000 runs per bot:

| Bot | Completed | Fight win rate | Avg rounds |
|---|---:|---:|---:|
| random | 4.9% | 35.6% | 7.5 |
| sensible | 20.7% | 61.3% | 11.1 |
| greedy | 29.1% | 65.4% | 11.5 |
| synergy | 11.3% | 52.2% | 9.7 |

Lift spreads: base classes −2.8 to +6.0, advanced classes −3.8 to +9.9, synergies −4.3 to +11.3, items −6.6 to +2.8. 0 tick-cap hits, 0 stuck runs. Full report in [BALANCE.md](BALANCE.md).

## Milestone 4 — Playable UI (2026-10-17)

### What was built

The debug view is gone; the game now has real screens.

- **Title screen:** continue your saved run, start a new one (optionally with a custom seed), see your best run and a short how-to. The combat lab is linked at the bottom.
- **Shop screen:**
  - A HUD with round, gold, lives as hearts, a wins bar and streaks.
  - The six offers as cards: a recruit card shows the class's stats, ability and tags; item cards show the class bonus.
  - **The party board with drag and drop:**
    - Drag a recruit into a slot to buy it there.
    - Drag an item or training card onto a unit to give it to that unit.
    - Drag units to reposition or swap them.
    - Drag a unit or an item to the sell zone that appears at the bottom.
    - Everything also works by clicking.
  - **A unit inspector** with the full build: final stats, ability, talents, items with their own Move/Sell buttons, and draggable item chips.
  - **Synergy progress,** e.g. "1/2 guardian → Shield Wall", so you can plan toward a tier.
  - Warning badges for melee units in the back row without reach, and ⭐ on units with a level-up waiting.
- **Combat screen:**
  - The fight plays back turn by turn from the engine's event log. The acting unit lunges, hit units shake, and floating numbers show damage, healing, shields and stat changes.
  - Ability and trigger names pop up, HP bars drain, taunts show 🎯, and sudden death is announced.
  - **Action gauges** (review feedback): each unit has a bar under its HP that fills by its SPD and turns gold when it acts, with the SPD shown beside it. Time between turns now scales with how many ticks passed, so faster units visibly act more often.
  - Controls: pause, 1x, 2x, skip and replay.
  - **End-of-fight panel:** victory/defeat, lives, XP and income, **every level-up with the stats it rolled** (review feedback; also shown on the level-up choice panel, including level-ups from training), a per-unit dealt/taken/healed table for both sides, and the full combat log on request.
- **Run summary:** every round's result and enemy classes, the final party with each unit's run totals, and an MVP.
- **Saving:** the run is saved to localStorage after every action, so a refresh doesn't lose it. Best run and playback speed are remembered. Every storage access is guarded.
- **Works on phones:** drag uses pointer events, so touch works, and the page auto-scrolls while you drag near the screen edge. The layout goes down to phone width with no sideways scrolling.
- **Small fix:** recruit names are unique within your party and the shop. Two units called "Lark" in one party made fights confusing.

**Tests:** 205, up from 180. New tests cover:
- Turn events record every living unit's gauge; the playback shows the actor full and never drains a gauge except when its unit acts.
- Level-up stat gains between two boards.
- The playback timeline: frame per turn, every event replayed once, final HP and survivors match the engine.
- Drag-and-drop rules and their encoding.
- Merged floating text.
- Storage: round-trip, corrupt/old/invalid data, and blocked or missing storage never throwing.
- Saved-run validation, run stats, best-run ordering, unique recruit names, and play-log resume.

**Verified in a real browser** (headless Chrome, scripted):
- Mouse drag-buy into a slot, click-buy, drag-move, drag an item onto a unit, and drag an item to the sell zone.
- Touch drag from the shop to the board on a 390px-wide screen, with auto-scroll.
- Fight → playback → skip → result → continue, reload → Continue run, and a full run through to the summary.
- No console errors, no horizontal overflow.

### What to playtest (and how)

1. `npm run dev`, then open the printed URL. On a phone on the same network, `npm run dev -- --host` also works.
2. **Feel of the shop:** does dragging feel natural? Try buying straight into a back-row slot, giving an item to a unit by dropping it on them, and swapping two units.
3. **Combat readability:** at 1x, can you follow who hits whom and why units die? Is 2x the right "fast" speed? Watch a Knight taunt (🎯) and a sudden-death fight.
4. **The result panel:** is the damage table useful? Is the combat log worth keeping?
5. **Refresh mid-run** and use Continue. Try a custom seed twice to see the same run.
6. Your play is logged in dev; afterwards, tell me and I'll read it with `npm run playlog` and send pointers.

### Known issues

- **Placeholder art:** emoji glyphs stand in for icons. The game-icons.net set and the credits screen come in M5, as the brief schedules them, along with sound.
- **Phone combat view is tight:** on a 390px screen, unit names truncate and the floating numbers overlap the name. It's readable, but I'd polish it in M5.
- **Balance is unchanged from M3:** the late-game wall (about 19% at round 11) is still the top M5 item. The simulator re-run gives identical numbers, since the name fix uses the same random draws.
- **The bots don't sell items,** so the simulator doesn't exercise item selling.

### Open question for you

- **Should you see the next enemy before the fight?** Right now you find out when combat starts. Showing it (or part of it, e.g. its classes) during the shop would make positioning and item choices more deliberate, but it's a design change, so it's your call. It would be an easy add in M5.

### Simulator balance numbers

No rule or content changes in M4, and the re-run matches M3's follow-up report exactly: completion is sensible 24.3%, greedy 21.1%, synergy 16.4%, random 5.9%; 0 tick-cap hits, 0 stuck runs. Full tables are in [BALANCE.md](BALANCE.md).

## Milestone 3 — Builds (2026-10-17)

### What was built

**Progression**
- Units earn XP from every fight: +2 for a win, +1 for a loss or draw.
- Levels 1–5 at 0 / 2 / 5 / 9 / 14 XP. Each level-up rolls **weighted random stat growth** per class, your direction: a Rogue leans SPD, a Warrior leans HP and DEF.
- **Every level-up is a choice:**
  - Level 2: pick 1 of 3 base talents.
  - Level 3: advance into 1 of 2 advanced classes. This changes the ability, tags, stats and passive.
  - Levels 4–5: pick 1 of 3 talents from the advanced class's pool.
- You can't fight until your choices are made, but you can keep shopping meanwhile.

**Content (all data, in `src/data/`)**
- **12 advanced classes**, two per class: Knight/Berserker, Assassin/Duelist, Pyromancer/Chronomancer, Priest/Inquisitor, Sharpshooter/Beastmaster, Lich/Plaguelord.
- **72 talents:** 4 per base class and 4 per advanced class.
- **18 items**, up to 2 per unit. Anyone can equip anything, and 10 are class-tied: the tied class gets an extra effect (Long Spear + Warriors, Spellbook + Mages, …).
- **8 synergies** from class tags, including "frontline + healer" (Vanguard) and an Adventuring Party bonus for 4–5 different classes.
- Reach items and talents (Long Spear, Polearm Training, Shadowstep, Smoke Cloak for Rogues, Duelist) give builds a way around the back-row melee penalty (#2).

**Shop and training (#5, your call):** 4 unit slots + 2 extra slots. Each extra slot rolls an item, or **class-specific training** (+2 XP for one unit of a class on your board) about a third of the time. You reroll to chase training for the unit you want. No merging.

**Enemies** level up, advance, take talents and carry items like you do, with synergies. That gives them build variety and puts every piece of content into play on both sides. Their level and item curves are fractional, so difficulty ramps smoothly.

**Engine additions**
- Traits: reach, lifesteal, ability power.
- Effects: debuff, cooldown (haste or delay).
- Triggers: `onAbility`, `onBloodied`.
- A single `UnitModifier` shape behind talents, items, advanced classes and synergies.

**Simulator (`npm run sim`)**
- Four bots: random, sensible, greedy, synergy-focused. All of them shop, target items and training, and make level-up choices.
- The report covers completion, wins, average rounds, average unit level, unspent gold, tick-cap hits, stuck runs and the win rate by round.
- Pick-to-win rates for every class, advanced class, item, talent and synergy, with the brief's 65%/35% outlier flags.
- A new **round-adjusted lift** column. Raw rates are biased by *when* things appear, so I balanced on lift.

**Debug UI (`npm run dev` → Run):**
- Level-up choice cards.
- A shop showing item effects and class bonuses.
- Click a unit for its full build: final stats including synergies, ability, talents and items, plus buttons to move items and sell.
- Active synergies, and explicit Move buttons for units and items.

**Tests:** 180, up from 129 (171 at the first review; the follow-ups add taunt, item selling and play-log replay tests). They cover every new effect, trait and trigger; build resolution and stacking; item class bonuses; synergy tiers and tag changes on advancing; XP thresholds and growth rolls; choice queues, including deferred post-advance options; items, training, selling and moving; enemy development; integrity of all build content (every talent in exactly one pool, every reference valid); simulator determinism; the lift maths; and a real-content end-to-end run.

### Review follow-ups (after Brandon's first playtest)

- **Sell items:** each equipped item has a Sell button (+1g) in the unit panel, so a full unit can make room for a better item.
- **Taunt:** a new `taunt` effect. While a unit taunts, enemy single-target attacks and abilities must target it; area attacks still hit everyone.
  - **Knight:** Holy Bulwark now taunts for 1 turn every 3rd turn (about a third of the time, more with cooldown reduction), with a smaller shield to pay for it.
  - **Warrior:** a new base talent, Challenge, taunts for 1 turn at the start of combat. It replaces Bulwark.
  - **Result:** backline deaths while a front-liner still stood fell from 62% to 56%. Knight's lift is +5.4 (it was +4.3).
- **Dev play log:** under `npm run dev`, your run's seed, every shop action and each fight result are appended to `playlogs/<date>.jsonl` (gitignored). `npm run playlog` replays them through the engine, round by round: what you bought and chose, both parties' builds, damage per unit, death order, and notes such as gold past the interest cap or back-row melee without reach.

### Fixed during development

- **Deferred talent choices could vanish:** resolving a level-2 talent wiped a queued level-4 choice that was waiting on the advanced class. A new test caught it before commit, and it's fixed.

### What to playtest (and how)

1. `npm install`, then `npm run dev`. The **Run** tab opens by default.
2. Play a few runs (change the seed for different shops and enemies). Worth checking:
   - **Level-ups:** after your first win, a ⭐ panel asks for a talent. At level 3 you choose an advanced class. Are the choices interesting, or are some obvious?
   - **Builds:** click a unit to see its final stats. Try a class-tied item on its class (the bonus shows in gold) and on another class.
   - **Back-row melee:** put a Warrior in the back with a Long Spear, or take Polearm Training. It should hit at full strength.
   - **Synergies:** two Warriors gives Shield Wall; a Warrior plus a Cleric gives Vanguard. Advancing a Warrior to Knight adds divine.
   - **Training:** it only appears for classes you own. Reroll to chase it.
   - **Difficulty:** rounds 1–4 are easy, then it ramps. Rounds 11+ are very hard for everyone (see known issues). Does that feel right?
3. `npm run sim` prints all the tables in about 35 seconds.

### Known issues / open questions

- **Late-game wall:** from round 11, every bot wins only about 20% (then 7%, 4%), regardless of skill. Comeback runs hit a hard final hurdle. That's a balance question for M5, unless you want it changed sooner.
- **Accelerate** (Chronomancer talent) is the strongest pick left, at +8 lift. Queued for the M5 balance pass.
- **Three raw outliers** (Call of the Wild, Shadow Pact, Shield Wall tier 1) are an early-round artefact; their round-adjusted lift is only +1 to +6.
- **The greedy bot isn't smarter than the sensible one.** Its power estimate undervalues effects. It's useful as a foil, and could be improved in M5.
- **Necromancer** is still locked (meta unlocks are M5). Enemies already use it.
- The debug UI is still plain: no drag-and-drop, icons or animation (M4).

### Simulator balance numbers

2,000 full runs per bot, seed `m3`:

| Bot | Completed | Avg wins | Avg rounds | Fight win rate | Avg unit level | Unspent gold |
|---|---:|---:|---:|---:|---:|---:|
| random | 5.9% | 3.87 | 8.6 | 44.9% | 2.99 | 3.4 |
| sensible | 24.4% | 7.89 | 11.8 | 66.8% | 3.64 | 2.5 |
| greedy | 21.5% | 7.75 | 11.8 | 65.6% | 3.64 | 3.1 |
| synergy | 15.1% | 6.68 | 11.1 | 60.6% | 3.49 | 1.9 |

Sensible-bot win rate by round: 94, 100, 98, 96, 82, 72, 71, 65, 53, 39, 19, 7, 5, 2%.

Round-adjusted lift ranges:

| Category | Lift range |
|---|---|
| Classes | −1.7 to +2.2 |
| Advanced classes | −2.9 (Priest) to +5.3 (Inquisitor) |
| Items | −2.3 to +3.6 |
| Synergies | −2.7 to +5.9 |
| Talents | −3.2 to +8.2 |

0 tick-cap hits, 0 stuck runs. Full tables are in [BALANCE.md](BALANCE.md).

## Milestone 2 — Run loop (2026-10-17)

### What was built

**Your M1 design calls**
- **Sudden death (#1):** from tick 300, a pulse every 10 ticks deals true damage to every unit, growing 5% → 10% → 15%… of max HP. Tick-cap timeouts dropped from 0.15% to 0, and the longest fight is now about 370 ticks.
- **Back-row melee (#2):** Warriors and Rogues in the back row deal 50% damage while their front row stands, and full damage once it falls. Units now declare melee or ranged. #2 stays open as you asked.

**Run loop (`src/engine/run/`)** is a pure, deterministic reducer over plain JSON state, so saves are ready for later:
- Play until **10 wins** (complete) or **0 lives** (over), starting with 5 lives. Draws count as neither. Both were your calls.
- **Shop:** 4 random units at 3g each, reroll for 1g, sell for a 1g refund, and a free refresh every round.
- **Board:** units auto-place into their preferred row on purchase, and can be moved or swapped anywhere.
- **Economy:** 10 starting gold, then 5 per round, plus interest (1 per 5 unspent, max 2), plus a streak bonus (+1 at 2 in a row, +2 at 4, for wins *or* losses).
- **Enemies:** six archetypes (Bandit Brute, Cutthroat, Poacher, Hedge Mage, Cult Acolyte, Bonecaller) unlocking by round.
  - Party size grows 2 → 3 → 4 → 5 by round 4.
  - Stats start at 75% and grow each round (+3.75% HP, +2.75% ATK).
  - Each enemy depends only on seed + round, so rerolling can't change your next fight.
- All economy and enemy numbers live in `src/data/`.

**Simulator (`npm run sim`):** full runs with two bots (random and sensible). It reports completion rate, the wins distribution, the difficulty curve by round, unspent gold and per-class win rates. The M1 combat probe still runs alongside.

**Debug UI (`npm run dev`):** a new **Run** tab where you can play a whole run. It has the shop, a click-to-move board (back slots drawn between front lanes, matching targeting), fights with the event log and income breakdown, and a run-end banner. The M1 page lives on as **Combat lab**. I verified it by driving a full run in headless Chrome: no console errors.

**Tests:** 129, up from 73. New coverage:
- sudden death (timing, escalation, true damage, draws, no kill credit)
- the back-row penalty (on/off, abilities, ranged exempt)
- economy formulas
- board placement and moves
- every shop action and its error cases, plus input immutability
- win, loss and draw settlement, and run completion and defeat
- enemy generation (size, unlocks, scaling, placement, determinism)
- "rerolls don't change the enemy"
- same seed + actions → same run, and save/resume through JSON
- fair cross-side tie-breaks (coin flip, mirror matches about 50/50)
- simulator determinism and a UI render

### Fixed during review

- **Mirror matches were rigged for the player.** When units on both sides were ready on the same tick, the player always acted first. That won 78% of exact mirrors (Brandon's Warrior/Cleric mirror test was a flawless 5-0) and quietly inflated run results. Cross-side ties now go to a **seeded coin flip**, which keeps fights deterministic and makes mirrors about 50/50. A regression test guards it.
- **Enemy growth retuned** (+4%/+3% → +3.75%/+2.75% per round) to restore the intended ~14% completion now that the player's hidden edge is gone.
- Recorded Brandon's direction for M3 levelling (weighted random stat gains per class) in DESIGN.md.

### What to playtest (and how)

1. `npm install`, then `npm run dev`. The **Run** tab opens by default.
2. Play a few runs (change the seed for a different shop and enemies). Worth checking:
   - **The early game is easy on purpose** (rounds 1–3 are near-certain wins). Does it feel too easy, or like a good warm-up?
   - **Difficulty bites around rounds 6–8.** Does the ramp feel fair?
   - **Back-row melee:** put a Rogue in the back and read the log. Its hits should be halved until your front row dies.
   - **Sudden death and fair mirrors:** in the Combat lab, set *both* sides to **Warrior ×3 front + Cleric ×2 back**, then try these seeds:
     - `a`: the fight stalls, ⏳ pulses start at tick 300, and both sides fall to the same pulse (a draw at tick 370).
     - `d`: the enemy wins at tick 238.
     - `demo`: the player wins at tick 238.

     Across 200 seeds this mirror goes 55 player / 53 enemy / 92 draw. Before the fix, the player won every time.
   - **Gold:** you'll notice gold piling up once your party is full. That's expected until M3 (see known issues).
3. `npm run sim` prints all the tables in about 5 seconds.

### Known issues / open questions

- **#5 (needs your call before M3):** should duplicate units merge or grant XP? My suggestion is merging as XP, which gives the shop a second purpose and a gold sink.
- **No gold sink yet:** bots enter combat with about 32–36 unspent gold. Items and progression (M3) are the planned sinks.
- **Choices matter only a little yet:** sensible beats random 14.4% to 11.3% on completion. Every unit is at base power until talents and items land in M3.
- **Enemy scaling is tuned for no player progression** and will be retuned in M3.
- **I edited CLAUDE.md:** the run-structure lines now say "until 10 wins or 0 lives" and that draws count as neither, matching your answers. Revert it if you'd rather keep the brief untouched.
- The debug UI is still deliberately plain: no drag-and-drop, animation or icons (M4).

### Simulator balance numbers

2,000 full runs per bot, seed `m2`:

| Bot | Completed (10 wins) | Avg wins | Avg rounds | Avg unspent gold |
|---|---:|---:|---:|---:|
| random | 11.3% | 6.45 | 11.0 | 32.2 |
| sensible | 14.4% | 7.66 | 12.2 | 36.1 |

Sensible-bot fight win rate by round: 99% (round 1), 100%, 100%, 99%, 89%, 79%, **56%** (round 7), 42%, 34%, 29%, 23%, 20%, 11%, 8% (round 14).

Combat probe (role-placed random 5v5): every class is between 44% and 57%, with no outliers, 0 timeouts and a 0% draw rate. Full tables are in [BALANCE.md](BALANCE.md).

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

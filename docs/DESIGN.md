# Game Design Doc (living)

> Brandon owns the design. This doc records the current state of the game's rules as implemented, and grows each milestone. The brief lives in [CLAUDE.md](../CLAUDE.md); autonomous choices are logged in [DECISIONS.md](DECISIONS.md).

## Status

| Area | State |
|---|---|
| Combat engine | ✅ Milestone 1 |
| Run loop (shop, gold, rounds, lives, enemies) | ✅ Milestone 2 |
| Builds (XP, talents, advanced classes, items, synergies) | ✅ Milestone 3 |
| Playable UI (screens, drag-to-position, combat playback, run summary) | ✅ Milestone 4 |
| Progression, balance and new classes (stat points, Monk/Bard/Druid/Warlock/Engineer, summons) | ✅ Milestone 5 |
| Level cap 10, tertiary classes at level 7, ability-granting talents, 15-win runs | ✅ Milestone 6 |
| Meta progression (difficulty ladder, achievements, unlocks, starting perks, daily seed) | Milestone 7 |
| Juice (icons, sound, credits) | Milestone 8 |
| Ship (GitHub Pages, README) | Milestone 9 |

## Run structure

- A run continues until **15 wins** (run complete) or **0 lives** (run over). You start with **5 lives** and lose 1 per lost fight, so a run takes 15–19 rounds (more if there are draws). *(Brandon, 2026-10-17; raised from 10 wins in M6 so levels 6–10 get played out.)*
- **Draws** count as neither a win nor a loss: no life is lost, streaks reset, and the round still advances. *(Decided by Brandon, 2026-10-17.)*
- Each round is a **shop phase** followed by a **combat phase**.

## Shop and economy

All numbers live in `src/data/economy.ts` and are tuned with the simulator.

| | Value |
|---|---|
| Starting gold | 10 |
| Income each round after the first | 5 base + interest + streak bonus |
| Interest | +1 per 5 unspent gold at the end of the shop phase, max +2 |
| Streak bonus | 2+ wins or losses in a row: +1. 4+: +2 |
| Unit cost | 3 |
| Sell refund | 1 |
| Reroll | 1 (the shop refreshes for free each round) |
| Shop size | 4 unit slots + 2 extra slots (items or training); with a full board, 2 unit slots + 4 extra slots |
| Items | 3–5 gold |
| Training | 3 gold for +2 XP |

- Unspent gold carries over between rounds.
- The shop offers the ten starter classes with equal odds. Unlocked classes (Necromancer) join the pool through meta progression (Milestone 7).
- **Once your board is full,** two of the four recruit slots become item/training slots, since recruits are then only useful as replacements. *(Brandon, M5.)*
- Bought units auto-place into their preferred row (Warrior, Rogue and Monk front, others back), overflowing to any empty slot. Units can be moved freely; moving onto an occupied slot swaps the two.
- Duplicates of a class are allowed and never merge (#5, Brandon's call).
- **Extra slots** roll an item, or (35% of the time, if you own a unit) **training** for one of the classes on your board, e.g. "Warrior Training: +2 XP to one Warrior". Training is class-specific and random, so you reroll to chase XP for the unit you want (#5). It's only offered for classes with a unit below the level cap, and a max-level unit can't take it. *(Brandon, M5.)*
- Items and training go to the unit you select. Items can be moved between units in the shop, or sold on their own for 1 gold to free the slot. Selling a unit refunds 1 gold plus 1 per equipped item.

## Enemies

- Each round's enemy party is generated from **archetypes** (`src/data/enemies.ts`): Bandit Brute (Warrior), Cutthroat (Rogue), Poacher (Ranger), Hedge Mage (Mage, round 2+), Temple Brawler (Monk, 2+), Cult Acolyte (Cleric, 3+), Wandering Minstrel (Bard, 3+), Grove Keeper (Druid, 3+), Goblin Tinker (Engineer, 4+), Blood Cultist (Warlock, 4+) and Bonecaller (Necromancer, 5+).
- Party size by round: 2, 3, 4, then 5 from round 4.
- **Enemies develop like players do.** Each enemy unit is levelled for the round, making random talent and advanced-class choices, spends its stat points on its class's recommended spread, and carries random items. Levels and item counts are fractional averages (e.g. level 2.4 = each unit is level 3 with 40% chance), so enemy power ramps smoothly instead of in steps: level 1 → 3 by round 7, 5.3 by round 14 and 7.8 by round 21 (tertiary classes appear from about round 16); 0 → 2 items over rounds 1–16.
- Synergies apply to enemies too.
- On top of that, HP and ATK start at **100%** and grow **+8.5% HP / +5% ATK per round through round 16**, then stop, so a long comeback run never hits a wall.
- The enemy depends only on the run seed and round number, so rerolling or reshuffling your party never changes who you fight.

## Board

- Each side has a **front row (3 slots)** and a **back row (2 slots)**.
- The back row's slots sit *between* the front row's lanes: back slot 0 is between front 0 and 1, back slot 1 is between front 1 and 2. This matters for nearest-lane targeting.
- **Back-row melee:** melee units (Warrior, Rogue, Monk, and melee summons like the Treant) in the back row deal **50% damage** while any ally stands in their front row. Once the front row falls, they hit at full strength. This applies to all their damage, abilities included. *(Issue #2, option 3; kept open to revisit with talents and items.)*

## Stats

| Stat | Meaning | Typical range (base) |
|---|---|---|
| HP | Health. 0 = dead. | 24–42 |
| ATK | Basic attack damage; most abilities scale off it. | 4–7 |
| DEF | Damage reduction with diminishing returns. | 0–3 |
| SPD | How fast the action gauge fills. | 8–14 |

## Combat rules

**Timeline.** Combat runs in ticks. Every tick, each living unit adds its SPD to an action gauge. When the gauge reaches 100, the unit takes a turn and the gauge drops by 100 (the overflow carries over). SPD 10 = one turn every 10 ticks. SPD is clamped to 1–100.

**Turn order on the same tick:** fullest gauge first → higher SPD → board order (front 0–2, then back 0–1). If units on *opposite* sides are still tied, a **seeded coin flip** (once per tick) decides which side goes first. Fights stay deterministic (same seed, same result), and neither side has a built-in edge. *(Changed in M2 review: the original player-first tie-break won 78% of exact mirror matches.)*

**A turn:**
1. `onTurnStart` triggers fire.
2. The ability cooldown ticks down by 1. If it hits 0, the unit **casts its ability** instead of attacking and the cooldown resets. (Cooldown 3 = casts every 3rd turn.)
3. Otherwise it makes a **basic attack** (1× ATK) at its attack target, then `onAttack` triggers fire.

**Damage.** `damage = max(1, round(raw × 10 / (10 + DEF)))`. 10 DEF halves damage; DEF never makes a unit immune. *Pierce* ignores DEF. **Shields** absorb damage before HP.

**Sudden death.** From **tick 300**, a pulse every 10 ticks deals true damage (ignores DEF and shields) to every unit: 5% of max HP, then 10%, 15% and so on. Because it's a share of max HP, sudden death is won by whoever keeps their HP *percentage* higher, through attrition or healing, not by a raw HP pool. It credits no one with damage or kills. *(Issue #1, option 3.)* Typical fights end around tick 100; the longest seen in simulation end by tick 370.

**End.** Combat ends when one side has no living units. If both sides die at the same moment (including to the same sudden-death pulse), it's a draw. A **1,000-tick cap** remains as a safety net and counts as a draw; sudden death makes it unreachable in practice.

## Targeting

| Selector | Picks |
|---|---|
| `nearest` | Frontmost living enemy row; closest lane to the attacker; ties → lower column. Reaches the back row only when the front row is empty. (Renamed from `melee` in M2: casters use it too, and melee/ranged is now a unit property.) |
| `backlineFirst` | Lowest-HP enemy in the back row; falls back to `nearest`. |
| `lowestHp` | Lowest current HP among all enemies. |
| `highestAtk` | Highest ATK among all enemies. |
| `randomEnemy` | Uniform random (seeded). |
| `enemyFrontRow` | Every living unit in the frontmost enemy row. |
| `allEnemies` / `allAllies` | Everyone on that side. |
| `otherAllies` | Every ally except the unit itself. |
| `self` | The unit itself. |
| `lowestHpAlly` | Ally (including self) with the lowest HP **percentage**. |
| `triggerSource` / `triggerTarget` | The other unit involved in a trigger (see below). |

Ties are always broken by board order, so targeting is deterministic.

**Taunt:** while any enemy is taunting, the single-target enemy selectors (`nearest`, `backlineFirst`, `lowestHp`, `highestAtk`, `randomEnemy`) choose only among taunting units, using their normal rule. Area effects (`enemyFrontRow`, `allEnemies`, splash) and trigger targets are unaffected. *(M3 review: Brandon asked for a taunting Warrior/Knight because backliners died while the front line stood.)*

## Effects and triggers

All special behaviour (class abilities now, talents and items later) is data: a list of **effects** fired by an ability or a **trigger**.

**Effects:** `damage` (with optional `hits`, `splash` to row neighbours, `pierce`), `heal` (capped at max HP), `shield`, `buff` and `debuff` (ATK/DEF/SPD, rest of combat; debuffs floor at 0), `cooldown` (shift a unit's next ability sooner or later; haste never brings it closer than a floor, by default next turn), `taunt` (draw enemy single-target attacks and abilities for the unit's next N turns; reapplying refreshes rather than stacks), `payHp` (the unit loses HP as a cost; true damage that credits no attacker, so it never feeds lifesteal or "when hurt, hit the attacker" effects), and `summon` (see below).

**Summons (M5).** A `summon` effect puts a combat-only unit (Turret, Sentry, Treant, Imp) into the first empty slot on the summoner's side, preferred row first; it can take the slot of a fallen unit. Its HP and ATK are a share of the summoner's, multiplied by ability power. It acts on the gauge like anyone else and keeps its side alive. **If the board is full, the summoner's fallback effect fires instead** (a rocket, a heal, a bolt). So summoners reward leaving slots empty, but still work in a full party. Summons never join your board after the fight. Amounts scale off the source's stats: `flat + atk×ATK + def×DEF + maxHp×MaxHP`.

**Unit traits** (from talents, items, advanced classes and synergies): `reach` (no back-row melee penalty), `lifesteal` (heal a share of damage dealt), `abilityPower` (scales the unit's ability damage, heals and shields).

**Triggers:**

| Trigger | Fires when | `triggerSource` | `triggerTarget` |
|---|---|---|---|
| `startOfCombat` | Before the first tick | – | – |
| `onTurnStart` | Start of the unit's turn | – | – |
| `onAttack` | After the unit's basic attack (not abilities) | – | unit attacked |
| `onAbility` | After the unit casts its ability | – | – |
| `onHurt` | Unit takes damage and survives | attacker | – |
| `onBloodied` | First time the unit drops below 50% HP (and survives) | attacker | – |
| `onKill` | Unit kills an enemy | – | victim |
| `onAllyDeath` | Another unit on the same side dies | killer | fallen ally |

Triggers can have a `chance` (seeded) and a per-combat `limit`. Chains of triggers (thorns hitting thorns...) stop at depth 4.

## Classes

| Class | Role | Range | HP/ATK/DEF/SPD | Attacks | Ability | Passive |
|---|---|---|---|---|---|---|
| Warrior | Frontline | Melee | 42/6/3/8 | nearest | **Cleave** (every 3rd turn): 80% ATK to each enemy in the front row | **Battle Hardened:** +1 DEF when hurt (max 3 times) |
| Rogue | Striker | Melee | 24/6/1/13 | nearest | **Backstab** (3): 200% ATK to the weakest back-row enemy | **Bloodlust:** +2 ATK on kill |
| Mage | Caster | Ranged | 24/7/0/9 | nearest | **Fireball** (3): 200% ATK to the weakest enemy, 50% splash to its row neighbours | – |
| Cleric | Support | Ranged | 30/4/2/9 | nearest | **Mend** (2): heal the most injured ally for 250% ATK | **Blessing:** start of combat, shield all allies for 100% ATK |
| Ranger | Striker | Ranged | 26/5/1/11 | lowest HP | **Volley** (3): 3 arrows at random enemies, 80% ATK each | **Quick Shot:** 25% on attack, extra 50% ATK pierce hit |
| Monk | Striker | Melee | 30/5/2/14 | nearest | **Flurry** (3): 3 × 50% ATK on the nearest enemy | **Momentum:** +1 SPD per basic attack (max 3) |
| Bard | Support | Ranged | 26/4/1/10 | random | **Rousing Ballad** (3): all allies +1 ATK | **Inspire:** start of combat, all allies +1 SPD |
| Druid | Support | Ranged | 34/5/1/9 | nearest | **Entangle** (3): 90% ATK to the enemy front row, which loses 1 SPD | **Thornhide:** 30% when hurt, 2 piercing damage to the attacker |
| Warlock | Caster | Ranged | 28/7/0/9 | highest ATK | **Shadow Bolt** (3): 230% ATK to the strongest enemy, then pay 8% max HP | **Soul Siphon:** heal 25% max HP on kill |
| Engineer | Caster | Ranged | 28/5/2/9 | nearest | **Deploy Turret** (4, first on turn 2): summon a Turret (50% HP, 60% ATK); full board: 160% ATK rocket | **Field Repairs:** 30% at turn start, heal the most wounded ally 3 |
| Necromancer 🔒 | Caster | Ranged | 24/5/1/9 | lowest HP | **Drain Life** (3): 150% ATK to the weakest enemy, heal self 100% ATK | **Dark Harvest:** +2 ATK when an ally dies |

🔒 = unlockable via meta progression (Milestone 7). Monk, Bard, Druid, Warlock and Engineer were added in M5 at Brandon's request.

**Tags** (for synergies): Warrior martial + guardian, Rogue martial + shadow, Mage arcane, Cleric divine, Ranger martial + wild, Monk martial + spirit, Bard arcane + spirit, Druid wild + nature, Warlock shadow + occult, Engineer tech, Necromancer arcane + shadow. Advanced classes replace their base tags.

**Recommended stat spreads** (relative weights; the "Recommended" button and enemies follow these, players can ignore them):

| Class | HP | ATK | DEF | SPD |
|---|---|---|---|---|
| Warrior | 4 | 3 | 2 | 1 |
| Rogue | 1 | 3 | 1 | 4 |
| Mage | 2 | 4 | 0 | 1 |
| Cleric | 3 | 2 | 2 | 1 |
| Ranger | 2 | 3 | 1 | 3 |
| Monk | 2 | 3 | 1 | 4 |
| Bard | 3 | 2 | 1 | 3 |
| Druid | 4 | 2 | 2 | 1 |
| Warlock | 2 | 4 | 1 | 2 |
| Engineer | 3 | 3 | 2 | 1 |
| Necromancer | 2 | 4 | 1 | 1 |

Some advanced classes override their base spread (e.g. Knight leans HP/DEF, Windwalker SPD).

## Progression

- **XP from combat:** every unit on the board gains 2 XP for a win and 1 for a loss or draw. Training adds more.
- **Levels 1–10** at 0 / 2 / 5 / 9 / 14 / 19 / 25 / 31 / 38 / 46 cumulative XP. A unit bought in round 1 reaches level 3 around round 4, level 5 around round 8 and level 7 around round 12; training gets it there sooner, and level 10 takes a unit you've invested in. *(M6.)*
- **Every level-up grants stat points** that you spend however you like: **3 per level, 5 at levels 3, 5, 7 and 10** (16 by level 5, 38 by level 10). One point buys **+3 HP, or +1 ATK, +1 DEF or +1 SPD**. Spend them in the unit inspector; "Recommended" fills in the class's spread. Points still unspent when you fight go on the recommended spread automatically, so nobody is forced to min-max. *(Brandon, M5: replaces the random growth rolls, so a Berserker can skip HP entirely and dump ATK and SPD.)*
- **Max-level units gain no XP.** *(Brandon, M5.)*
- **Every level-up** also offers a choice (the run blocks the next fight until you pick):
  - **Level 2:** 1 of 3 talents from the base class pool.
  - **Level 3:** advance into 1 of 2 advanced classes. This replaces the ability and tags, and adds stats and a passive.
  - **Levels 4–6:** 1 of 3 talents from the advanced class pool.
  - **Level 7:** ascend into 1 of 2 **tertiary classes** (M6). Same as advancing: new ability, tags and talent pool, plus stats and a passive. Passives from the base and advanced class stay.
  - **Levels 8–10:** 1 of 3 talents from the tertiary class pool.
  - When the current pool has fewer than 3 unpicked talents, the offer is topped up with talents skipped at earlier tiers, so every level-up is a choice of 3.
- **Talent-granted abilities (M6).** Each tertiary pool has one talent that grants a **second ability** with its own cadence (e.g. Paladin's Lay on Hands, every 4th turn). A unit still acts once per turn: if several abilities are ready, the one that has waited longest goes first (ties go to the rarer one), and the rest wait. Cooldown changes and ability power apply to every ability. *(Brandon chose a second ability slot.)*
- Content lives in `src/data/builds/<class>.ts` (base class, 4 talents, 2 advanced classes with 4 talents each) and `src/data/builds/tertiary/<class>.ts` (4 tertiary classes with 4 talents each). That's 11 classes, 22 advanced classes, 44 tertiary classes and 308 talents.

## Advanced classes

| Base | Advanced | Tags | Ability | Passive |
|---|---|---|---|---|
| Warrior | **Knight** | martial, guardian, divine | Holy Bulwark: shield all allies 2 + 60% DEF and taunt for 1 turn | 20% when hurt: shield self 3 |
| Warrior | **Berserker** | martial | Whirlwind: 85% ATK to every enemy | +15% lifesteal; +4 ATK when bloodied |
| Rogue | **Assassin** | shadow | Assassinate: 320% ATK to weakest back-row enemy | Shield 8 on kill |
| Rogue | **Duelist** | martial | Flurry: 3 × 80% ATK on nearest | Reach; 35% riposte for 80% ATK |
| Mage | **Pyromancer** | arcane | Meteor (every 2nd turn): 140% ATK to the enemy front row | Kills fling 80% ATK at a random enemy |
| Mage | **Chronomancer** | arcane | Time Warp (every 2nd turn): *other* allies' abilities 1 turn sooner, but never closer than 2 turns; 150% ATK nearest | Start of combat: enemies −1 SPD |
| Cleric | **Priest** | divine | Prayer of Healing: heal all 180% ATK, shield all 60% ATK | Ally death: shield all 100% ATK |
| Cleric | **Inquisitor** | divine, martial | Judgment: 170% ATK pierce to strongest, self-heal 100% ATK | After casting: strongest enemy −1 DEF |
| Ranger | **Sharpshooter** | martial | Aimed Shot: 220% ATK pierce to strongest | Kills: next ability 2 turns sooner |
| Ranger | **Beastmaster** | wild | Call the Pack: 4 × 70% ATK at random enemies | Start of combat: allies +1 ATK |
| Monk | **Windwalker** | martial, spirit | Hundred Fists: 5 × 45% ATK at random enemies | +2 SPD on kill |
| Monk | **Iron Fist** | martial, guardian, spirit | Counterstance: shield self 3 + 120% DEF and taunt for 1 turn | 25% when hurt: riposte for 60% ATK |
| Bard | **Skald** | martial, spirit | War Chant: all allies +2 ATK | Ally death: all allies +1 ATK |
| Bard | **Trickster** | arcane, shadow | Discord (every 4th turn): every enemy's ability 1 turn later, strongest enemy −2 ATK | Start of combat: enemy front row −1 SPD |
| Druid | **Shapeshifter** | wild, guardian, nature | Maul: 170% ATK to the nearest enemy and taunt for 1 turn | When bloodied: +3 ATK, +2 DEF |
| Druid | **Grove Warden** | nature, divine | Call of the Grove (first on turn 2): summon a Treant (80% HP, 60% ATK); full board: heal all 120% ATK | Turn start: heal the most wounded ally 3 |
| Warlock | **Hexer** | shadow, occult | Withering Curse: all enemies −1 ATK/−1 DEF, then 60% ATK to all | Kills: all enemies −1 DEF |
| Warlock | **Demonologist** | arcane, occult | Summon Imp (first on turn 2): Imp (40% HP, 70% ATK); full board: 180% ATK to strongest | Ally death: +2 ATK |
| Engineer | **Machinist** | tech | Deploy Sentry (first on turn 1): Sentry (50% HP, 70% ATK); full board: 220% ATK rocket, 50% splash | Turn start: heal the most wounded ally 4 |
| Engineer | **Demolitionist** | tech, martial | Cluster Bomb: 2 × 50% ATK to every enemy | Kills: 40% ATK to every enemy |
| Necromancer | **Lich** | arcane, shadow | Death Nova: 90% ATK to all, self-heal 100% ATK | Kills heal 200% ATK |
| Necromancer | **Plaguelord** | shadow | Plague: all enemies −1 ATK/−1 DEF, 50% ATK to all | Ally death: all enemies −1 ATK |

## Items

Up to 2 per unit, bought from the shop's extra slots. **Anyone can equip anything.** Class-tied items give their classes an *extra* effect rather than being locked to them, in keeping with the build-variety principle.

| Item | Cost | Effect | Class bonus |
|---|---|---|---|
| Iron Sword / Chainmail / Swift Boots / Giant's Belt | 3 | +3 ATK / +2 DEF +4 HP / +2 SPD / +12 HP | – |
| Vampiric Fang | 4 | +20% lifesteal | – |
| Thorned Mail | 4 | When hurt, 2 piercing damage to attacker | – |
| Hourglass | 5 | Ability cooldown −1 | – |
| Healing Charm | 3 | When bloodied, heal 25% max HP | – |
| Long Spear | 3 | Reach, +1 ATK | Warriors: +2 ATK |
| Tower Shield | 4 | Start of combat: shield self 8 | Warriors: also shield all allies 3 |
| Smoke Cloak | 3 | +2 SPD | Rogues: reach |
| Spellbook | 4 | +25% ability power | Mages: +25% more |
| Holy Symbol | 4 | +20% ability power | Clerics & Knights: shield all allies 3 |
| Hunting Bow | 4 | 25% on attack: extra 50% ATK hit | Rangers: +2 ATK |
| Skull Totem | 4 | Ally death: +2 ATK | Necromancers: also heal 200% ATK |
| Rage Gauntlets | 4 | When bloodied: +4 ATK | Berserkers: +15% lifesteal |
| Assassin's Dagger | 4 | Kills: next ability 1 turn sooner | Rogues: +30% ability power |
| Time Shard | 4 | Start of combat: shield self 150% ATK | Mages: every enemy's first ability 1 turn later |
| Quicksilver Rapier | 5 | +2 ATK, +2 SPD | – |
| Featherweight Charm | 3 | +4 SPD, −6 HP | – |
| Winged Sandals | 5 | Start of combat: all allies +1 SPD | – |
| Adrenaline Vial | 3 | When bloodied: +5 SPD | – |
| Prayer Beads | 3 | +2 SPD | Monks: +1 SPD per basic attack (max 4) |
| Enchanted Lute | 4 | +20% ability power | Bards: start of combat, all allies +1 ATK |
| Oak Heart | 3 | +10 HP | Druids: 25% when hurt, shield self 4 |
| Cursed Tome | 3 | +3 ATK, −4 HP | Warlocks: +15% lifesteal |
| Gearbox | 3 | +2 DEF, +1 SPD | Engineers: +40% ability power |

The speed items are issue #9's first step: more ways to build around SPD before touching class SPD itself.

"Warriors", "Rogues" and so on include that class's advanced classes. Reach items and talents (Long Spear, Smoke Cloak for Rogues, Polearm Training, Shadowstep, Duelist) are the #2 hook: ways for a build to opt out of the back-row melee penalty.

## Synergies

The highest tier met is active. Synergies apply to enemies too.

| Synergy | Requirement | Bonus |
|---|---|---|
| Martial Discipline | 2 / 4 martial | Martial units +2 ATK / +2 ATK +4 HP |
| Arcane Circle | 2 / 3 arcane | Arcane units +30% AP +8 HP / +40% AP +10 HP |
| Shield Wall | 2 / 3 guardian | Every ally starts with a 3 / 7 shield |
| Divine Choir | 2 divine | Every ally heals 2 HP at the start of its turns |
| Shadow Pact | 2 shadow | Shadow units +10% lifesteal, +1 SPD |
| Call of the Wild | 2 wild | Wild units +2 SPD |
| Inner Harmony | 2 / 3 spirit | Spirit units +2 SPD / +2 SPD +6 HP |
| Nature's Bond | 2 nature | Every ally +8 HP, +1 DEF |
| Dark Covenant | 2 occult | Occult units +4 ATK, −6 HP |
| Workshop | 2 tech | Tech units +40% AP (stronger turrets and bombs), +2 DEF |
| Vanguard | 1 guardian + 1 divine | Guardians +3 DEF (the brief's "frontline + healer") |
| Adventuring Party | 4 / 5 different classes | Every ally +3 / +4 HP |

## Resolved design questions

- **#1 Heal stalemates:** sudden death (option 3). Implemented in M2.
- **#2 Back-row melee:** 50% damage while the front row stands (option 3). Implemented in M2. M3 adds reach items, talents and the Duelist as ways around it. The issue stays open to revisit.
- **#5 Duplicates:** no merging. XP comes from combat plus random class-specific training offers in the shop (option 3, M3).
- **Run length:** play until 10 wins or 0 lives (the brief's "up to 10 rounds" conflicted with "10 wins = complete").
- **Draws:** count as neither win nor loss.

## Direction from Brandon

- *(M3, 2026-10-17)* Levelling was weighted random: per-class stat ranges rolled each level. **Replaced in M5:** the rolls were too narrow to feel random, and Brandon chose player-allocated stat points instead (see Progression).
- *(M5, 2026-10-18)* No XP at max level; mostly items and training once the party is full; an actions column in the combat summary; stat points with recommended spreads; five new classes (Monk, Bard, Druid, Warlock, Engineer); speed items before any class SPD change (#9); a look at Knight + Priest + Chronomancer (#10).
- *(M6, 2026-10-20)* Two tertiary classes per advanced class (44); longer runs rather than a faster XP curve (15 wins); ability-granting talents use a second ability slot. No global cooldown floor: getting an ability to every turn is part of building; nerf specific skills if needed.
- *(Planned)* Meta progression with a difficulty ladder, achievements that unlock classes, items, synergies and starting perks, and a daily seed (Milestone 7). Unlocks mostly add variety but may help a little; the ladder's difficulty outpaces that help, and unlocked content joins the enemy pool. Brandon will pick further classes after the core project ships.

## UI (Milestone 4)

**Screens:** Title → Shop → Combat → (result) → Shop … → Run summary. The combat lab (pick two line-ups, read the event log) is linked from the title screen.

- **Title:** continue a saved run, start a new one (optional custom seed for a reproducible run), best run, short how-to.
- **Shop:** HUD (round, gold, lives as hearts, wins progress, streak), the six offers as cards, the party board, a unit inspector (with the stat-point panel when a unit has points; units with points show a gold +N badge), synergy progress and the Fight button. Level-up choices appear as a highlighted panel above the shop; you can keep shopping, but must choose before fighting.
- **Combat:** the board as a battlefield, enemy on top and you below with the front rows facing each other. Playback steps through the engine's event log one turn at a time: the acting unit lunges, hits shake their target, floating numbers show damage, healing, shields and stat changes, and ability or trigger names pop up. Each unit's action gauge fills by SPD under its HP bar and turns gold when it acts, and the wait between turns grows with the ticks that passed, so speed differences are visible. Taunting units show 🎯, and sudden death announces itself. Controls: pause, 1x, 2x, skip, and replay. When it ends, a result panel shows lives lost, XP, income, each level-up with the stat points it earned, per-unit actions (attacks and ability casts), damage dealt/taken/healed, and the full combat log on request. Summoned units appear with a dashed border and are listed in the summary as summons.
- **Run summary:** result, every round's outcome with the enemy's classes, the final party with each unit's run totals, and an MVP.

**Interaction:** everything can be dragged *or* clicked.

| Drag | Onto | Does | Click alternative |
|---|---|---|---|
| Recruit card | Empty slot | Buys into that slot | Click the card (auto-places) |
| Item / training card | A unit | Buys it for that unit | Select the unit, click the card |
| Unit | Any slot | Moves (swaps if occupied) | Inspector → Move, then click a slot |
| Unit / item | Sell zone (appears while dragging) | Sells for the refund shown | Inspector → Sell |
| Equipped item (inspector) | Another unit | Moves the item | Inspector → Move, then click a unit |

Drag uses pointer events, so mouse, pen and touch all work. While dragging near the top or bottom of the screen the page scrolls. Valid drop targets highlight during a drag.

**Persistence (localStorage, all reads and writes guarded):** the current run (after every action), the best run, and the playback speed. A save from an incompatible version, or one naming a class that no longer exists, is ignored instead of crashing.

**Look:** dark theme, one colour and a placeholder glyph per class (advanced classes keep their base class's), drawn entirely with CSS. Emoji stand in for icons until the game-icons.net set and credits screen in M5. Animations respect `prefers-reduced-motion`. The layout works from phone width up.

## Tertiary classes (Milestone 6)

Two per advanced class, chosen at level 7 *(Brandon: two per advanced class, so level 7 is a real choice)*. The ability replaces the advanced class's; stats and the passive stack on top. Six of them summon (Packlord, Illusionist, Treelord, Pit Lord, Roboticist, Rotcaller), filling empty slots like the M5 summoners. Generated from the data:

| Base | Advanced | Tertiary | Tags | Ability | Passive | Granted ability (talent) |
|---|---|---|---|---|---|---|
| Warrior | Knight | **Paladin** | martial, guardian, divine | Divine Bulwark: Every 3rd turn: shield all allies for 4 + 70% DEF, heal them for 60% ATK, and taunt for 1 turn | Devotion Aura: Start of combat: all allies gain +1 DEF | Lay on Hands: Every 4th turn: heal the most wounded ally for 35% of your max HP |
| Warrior | Knight | **Vanguard** | martial, guardian | Hold the Line: Every 3rd turn: shield yourself for 6 + 150% DEF, taunt for 2 turns, and the enemy front row loses 1 ATK | Spiked Guard: When hurt, deal 40% DEF piercing damage to the attacker | Shield Slam: Every 4th turn: deal 100% ATK + 100% DEF to the nearest enemy, which loses 1 SPD |
| Warrior | Berserker | **Warlord** | martial | Rallying Whirlwind: Every 3rd turn: deal 100% ATK to every enemy, then all allies gain +1 ATK | Warcry: +10% lifesteal. Start of combat: all allies gain +1 SPD | Battle Standard: Every 5th turn: shield all allies for 100% ATK and they gain +1 DEF |
| Warrior | Berserker | **Bloodreaver** | martial, occult | Blood Storm: Every 3rd turn: deal 110% ATK to every enemy, then heal yourself for 150% ATK | Bloodbath: +20% lifesteal. On kill, gain +3 ATK | Crimson Rite: Every 4th turn: lose 10% of your max HP, then deal 220% ATK to the weakest enemy |
| Rogue | Assassin | **Nightblade** | shadow | Death Mark: Every 3rd turn: deal 260% ATK to the weakest enemy, then 100% ATK to whichever enemy is weakest after that | Shadow Step: On kill, your next ability comes 1 turn sooner and you gain +1 SPD | Fan of Knives: Every 4th turn: deal 70% ATK to every enemy |
| Rogue | Assassin | **Shadowdancer** | shadow, spirit | Shadow Dance: Every 3rd turn: strike the weakest back-row enemy 3 times for 120% ATK, then shield yourself for 100% ATK | Evasive: 25% when hurt: shield yourself for 6 | Blind: Every 4th turn: the strongest enemy loses 3 ATK and its ability comes 1 turn later |
| Rogue | Duelist | **Swordmaster** | martial | Blade Storm: Every 3rd turn: strike the nearest enemy 5 times for 70% ATK each | Perfect Parry: Reach: full damage from the back row. 45% when hurt: strike the attacker for 100% ATK | Duel: Every 4th turn: taunt for 1 turn and shield yourself for 100% DEF + 6 |
| Rogue | Duelist | **Swashbuckler** | martial, shadow | Dirty Tricks: Every 3rd turn: strike the nearest enemy 3 times for 90% ATK; it loses 2 SPD and 1 DEF | Bravado: Reach: full damage from the back row. On kill, gain +2 ATK and +1 SPD | Pistol Shot: Every 4th turn: deal 200% ATK piercing to the strongest enemy |
| Mage | Pyromancer | **Firelord** | arcane | Firestorm: Every 2nd turn: deal 160% ATK to each enemy in the front row and 60% ATK to every enemy | Wildfire: On kill, deal 100% ATK to every enemy | Pyroblast: Every 4th turn: deal 350% ATK to the strongest enemy (50% splash) |
| Mage | Pyromancer | **Phoenix** | arcane, divine | Phoenix Flame: Every 2nd turn: deal 120% ATK to each enemy in the front row and heal the most wounded ally for 120% ATK | Rebirth: When bloodied, heal 45% of max HP | Flame Ward: Every 4th turn: shield all allies for 100% ATK |
| Mage | Chronomancer | **Chronarch** | arcane | Time Dilation: Every 2nd turn: other allies’ abilities come 1 turn sooner (but not sooner than 2 turns away); deal 170% ATK to the nearest enemy | Quickening: Start of combat: all allies gain +1 SPD | Stasis: Every 4th turn: every enemy’s ability comes 1 turn later and the strongest enemy loses 2 SPD |
| Mage | Chronomancer | **Entropist** | arcane, occult | Entropy: Every 3rd turn: every enemy loses 1 SPD and takes 80% ATK | Rust: Start of combat: every enemy loses 1 DEF | Unravel: Every 4th turn: deal 250% ATK piercing to the nearest enemy |
| Cleric | Priest | **High Priest** | divine | Sacred Hymn: Every 3rd turn: heal all allies for 220% ATK and shield them for 80% ATK | Benediction: At the start of each of your turns, heal the most wounded ally for 100% ATK | Holy Fire: Every 4th turn: deal 200% ATK piercing to the strongest enemy |
| Cleric | Priest | **Oracle** | divine, arcane | Prophecy: Every 3rd turn: shield all allies for 90% ATK and heal them for 60% ATK | Forewarning: Start of combat: shield all allies for 100% ATK | Vision: Every 4th turn: other allies’ abilities come 1 turn sooner (but not sooner than 2 turns away) |
| Cleric | Inquisitor | **Templar** | divine, martial, guardian | Verdict: Every 3rd turn: deal 200% ATK piercing to the strongest enemy, heal yourself for 100% ATK and shield all allies for 50% ATK | Sworn Shield: 20% when hurt: taunt for 1 turn and shield yourself for 6 | Consecrate: Every 4th turn: deal 100% ATK to each enemy in the front row and heal all allies for 60% ATK |
| Cleric | Inquisitor | **Zealot** | divine, martial | Righteous Wrath: Every 3rd turn: deal 240% ATK piercing to the strongest enemy, heal yourself for 100% ATK and gain +2 ATK | Fanaticism: On kill, heal 25% of max HP and gain +1 SPD | Excommunicate: Every 4th turn: the strongest enemy loses 2 DEF and 1 ATK, then takes 120% ATK |
| Ranger | Sharpshooter | **Deadeye** | martial | Headshot: Every 3rd turn: deal 320% ATK piercing to the strongest enemy | Lethal Aim: On kill, your next ability comes 2 turns sooner and you gain +2 ATK | Volley: Every 4th turn: deal 80% ATK to every enemy |
| Ranger | Sharpshooter | **Trapper** | martial, wild | Snare Trap: Every 3rd turn: deal 120% ATK to each enemy in the front row; they lose 2 SPD | Caltrops: Start of combat: the enemy front row loses 2 SPD | Net Throw: Every 4th turn: the strongest enemy’s ability comes 2 turns later and it loses 2 SPD |
| Ranger | Beastmaster | **Packlord** | wild | Howl: Every 3rd turn (first on turn 1): summon a Wolf in an empty slot (60% of your max HP, 80% ATK). If the board is full, five strikes at random enemies for 70% ATK each instead | Pack Tactics: Start of combat: all allies gain +1 ATK and +1 SPD | Rabid Bite: Every 4th turn: deal 200% ATK to the nearest enemy; it loses 2 DEF |
| Ranger | Beastmaster | **Falconer** | wild, martial | Falcon Dive: Every 3rd turn: the falcon strikes the weakest back-row enemy 4 times for 80% ATK each | Keen Talons: 30% on attack: the falcon strikes a random enemy for 60% ATK | Screech: Every 4th turn: every enemy loses 1 ATK and its ability comes 1 turn later |
| Monk | Windwalker | **Stormfist** | martial, spirit | Thunder Palms: Every 3rd turn: strike random enemies 7 times for 55% ATK each, then gain +1 SPD | Static: 25% on attack: deal 50% ATK piercing to a random enemy | Chain Lightning: Every 4th turn: deal 90% ATK to every enemy |
| Monk | Windwalker | **Mistwalker** | spirit | Mist Step: Every 3rd turn: strike random enemies 4 times for 60% ATK each, then heal all allies for 50% ATK | Flowing Mist: 30% when hurt: shield yourself for 8 | Renewing Mist: Every 4th turn: heal all allies for 100% ATK and shield them for 50% ATK |
| Monk | Iron Fist | **Stoneguard** | martial, guardian, spirit | Mountain Stance: Every 3rd turn: shield yourself for 5 + 150% DEF, taunt for 2 turns, and heal yourself for 10% of max HP | Granite Skin: 30% when hurt: strike the attacker for 60% ATK | Earthshatter: Every 4th turn: deal 80% ATK + 80% DEF to each enemy in the front row; they lose 1 SPD |
| Monk | Iron Fist | **Grandmaster** | martial, spirit | Perfect Counter: Every 3rd turn: shield yourself for 3 + 100% DEF, taunt for 1 turn, and strike the nearest enemy 3 times for 70% ATK | Riposte Mastery: 45% when hurt: strike the attacker for 80% ATK | Quivering Palm: Every 5th turn: deal 300% ATK piercing to the strongest enemy |
| Bard | Skald | **Warchanter** | martial, spirit | Battle Hymn: Every 3rd turn: all allies gain +3 ATK and +1 SPD | Drums of War: Start of combat: all allies gain +2 ATK | Thunderous Shout: Every 4th turn: deal 80% ATK to every enemy; the enemy front row loses 1 ATK |
| Bard | Skald | **Lorekeeper** | spirit, divine | Saga of Heroes: Every 3rd turn: all allies gain +1 ATK and +1 DEF and heal for 80% ATK | Legend: When an ally dies, shield all allies for 150% ATK | Ballad of Ages: Every 4th turn: shield all allies for 120% ATK |
| Bard | Trickster | **Illusionist** | arcane, shadow | Mirror Images: Every 3rd turn (first on turn 1): summon a Mirror Image in an empty slot (50% of your max HP, 50% ATK). If the board is full, the strongest enemy loses 3 ATK instead | Misdirect: Start of combat: every enemy loses 1 SPD | Mind Spike: Every 4th turn: deal 180% ATK piercing to the strongest enemy |
| Bard | Trickster | **Harlequin** | arcane, shadow | Pandemonium: Every 4th turn: every enemy’s ability comes 1 turn later, every enemy loses 1 ATK and takes 80% ATK | Pratfall: 30% when hurt: the attacker loses 1 SPD | Punchline: Every 4th turn: deal 150% ATK to the weakest enemy (50% splash) |
| Druid | Shapeshifter | **Elder Bear** | wild, guardian, nature | Crushing Maul: Every 3rd turn: deal 200% ATK to the nearest enemy, taunt for 2 turns and heal yourself for 10% of max HP | Thick Hide: When bloodied, gain +4 DEF and heal 20% of max HP | Earthshaking Roar: Every 4th turn: every enemy loses 2 ATK |
| Druid | Shapeshifter | **Wildstalker** | wild, nature | Pounce: Every 3rd turn: deal 260% ATK to the weakest back-row enemy, then strike it twice more for 80% ATK | Predator: On kill, gain +2 ATK and +1 SPD | Shred: Every 4th turn: strike the nearest enemy 4 times for 60% ATK; it loses 2 DEF |
| Druid | Grove Warden | **Archdruid** | nature, divine | Tranquility: Every 3rd turn: heal all allies for 220% ATK and they gain +1 DEF | Lifebloom: At the start of each of your turns, all allies heal 4 | Starfall: Every 4th turn: deal 100% ATK to every enemy |
| Druid | Grove Warden | **Treelord** | nature, guardian | Awaken Ancient: Every 3rd turn (first on turn 1): summon an Ancient in an empty slot (110% of your max HP, 80% ATK). If the board is full, heal all allies for 150% ATK instead | Deep Roots: At the start of each of your turns, heal the most wounded ally for 5 | Entangling Roots: Every 4th turn: deal 80% ATK to each enemy in the front row; they lose 2 SPD |
| Warlock | Hexer | **Doombringer** | shadow, occult | Doom: Every 3rd turn: lose 8% of your max HP, then every enemy loses 1 DEF and takes 140% ATK | Dark Hunger: +15% lifesteal. On kill, heal 20% of max HP | Soul Rend: Every 4th turn: lose 10% of your max HP, then deal 300% ATK piercing to the strongest enemy |
| Warlock | Hexer | **Curseweaver** | shadow, occult, arcane | Curse of Agony: Every 3rd turn: every enemy loses 2 ATK and 1 DEF, then takes 70% ATK | Lingering Hex: When an ally dies, every enemy loses 1 ATK | Silence: Every 4th turn: every enemy’s ability comes 2 turns later |
| Warlock | Demonologist | **Pit Lord** | arcane, occult | Summon Fiend: Every 3rd turn (first on turn 1): summon a Fiend in an empty slot (80% of your max HP, 100% ATK). If the board is full, deal 250% ATK to the strongest enemy instead | Infernal Command: When an ally dies, gain +2 ATK and heal 15% of max HP | Rain of Fire: Every 4th turn: deal 90% ATK to every enemy |
| Warlock | Demonologist | **Soulbinder** | occult, shadow | Soul Lash: Every 3rd turn: deal 200% ATK to the strongest enemy and shield all allies for 60% ATK | Soul Feast: On kill or when an ally dies, gain +2 ATK | Drain Soul: Every 4th turn: deal 180% ATK to the weakest enemy and heal yourself for 180% ATK |
| Engineer | Machinist | **Artificer** | tech, arcane | Field Upgrade: Every 3rd turn: shield all allies for 120% ATK and heal the most wounded ally for 150% ATK | Overclock: Start of combat: all allies gain +1 ATK and +1 SPD | Arc Cannon: Every 4th turn: deal 160% ATK to the nearest enemy (50% splash) |
| Engineer | Machinist | **Roboticist** | tech | Build Golem: Every 3rd turn (first on turn 1): summon a Golem in an empty slot (100% of your max HP, 90% ATK). If the board is full, fire a rocket for 260% ATK at the nearest enemy (50% splash) instead | Auto-Repair: At the start of each of your turns, heal the most wounded ally for 6 | Tesla Coil: Every 4th turn: deal 50% ATK to random enemies 5 times |
| Engineer | Demolitionist | **Bombardier** | tech, martial | Carpet Bomb: Every 3rd turn: deal 55% ATK to every enemy, three times | Chain Reaction: On kill, deal 60% ATK to every enemy | Napalm: Every 4th turn: deal 130% ATK to each enemy in the front row; they lose 1 DEF |
| Engineer | Demolitionist | **Siege Master** | tech, martial | Artillery Shell: Every 3rd turn: deal 260% ATK piercing to the strongest enemy (60% splash) | Fortified Position: Start of combat: shield yourself for 150% ATK | Mortar: Every 4th turn: deal 120% ATK to the weakest back-row enemy (60% splash) |
| Necromancer | Lich | **Archlich** | arcane, shadow | Death Wave: Every 3rd turn: deal 120% ATK to every enemy and heal yourself for 150% ATK | Phylactery: When bloodied, shield yourself for 60% of max HP | Frost Nova: Every 4th turn: deal 80% ATK to every enemy; they lose 1 SPD |
| Necromancer | Lich | **Soul Reaper** | shadow | Reap: Every 3rd turn: deal 280% ATK to the weakest enemy and heal yourself for 100% ATK | Harvest: On kill, gain +2 ATK and your next ability comes 1 turn sooner | Banshee Wail: Every 4th turn: every enemy loses 2 ATK and takes 50% ATK |
| Necromancer | Plaguelord | **Blightlord** | shadow, occult | Pandemic: Every 3rd turn: every enemy loses 2 ATK and 2 DEF and takes 60% ATK | Plague Cloud: Start of combat: every enemy loses 1 ATK | Corpse Explosion: Every 4th turn: deal 150% ATK to the weakest enemy (100% splash) |
| Necromancer | Plaguelord | **Rotcaller** | shadow, occult | Raise Ghoul: Every 3rd turn (first on turn 1): summon a Ghoul in an empty slot (60% of your max HP, 90% ATK). If the board is full, every enemy loses 1 ATK and takes 70% ATK instead | Grave Pact: When an ally dies, gain +2 ATK and heal 10% of max HP | Death Coil: Every 4th turn: deal 180% ATK to the nearest enemy and heal the most wounded ally for 120% ATK |

## Open design questions (for Brandon)

None blocking. Things to look at when playtesting M6:

1. **Run length.** Is 15 wins right on a phone, or does it drag? The XP curve and enemy tables can follow any length.
2. **Pacing to level 7 and 10.** Units reach level 7 around round 12 without training. Is that late enough to feel earned and early enough to enjoy?
3. **Granted abilities.** Do second abilities read clearly in combat and on the unit card?
4. **Enemy preview.** Should the shop show the next enemy, fully or partly (say, its classes), before you fight? Still open from M4.

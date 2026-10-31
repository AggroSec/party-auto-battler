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
| Meta progression (difficulty ladder, achievements, unlocks, starting perks, daily run, signature items) | ✅ Milestone 7 |
| Playtest follow-ups: shop locks, stacking statuses, Runeblade, Dark Knight | ✅ After M7 |
| Playtest follow-ups: favored class, no drag-to-sell, no repeated talents | ✅ After M7 |
| Juice (icons, sound, animations, credits) | ✅ Milestone 8 |
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
| Runeblade 🔒 | Striker | Melee | 36/6/2/10 | nearest | **Runestrike** (3): 110% ATK to the nearest enemy and carve 2 Runes | **Runic Detonation:** basic attacks carve 1 Rune; 5 Runes detonate for 250% ATK |
| Dark Knight 🔒 | Frontline | Melee | 40/6/2/8 | nearest | **Blood Price** (3): pay 8% max HP, 130% ATK + 20% missing HP to the nearest enemy, heal 50% ATK | **Dark Resolve:** when bloodied, +3 DEF and +2 ATK |
| Cultist 🔒 | Support | Ranged | 30/4/1/9 | nearest | **Siphon** (2): 100% ATK to the nearest enemy and 2 Blight, heal the most wounded ally 100% ATK | **Blight:** basic attacks give 1 Blight; every Blight tick heals the Cultist's most wounded ally for half the damage |

🔒 = unlockable via meta progression (Milestone 7). Monk, Bard, Druid, Warlock and Engineer were added in M5 at Brandon's request; Runeblade and Dark Knight after M7, and the Cultist after M8, to his design (see below).

**Tags** (for synergies): Warrior martial + guardian, Rogue martial + shadow, Mage arcane, Cleric divine, Ranger martial + wild, Monk martial + spirit, Bard arcane + spirit, Druid wild + nature, Warlock shadow + occult, Engineer tech, Necromancer arcane + shadow, Runeblade arcane + martial, Dark Knight martial + guardian + shadow. Advanced classes replace their base tags.

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
| Runeblade | 3 | 4 | 1 | 2 |
| Dark Knight | 4 | 3 | 2 | 1 |

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
| Holy Trinity *(M7)* | a guardian, a support and a striker or caster (different units) | Every ally +3 HP |
| Champions of Light *(M7, unlock)* | 3 / 4 Light (divine) | Light units +6 HP / every ally +6 HP |
| Legion of Night *(M7, unlock)* | 3 / 4 Dark (shadow or occult) | Dark units +1 ATK / +2 ATK and +1 ATK per kill |
| Twilight Pact *(M7, unlock)* | 2 Light + 2 Dark | Every ally heals 2 at the start of its turns |
| Life and Death *(M7)* | Necromancer + Cleric | On a kill or an ally's death, they heal the most wounded ally for 60% ATK |
| Mad Science *(M7)* | Engineer + Mage | Tech and arcane units +25% AP |
| Wild Hunt *(M7)* | Ranger + Druid | Wild and nature units +2 ATK, +1 SPD |
| Battle Hymn *(M7)* | Bard + Warrior | Each Bard cast: front row +1 ATK (twice per fight) |

M7 synergies count units by **role** (the base class's frontline / striker / caster / support), by **class** (base, advanced or tertiary), or by **Light and Dark**: Light means divine and Dark means shadow or occult, so advancing can move a unit between sides (a Knight is Light, an Assassin Dark).

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
- *(M7, 2026-10-22)* Lock some existing content behind achievements, with an "unlock everything" toggle until 1.0 so testing is never gated. 10 stacking ladder tiers. Perks: offered 3 at a time; Perkception unlocks let you keep 2 or 3. Six new items plus a signature item per tertiary class (shown only when that class is in the party, pricier, attainable). Synergies that don't need duplicate classes: role combos and good-vs-evil themes. Brandon will pick further classes after the core project ships.

## UI (Milestone 4)

**Screens:** Title → Shop → Combat → (result) → Shop … → Run summary. The combat lab (pick two line-ups, read the event log) is linked from the title screen in dev builds (`npm run dev`) only, from 1.0.

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

## Meta progression (Milestone 7)

Progress lives in a **profile** saved separately from runs (its own storage version, so run-format changes never wipe it). The title screen has **New run**, **Daily run**, **Collection** and, in dev builds only, an **Unlock everything** toggle *(Brandon: a testing toggle until 1.0; from 1.0 players earn their unlocks, and a saved profile with it on is ignored in release builds)*.

**Starting content:** Warrior, Rogue, Mage, Cleric and Ranger; 17 items (the plain and effect items plus those five classes' items); every synergy except Champions of Light, Legion of Night and Twilight Pact; and three perks (Deep Pockets, Armory, Bargain Hunter). Achievements unlock the rest; a class unlock brings its class item. **Enemies use only unlocked classes and items**; bosses appear regardless.

**Run setup:** before each run you pick a ladder tier (up to your highest unlocked) and your perks. A run stores its setup, so later unlocks never change a run in progress.

### Difficulty ladder

Tier 0 is the base game. Winning a run on your highest tier unlocks the next. Each tier adds its modifier to all earlier ones (`src/data/meta/ladder.ts`):

| Tier | Adds |
|---:|---|
| 1 | Rerolls cost 1 more gold |
| 2 | Start with 1 less gold |
| 3 | Interest capped 1 gold lower |
| 4 | One less life |
| 5 | Enemies +5% HP and ATK |
| 6 | From round 8, every enemy carries one more item |
| 7 | From round 8, one enemy per fight is an **Elite** (+20% HP and ATK, "Elite" in its name) |
| 8 | Rounds 5, 10 and 15 are **boss** fights |
| 9 | Elites from round 5 |
| 10 | Enemies +5% more HP and ATK; bosses cast a second ability |

**Bosses** replace one enemy on their round, a level ahead and with ×1.6 HP and ×1.15 ATK (Colossus ×1.9 HP):

| Boss | Class | From round | Passive | Second ability (tier 10) |
|---|---|---:|---|---|
| Grukk the Ironjaw | Warrior | 5 | War Cry: Start of combat: all allies gain +2 ATK, and Grukk shields himself for 200% ATK. | Earthshatter: Every 4th turn: deal 90% ATK to every enemy. |
| Vesper, the Night Queen | Rogue | 5 | Bloodthirst: +15% lifesteal. On kill, gain +3 ATK and +2 SPD. | Fan of Knives: Every 4th turn: deal 70% ATK to every enemy. |
| Archmage Ozric | Mage | 5 | Arcane Ward: Start of combat: shield all allies for 120% ATK. | Arcane Barrage: Every 4th turn: deal 60% ATK to random enemies 5 times. |
| The Hollow King | Necromancer | 10 | Deathless Court: Revives once at 50% HP. When an ally dies, all allies heal for 100% ATK. | Soul Rend: Every 4th turn: deal 220% ATK to the weakest enemy and heal yourself for 100% ATK. |
| Mother Thornroot | Druid | 10 | Overgrowth: +3 DEF. At the start of each of her turns, all allies heal 4. | Strangling Roots: Every 4th turn: deal 120% ATK to each enemy in the front row; they lose 2 SPD. |
| The Iron Colossus | Engineer | 15 | Reinforced: +4 DEF. When hurt, 25% chance to shield itself for 10. | Overload: Every 4th turn: deal 60% ATK to every enemy, twice. |

### Starting perks

You're offered your kept count + 2 perks from your unlocked pool and keep 1 (2 with Perkception, 3 with Perkception II). The offer comes from the run's seed.

| Perk | Effect |
|---|---|
| Deep Pockets | +3 starting gold |
| Armory | Round 1's shop has an extra free item (it stays through rerolls) |
| Bargain Hunter | First reroll each round is free |
| Veteran | First recruit starts at level 2 |
| Second Wind | First lost fight costs no life |
| Tutor | Training costs 1 less |
| Investor | Interest cap +1 |
| Mentor | Level-ups offer 4 talents |
| Recruiter | Recruits cost 2 for the first 3 rounds |
| Extra Life | +1 life |
| Quartermaster | +1 item/training shop slot |
| Drill Sergeant | +1 stat point every level-up |

### Achievements

| Achievement | How | Unlocks |
|---|---|---|
| Hero of the Realm | Win a run. | Necromancer, Skull Totem |
| On a Roll | Win 5 fights in a row. | Monk, Prayer Beads |
| Full Roster | Win a fight with 5 different classes. | Bard, Enchanted Lute |
| Lifeline | Heal 300 HP in one fight. | Druid, Oak Heart |
| By a Thread | Win a run with 1 life left. | Warlock, Cursed Tome |
| Seasoned | Reach round 10. | Engineer, Gearbox |
| Wipeout | Kill 3 enemies at once. | Executioner's Axe |
| Untouchable | Win a fight in round 8 or later without losing a unit. | Mirror Shard |
| Nest Egg | Go into a fight with 15 gold unspent. | Gambler's Coin |
| Against the Odds | Win a fight after 3 of your units fell. | Phoenix Feather |
| Army of One | Summon 3 units in one fight. | Soulstone |
| Flawless | Win a run without losing a fight. | War Banner |
| Blitz | Win a fight in 15 ticks or less. | Quicksilver Rapier, Winged Sandals |
| Armed to the Teeth | Go into a fight with 5 units holding 2 items each. | Vampiric Fang |
| Collector | Reach 10 different tertiary classes. | Hourglass |
| Champions | Win a fight with 3 Light (divine) units. | Champions of Light |
| Darkness Rising | Win a fight with 3 Dark (shadow or occult) units. | Legion of Night |
| In Harmony | Have 4 synergies active at once. | Twilight Pact |
| First Steps | Reach round 5. | Recruiter |
| Try, Try Again | Lose a run. | Extra Life |
| Ascended | Reach level 7 with a unit. | Veteran |
| Pinnacle | Reach level 10 with a unit. | Drill Sergeant |
| Regular | Win 3 runs. | Mentor |
| Old Soldier | Win 100 fights in total. | Quartermaster |
| Climber | Win a run on tier 1 or higher. | Second Wind |
| Still Climbing | Win a run on tier 2 or higher. | Tutor |
| Perkception | Win a run on tier 3 or higher. | +1 perk kept |
| High Climber | Win a run on tier 5 or higher. | Investor |
| Perkception II | Win a run on tier 7 or higher. | +1 perk kept |
| Legend | Win a run on tier 10. | — |

### Daily run

The seed comes from the date (`daily-YYYY-MM-DD`). The tier rotates through 2–6 and the perk offer (3, keep 1) is fixed, with everything unlocked so the run is the same for everyone. You get one attempt: it counts once started, and the title screen shows the result. Dailies don't advance the ladder.

### Items added in M7

| Item | Cost | Effect | Unlock |
|---|---:|---|---|
| Phoenix Feather | 6g | The first time you would fall, survive at 30% HP | Against the Odds |
| War Banner | 5g | Start of combat: you and your row +2 ATK | Flawless |
| Gambler's Coin | 4g | +1 gold after every won fight | Nest Egg |
| Executioner's Axe | 5g | +2 ATK; +50% damage to enemies below half HP | Wipeout |
| Mirror Shard | 5g | When hurt, 60% ATK back at the attacker (4 times per fight) | Untouchable |
| Soulstone | 4g | When an ally falls: next ability 1 turn sooner, shield 100% ATK | Army of One |

### Signature items

One per tertiary class *(Brandon: unique, pricier, attainable, shown only when the class is in the party)*. Only that class can equip it, a unit holds one at most, and it never enters the random item pool. While a tertiary unit lacks its item, each item/training shop slot has a 30% chance to offer it. Reaching the class is the unlock; the Collection lists each one once discovered.

| Tertiary class | Signature item | Cost | Effect |
|---|---|---:|---|
| Paladin | Dawnbringer | 7g | +10 HP. At the start of each of your turns, all allies heal 3. |
| Vanguard | Aegis of the Unbroken | 7g | +3 DEF. When hurt, the attacker loses 1 ATK (up to 6 times per fight). |
| Warlord | Horde Banner | 7g | On kill, all allies gain +1 ATK and +1 SPD. |
| Bloodreaver | Crimson Chalice | 7g | +15% lifesteal. When bloodied, deal 100% ATK to every enemy. |
| Nightblade | Shadowfang | 7g | Deal 50% more damage to enemies below half HP. On kill, shield yourself for 100% ATK. |
| Shadowdancer | Veil of Night | 7g | +2 SPD. On kill, your next ability comes 2 turns sooner. |
| Swordmaster | Kensei Blade | 8g | +2 ATK. 40% on attack: strike the target again for 100% ATK. |
| Swashbuckler | Lucky Doubloon | 7g | +2 ATK. +1 gold after every won fight. On kill, the enemy front row loses 1 SPD. |
| Firelord | Ember Crown | 8g | Wildfire spreads: when an ally gets a kill, deal 50% ATK to every enemy. |
| Phoenix | Ashen Heart | 8g | The first time you would fall, rise again at 40% HP and heal all allies for 100% ATK. |
| Chronarch | Paradox Engine | 8g | Start of combat: every ally's first ability comes 1 turn sooner. |
| Entropist | Hourglass of Ruin | 7g | +20% ability power. After casting, every enemy loses 1 ATK. |
| High Priest | Chalice of Mercy | 7g | At the start of each of your turns, shield the most wounded ally for 100% ATK. |
| Oracle | Eye of Fate | 7g | Start of combat: all allies gain +1 SPD and every enemy's first ability comes 1 turn later. |
| Templar | Crusader's Oath | 7g | +8 HP. After casting, taunt for 1 turn and gain +1 DEF (up to 5 times per fight). |
| Zealot | Brand of Zeal | 7g | On kill, gain +2 ATK and your next ability comes 1 turn sooner. |
| Deadeye | Hawkeye Scope | 8g | +1 ATK. Deal 60% more damage to enemies below half HP. |
| Trapper | Spiked Snares | 7g | Start of combat: the enemy front row loses 2 DEF. After casting, the enemy front row takes 40% ATK piercing. |
| Packlord | Alpha's Fang | 7g | +30% ability power (stronger wolves). When an ally falls, your next ability comes 1 turn sooner. |
| Falconer | Hooded Falcon | 7g | 40% on attack: the falcon strikes the weakest back-row enemy for 100% ATK. |
| Stormfist | Thunder Wraps | 7g | After casting, deal 60% ATK to every enemy. |
| Mistwalker | Jade Lotus | 7g | 30% when hurt: heal all allies for 50% ATK. |
| Stoneguard | Mountain Heart | 7g | +16 HP. When bloodied, taunt for 2 turns and shield yourself for 50% of max HP. |
| Grandmaster | Grandmaster's Sash | 8g | +1 DEF, +1 SPD. 30% when hurt: strike the attacker for 100% ATK piercing. |
| Warchanter | Warhorn | 7g | Start of combat: all allies gain +1 ATK and +1 SPD. When an ally dies, all allies gain +1 SPD. |
| Lorekeeper | Tome of Sagas | 7g | Start of combat: all allies gain +1 DEF. When an ally dies, heal all allies for 150% ATK. |
| Illusionist | Hall of Mirrors | 8g | When bloodied, summon a Mirror Image in an empty slot. When an ally falls, summon another (once per fight). |
| Harlequin | Jester's Bells | 7g | +20% ability power. On kill, every enemy's ability comes 1 turn later. |
| Elder Bear | Ursine Totem | 7g | +3 DEF. 30% when hurt: heal 6% of your max HP. |
| Wildstalker | Moonfang Claws | 7g | +2 ATK, +2 SPD. On kill, deal 150% ATK to the weakest enemy. |
| Archdruid | Seed of Renewal | 8g | +20% ability power. Start of combat: shield all allies for 150% ATK. When an ally dies, heal all allies for 100% ATK. |
| Treelord | Heartwood Staff | 7g | +20% ability power. When an ally falls, summon an Ancient in an empty slot (up to 2 times per fight). |
| Doombringer | Blood Moon Idol | 7g | +15% lifesteal. After casting, heal 10% of your max HP. |
| Curseweaver | Black Grimoire | 7g | +20% ability power. Start of combat: every enemy loses 1 ATK and 1 DEF. |
| Pit Lord | Hellforge Collar | 8g | When an ally falls, summon a Fiend in an empty slot (up to 2 times per fight). |
| Soulbinder | Soul Gem | 7g | On kill or when an ally dies, shield all allies for 60% ATK. |
| Artificer | Master Toolkit | 7g | After casting, all allies gain +1 ATK (up to 4 times per fight). |
| Roboticist | Master Schematic | 8g | After casting, repair the party: heal all allies for 60% ATK and shield them for 40% ATK. |
| Bombardier | Payload Detonator | 7g | Start of combat: deal 60% ATK to every enemy. |
| Siege Master | Siege Plans | 7g | After casting, the strongest enemy loses 2 DEF and 1 SPD. |
| Archlich | Phylactery Crystal | 8g | The first time you would fall, rise again at 30% HP and deal 150% ATK to every enemy. |
| Soul Reaper | Reaper's Scythe | 7g | Deal 50% more damage to enemies below half HP. On kill, heal 15% of your max HP. |
| Blightlord | Plague Censer | 7g | At the start of each of your turns, every enemy takes 20% ATK. |
| Rotcaller | Grave Banner | 7g | +20% ability power. When an ally falls, it bursts: deal 70% ATK to every enemy. |

## After Milestone 7: Brandon's playtest feedback

### Fixes
- **Daily runs don't count toward progress.** No achievements, discoveries or lifetime stats; the daily keeps only its own record. (Brandon earned the tier achievements up to 4 from one daily.)
- **Reset progress** (Collection screen, behind a confirm) clears achievements, ladder tiers and discoveries, keeping the unlock-all setting and today's daily attempt.
- **Lifeline** (unlocks Druid) counts shields: heal or shield 400 HP in one fight. Healing alone was nearly impossible with the starter classes, whose best healer mostly shields.
- **By a Thread** (unlocks Warlock) is unchanged while Brandon tries it; the fallback is "win a fight at 1 life".

### Shop locks
- Every shop offer (recruit, item or training) has a 🔒 button. Locking costs **1 gold**, paid once; a locked offer survives rerolls and the next round until you buy it or unlock it. Unlocking is free and refunds nothing.
- One lock at a time. Perks: **Haggler** (locks are free; from **Penny Pincher**: go into 3 fights in a row with 10+ gold) and **Layaway** (+1 lock; from **Window Shopper**: buy 5 locked offers in one run).

### Favored class (2026-10-27)
- The run setup screen has an optional **Favored class** picker (any unlocked class; dailies too). In rounds 1 and 2, every shop, rerolls included, offers at least one recruit of that class. If none rolls naturally, the first unlocked recruit slot becomes it, at the normal price. From round 3 the shop is normal.
- Free for everyone, not a perk, so newly unlocked classes can be tried straight away. Brandon may make the forced offer cost more after testing.
- **A second favored class** (2026-10-31) comes from the **Chosen One** achievement: win a run on tier 5 or higher with a unit of your favored class at level 10. Brandon: losses came from missing a tank or a healer, and one favored class made him pick between them. With two, each gets its own guaranteed offer. Dailies keep one.

### Stacking statuses
A status is a named stack on a unit: it can change a stat per stack, deal damage each of the afflicted unit's turns (ignoring DEF, credited to whoever applied it), last a number of turns, burst at a threshold (firing its applier's `onBurst` effects), or keep the unit above 0 HP. Stack counts show on unit cards during playback.

| Status | Rules | From |
|---|---|---|
| Rune | Bursts at 5 (extra stacks carry over) | Runeblade line |
| Searing | 20% ATK per stack per turn, up to 5, 3 turns | Searing Runes |
| Corruption | 25% ATK per stack per turn, up to 10, 3 turns | Voidblade |
| Dread | −1 ATK per stack, up to 2, rest of the fight | Dark Knight line |
| Hellfire | 20% ATK per stack per turn, up to 5, 3 turns | Hellknight |
| Deathless Fury | Can't drop below 1 HP, +4 ATK, +4 SPD, 2 turns | Berserker |

Amounts can also scale with the source's **missing HP** (Dark Knight).

### New classes (Brandon's design)
Both are unlockable, like every new class from now on: **Spellsword** (win a fight with a Warrior and a Mage, both level 5+) unlocks the Runeblade; **Last One Standing** (win a fight with only one unit left) unlocks the Dark Knight and the Rivals synergy. Enemy versions: Hexblade Sellsword (from round 3) and Fallen Knight (from round 2).

#### Runeblade

Arcane warrior: every hit carves a Rune, and 5 Runes detonate. Tags: arcane, martial. 36/6/2/10, melee.

- **Runestrike:** Every 3rd turn: deal 110% ATK to the nearest enemy and carve 2 Runes into it.
- **Runic Detonation:** Basic attacks carve 1 Rune. At 5 Runes they detonate for 250% ATK.
- Talents: **Searing Runes** (Basic attacks also sear the target: 20% ATK damage per turn, stacking up to 5, for 3 turns.); **Deep Carving** (After casting, carve 1 more Rune into the nearest enemy.); **Runic Ward** (When your Runes detonate, shield yourself for 100% ATK.); **Volatile Runes** (Detonations also deal 60% ATK to the target and its row neighbours.)

**Spellblade** (arcane, martial): Elemental Runes: every detonation spills onto the target’s neighbours.
- **Elemental Edge:** Every 3rd turn: carve 2 Runes into each enemy in the front row, then deal 130% ATK to the nearest enemy.
- **Elemental Runes:** Detonations also deal 80% ATK to the target and its row neighbours.
- Talents: **Arc Runes** (When your Runes detonate, your next ability comes 1 turn sooner.); **Frost Runes** (Detonations chill the enemy front row: each loses 2 SPD.); **Runic Focus** (+30% ability power.); **Quick Carving** (Basic attacks have a 50% chance to carve an extra Rune.)

- **Stormblade** (arcane, martial): Lightning from the back row: Runes land everywhere and detonations arc between enemies.
  - **Thunder Rune:** Every 3rd turn: carve 1 Rune into every enemy, then strike 3 random enemies for 70% ATK.
  - **Arc Surge:** Fights at full strength from the back row; basic attacks hit random enemies. Detonations arc to 2 random enemies for 80% ATK.
  - Talents: **Static Charge** (+3 SPD, +2 ATK.); **Storm Surge** (Each detonation grants +1 SPD.); **Conductive Runes** (Basic attacks also carve a Rune into another random enemy.); **Thunderclap** (New ability. Every 4th turn: deal 60% ATK to every enemy and carve 1 Rune into each.)
  - Signature item: **Tempest Edge** (7g): +2 SPD. Start of combat: carve 2 Runes into every enemy.
- **Earthwarden** (arcane, martial, guardian): Rune knight of stone: holds the front line, and every detonation hardens it.
  - **Quake Rune:** Every 3rd turn: carve 2 Runes into each enemy in the front row, shield yourself for 4 + 80% DEF, and taunt for 1 turn.
  - **Living Stone:** When your Runes detonate, shield yourself for 10% of max HP and the target loses 1 DEF.
  - Talents: **Stone Skin** (+3 DEF, +10 HP.); **Aftershock** (Detonations also deal 100% DEF to each enemy in the front row.); **Rooted** (Start of combat: taunt for 2 turns and shield yourself for 20% of max HP.); **Tremor** (New ability. Every 4th turn: deal 80% ATK to each enemy in the front row; they lose 1 SPD.)
  - Signature item: **Heart of the Mountain** (7g): +20 HP. When your Runes detonate, shield all allies for 5.

**Duskblade** (arcane, divine, shadow): Twilight Runes: light and shadow at once. Detonations mend the party.
- **Twilight Edge:** Every 3rd turn: deal 120% ATK to the nearest enemy and carve 2 Runes into it, then heal the most wounded ally for 40% ATK.
- **Balance:** When your Runes detonate, heal the most wounded ally for 60% ATK.
- Talents: **Dusk Ward** (When your Runes detonate, shield the most wounded ally for 100% ATK.); **Shadow Edge** (+15% lifesteal.); **Waning Light** (When an ally falls, carve 1 Rune into every enemy.); **Twin Runes** (After casting, carve 1 Rune into a random enemy.)

- **Dawnblade** (arcane, divine): Rune-priest of the dawn: fights from the back row, and its detonations heal everyone.
  - **Sunrise Rune:** Every 3rd turn: carve 2 Runes into the nearest enemy, heal all allies for 50% ATK, and shield the most wounded ally for 100% ATK.
  - **First Light:** Fights at full strength from the back row. When your Runes detonate, heal all allies for 50% ATK.
  - Talents: **Dawnward** (+30% ability power.); **Sunfire** (Detonations also deal 50% ATK to every enemy.); **Beacon** (Start of combat: shield all allies for 100% ATK.); **Solar Flare** (New ability. Every 4th turn: heal the most wounded ally for 150% ATK and carve 1 Rune into every enemy.)
  - Signature item: **Sunforged Sigil** (7g): Start of combat: shield all allies for 100% ATK. Detonations heal all allies for another 30% ATK.
- **Voidblade** (arcane, shadow): Shadow Runes rot into Corruption: damage over time, lifesteal and executions.
  - **Void Rend:** Every 3rd turn: deal 120% ATK to the nearest enemy, give it 3 Corruption, and carve 1 Rune into it.
  - **Hunger of the Void:** +20% lifesteal and +30% damage to enemies below half HP. Detonations give the target 3 Corruption (25% ATK damage per stack each turn, for 3 turns).
  - Talents: **Creeping Void** (Basic attacks also give 1 Corruption.); **Devour** (On kill, heal 30% of max HP.); **Abyssal Edge** (+2 ATK and +30% damage to enemies below half HP.); **Void Bloom** (New ability. Every 4th turn: give every enemy 2 Corruption.)
  - Signature item: **Abyssal Fang** (7g): +10% lifesteal. Basic attacks give 1 Corruption.

#### Dark Knight

Evil tank: pays HP for power, drinks it back, and grows deadlier as it bleeds. Tags: martial, guardian, shadow. 40/6/2/8, melee.

- **Blood Price:** Every 3rd turn: pay 8% of max HP, then deal 130% ATK + 20% of your missing HP to the nearest enemy and heal for 50% ATK.
- **Dark Resolve:** When bloodied, gain +3 DEF and +2 ATK.
- Talents: **Dread Aura** (When hurt, 30% chance the attacker gains 1 Dread (−1 ATK, up to 2).); **Blood Oath** (+15% lifesteal.); **Unholy Vigor** (Start of combat: pay 10% of max HP and gain +3 ATK.); **Spite** (Basic attacks deal an extra 10% of your missing HP.)

**Blackguard** (martial, shadow): Blood knight: bleeds itself to cut down the front row, and drinks it all back.
- **Crimson Cleave:** Every 3rd turn: pay 8% of max HP, deal 100% ATK + 20% of your missing HP to each enemy in the front row, and heal for 60% ATK.
- **Sanguine:** +15% lifesteal.
- Talents: **Blood Frenzy** (When bloodied, gain +4 ATK and +2 SPD.); **Open Veins** (Basic attacks deal an extra 15% of your missing HP.); **Crimson Thirst** (+15% lifesteal.); **Bleed for It** (Ability cooldown −1.)

- **Crimson Lord** (martial, shadow): Lord of blood: huge lifesteal, and the lower it falls the harder it hits.
  - **Sanguine Tide:** Every 3rd turn: pay 10% of max HP, deal 90% ATK + 25% of your missing HP to every enemy, and heal for 100% ATK.
  - **Blood Sovereign:** +10% lifesteal. When bloodied, gain +4 ATK.
  - Talents: **Exsanguinate** (On kill, heal 25% of max HP.); **Crimson Fury** (Basic attacks deal an extra 20% of your missing HP.); **Bloodbound** (+3 ATK, +10 HP.); **Blood Nova** (New ability. Every 4th turn: pay 10% of max HP and deal 50% of your missing HP to every enemy.)
  - Signature item: **Sanguine Crown** (7g): +15% lifesteal. When an enemy falls, heal 10% of max HP.
- **Hellknight** (martial, shadow, occult): Sworn to the pit: wreathed in Hellfire that burns everyone who strikes it.
  - **Hellfire Slash:** Every 3rd turn: deal 130% ATK to the nearest enemy, give it 3 Hellfire, and taunt for 1 turn.
  - **Infernal Aura:** When hurt, 50% chance the attacker gains 1 Hellfire (20% ATK damage per stack each turn, up to 5, for 3 turns).
  - Talents: **Pit-Forged** (+3 DEF, +6 HP.); **Pact of Flame** (Start of combat: every enemy gains 2 Hellfire.); **Burning Blood** (When bloodied, every enemy gains 3 Hellfire.); **Infernal Eruption** (New ability. Every 4th turn: deal 60% ATK to every enemy and give each 1 Hellfire.)
  - Signature item: **Brand of the Pit** (7g): +2 DEF. Start of combat: every enemy gains 2 Hellfire.

**Dreadknight** (martial, guardian, shadow): Terror on two legs: draws every blow and leaves attackers too frightened to hit hard.
- **Terrorize:** Every 3rd turn: taunt for 1 turn, give each enemy in the front row 1 Dread, and shield yourself for 4 + 80% DEF.
- **Aura of Dread:** When hurt, 40% chance the attacker gains 1 Dread (−1 ATK, up to 2).
- Talents: **Intimidation** (Start of combat: every enemy gains 1 Dread.); **Iron Will** (+2 DEF, +8 HP.); **Menace** (Start of combat: taunt for 2 turns.); **Grim Retort** (When hurt, deal 20% DEF + 5% of your missing HP to the attacker.)

- **Tyrant** (martial, guardian, shadow): Rules by fear: the whole enemy party fights at a fraction of its strength.
  - **Reign of Terror:** Every 3rd turn: every enemy gains 1 Dread; taunt for 2 turns and shield yourself for 6 + 100% DEF.
  - **Dominion:** Start of combat: every enemy gains 1 Dread.
  - Talents: **Tyranny** (+4 DEF, −1 SPD.); **Subjugate** (Basic attacks have a 50% chance to give the target 1 Dread.); **Oppression** (Start of combat: each enemy in the front row loses 2 SPD.); **Dread Lash** (New ability. Every 4th turn: deal 100% ATK + 100% DEF to the nearest enemy and give it 2 Dread.)
  - Signature item: **Crown of Dread** (7g): +3 DEF. Basic attacks give the target 1 Dread.
- **Revenant** (martial, guardian, shadow): Refuses to stay dead: rises once more and fights on, still hitting harder the lower it is.
  - **Grave Strike:** Every 3rd turn: pay 5% of max HP, deal 130% ATK + 30% of your missing HP to the nearest enemy, and heal for 60% ATK.
  - **Undeath:** The first time you would fall, rise at 30% HP; every enemy gains 1 Dread.
  - Talents: **Second Grave** (Rise one more time.); **Wrath of the Grave** (After rising, gain +4 ATK and taunt for 1 turn.); **Cold Iron** (+3 DEF, +10 HP.); **Grave Chill** (New ability. Every 4th turn: every enemy loses 1 SPD and gains 1 Dread.)
  - Signature item: **Gravebound Plate** (7g): +10 HP. Rise one more time, at 30% HP.

#### Cultist (after M8)

Brandon's evil healer: it heals by stealing. Unlocked by **Unholy Communion** (win a fight with a Cleric and a Warlock, both level 5+), which also unlocks the **Sacred and Profane** synergy (Cleric + Cultist: both +20% ability power). Enemy version: Plague Cultist (from round 3).

Evil healer: steals life from the enemy, and its Blight keeps the party standing. Tags: occult, shadow. 30/4/1/9, ranged.

- **Siphon:** Every 2nd turn: deal 100% ATK to the nearest enemy and give it 2 Blight, then heal the most wounded ally for 100% ATK.
- **Blight:** Basic attacks give 1 Blight: 20% ATK damage per stack each turn (up to 5, for 3 turns), and every tick heals your most wounded ally for half the damage dealt.
- Talents: **Vile Harvest** (When any enemy falls, heal the most wounded ally for 100% ATK.); **Black Tithe** (Start of combat: pay 10% of max HP and shield all allies for 80% ATK.); **Leeching Hex** (+15% lifesteal.); **Creeping Blight** (Basic attacks give 1 more Blight.)

**Hemomancer** (occult, shadow): Blood mage: pays in its own blood to pour life into the party.
- **Transfusion:** Every 2nd turn: pay 6% of max HP, deal 80% ATK to the nearest enemy, and heal the most wounded ally for 200% ATK.
- **Blood Bond:** +15% lifesteal.
- Talents: **Sanguine Flow** (+30% ability power.); **Bloodletting** (When bloodied, heal all allies for 100% ATK.); **Iron Blood** (+2 DEF, +10 HP.); **Crimson Ward** (After casting, shield the most wounded ally for 60% ATK.)

- **Sanguine Bishop** (occult, shadow): High priest of blood: huge party heals, paid for in its own veins.
  - **Blood Sacrament:** Every 3rd turn: pay 10% of max HP, heal all allies for 120% ATK, and shield the most wounded ally for 100% ATK.
  - **Consecrated Blood:** +15% lifesteal. When bloodied, heal all allies for 100% ATK.
  - Talents: **Holy Wounds** (+30% ability power.); **Last Rites** (When an ally falls, heal all other allies for 150% ATK.); **Red Vestments** (+3 DEF, +10 HP.); **Communion of Blood** (New ability. Every 4th turn: pay 5% of max HP and shield all allies for 80% ATK.)
  - Signature item: **Reliquary of Blood** (7g): +2 ATK. Start of combat: shield all allies for 60% ATK.
- **Vampire Lord** (occult, shadow): Feeds on the whole enemy party, and every kill your party lands feeds them too.
  - **Crimson Feast:** Every 3rd turn: deal 80% ATK to every enemy and heal all allies for 40% ATK.
  - **Thirst of Ages:** +25% lifesteal. When an ally lands a kill, heal all allies for 30% ATK.
  - Talents: **Nightstalker** (+3 SPD, +2 ATK.); **Sire’s Bite** (Basic attacks heal the most wounded ally for 30% ATK.); **Eternal Night** (The first time you would fall, rise at 30% HP.); **Bat Swarm** (New ability. Every 4th turn: strike 3 random enemies for 50% ATK, then heal the most wounded ally for 100% ATK.)
  - Signature item: **Vampire’s Signet** (7g): +15% lifesteal, +2 SPD.

**Plague Doctor** (occult, shadow): Spreads Blight across the enemy front, and every tick of it keeps the party standing.
- **Miasma:** Every 2nd turn: each enemy in the front row gains 1 Blight; heal the most wounded ally for 100% ATK.
- **Contagion:** Basic attacks have a 50% chance to give 1 more Blight.
- Talents: **Virulence** (Start of combat: every enemy gains 1 Blight.); **Plague Mask** (+2 DEF, +8 HP.); **Fever Dream** (When hurt, 30% chance the attacker gains 1 Blight.); **Epidemic** (After casting, a random enemy gains 2 Blight.)

- **Pestilent Saint** (occult, shadow): Blight on every enemy at once: the whole enemy party bleeds life into yours.
  - **Great Plague:** Every 3rd turn: every enemy gains 1 Blight; heal all allies for 20% ATK.
  - **Sainted Rot:** Start of combat: every enemy gains 1 Blight.
  - Talents: **Swarm of Flies** (When hurt, 25% chance every enemy gains 1 Blight.); **Holy Pestilence** (+30% ability power.); **Incense of Decay** (+2 DEF, +10 HP.); **Plague Censer** (New ability. Every 4th turn: every enemy loses 1 SPD and gains 1 Blight.)
  - Signature item: **Censer of Flies** (7g): +8 HP. Start of combat: every enemy gains 1 Blight.
- **Rot Mother** (occult, shadow, nature): Smothers one enemy in Blight; every death feeds the party and spreads the rot.
  - **Brood of Rot:** Every 3rd turn: the nearest enemy gains 3 Blight; heal the most wounded ally for 120% ATK.
  - **Cycle of Rot:** When any enemy falls, heal all allies for 20% ATK and every enemy gains 1 Blight.
  - Talents: **Mother’s Embrace** (Start of combat: shield all allies for 60% ATK.); **Fecund Rot** (Basic attacks give 1 more Blight.); **Rotting Grasp** (Basic attacks make the target lose 1 SPD.); **Corpse Bloom** (New ability. Every 4th turn: heal all allies for 80% ATK.)
  - Signature item: **Mother’s Locket** (7g): +10 HP. When an ally falls, heal all other allies for 100% ATK.

### Other additions
- **Berserker: Deathless Fury.** The first time the Berserker would fall, it stays at 1 HP and can't drop below it for 2 turns, with +4 ATK and +4 SPD. Brandon asked for a rage talent that stops it dying and boosts it for a few turns.
- **Rivals** (Warrior + Dark Knight): the first time an ally falls, both gain +3 ATK.

## Juice (Milestone 8)

Brandon's calls: sounds made in code with a retro feel, and icons for the 13 base classes, item types and stats.

### Icons
- **game-icons.net icons (CC BY 3.0)** for the 13 base classes, the 10 summons, the four stats (HP, ATK, DEF, SPD), shop offers (item, signature item, training) and the sound toggle: 32 in all. Advanced and tertiary classes use their base class's icon, tinted with its colour.
- `npm run icons` fetches them from the game-icons repository, keeps only the SVG path data, and regenerates `src/assets/icons.ts` and the icon list in `src/assets/ATTRIBUTION.md`. The in-game Credits screen lists the same data, and a test checks every icon is credited.
- Statuses (Runes, Dread, burns) and HUD markers (gold, lives, wins, locks) keep their emoji.
- On phones, where card avatars are hidden for space, a small class icon sits beside each unit's name.

### Sound
- **Retro sound effects synthesised with the Web Audio API**: no audio files. Each sound is a few notes of data (square, triangle, sine or noise, with slides).
- **Fights:** hits, fully blocked hits, casts, heals, shields, deaths, Rune detonations, summons and sudden death. A busy turn plays its three most important sounds, and the result plays a victory or defeat jingle. Skipping a fight is silent.
- **Shop:** buy, sell, reroll, lock, choices and stat points, level-ups, errors (a low buzz), and the Fight button. Achievements chime.
- **Sound toggle** on the title screen, in the shop header and in the fight controls. It's on by default and remembered. Browsers keep audio silent until the first tap, which every sound follows.

### Animations
- **Fights:** casts glow in the class colour, heals and shields pulse, hits for a quarter of max HP or more flash red and shake harder, Rune detonations burst, and dying units flare and collapse. The result title lands with weight (gold for a win, a shake for a loss).
- **Shop:** new offers deal in left to right after a reroll or a new round (locked offers stay put); a unit's level pops when it goes up; gold and wins bump when they change.
- **Reduced motion:** the system setting still shortens every animation to an instant.

### Credits screen
Linked from the title screen: who made the game (Brandon designed and directed it; Claude Code wrote the code), every icon with its author and link, and how the sound is made.

## Open design questions (for Brandon)

None blocking. Things to look at when playtesting M7:

1. **Ladder steepness.** Settled for 1.0: the 10 tiers stay as they are. More tiers, unique bosses and must-beat boss rounds come after release ([#20](https://github.com/AggroSec/party-auto-battler/issues/20)).
2. **Unlock pacing.** Do the starting five classes feel too thin, or about right, and do the achievements come at a good rate? (Play with Unlock everything off to judge.)
3. **Signature items.** Are they findable often enough (30% per item slot while wanted) and worth 7–8 gold?
4. **Enemy preview.** Should the shop show the next enemy, fully or partly (say, its classes), before you fight? Still open from M4, and more relevant now with bosses.
5. **Runeblade and Dark Knight.** Does the Rune rhythm read well in playback, and do the four paths feel distinct? Is Dread (−1 ATK per stack, up to 2) noticeable without being oppressive?
6. **By a Thread.** Is winning a run at 1 life a fair Warlock unlock, or should it become "win a fight at 1 life"?

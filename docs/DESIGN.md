# Game Design Doc (living)

> Brandon owns the design. This doc records the current state of the game's rules as implemented, and grows each milestone. The brief lives in [CLAUDE.md](../CLAUDE.md); autonomous choices are logged in [DECISIONS.md](DECISIONS.md).

## Status

| Area | State |
|---|---|
| Combat engine | ✅ Milestone 1 |
| Run loop (shop, gold, rounds, lives, enemies) | ✅ Milestone 2 |
| Builds (XP, talents, advanced classes, items, synergies) | ✅ Milestone 3 |
| Playable UI | Milestone 4 |

## Run structure

- A run continues until **10 wins** (run complete) or **0 lives** (run over). You start with **5 lives** and lose 1 per lost fight, so a run takes 10–14 rounds (more if there are draws). *(Decided by Brandon, 2026-10-17.)*
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
| Shop size | 4 unit slots + 2 extra slots (items or training) |
| Items | 3–5 gold |
| Training | 3 gold for +2 XP |

- Unspent gold carries over between rounds.
- The shop offers starter classes with equal odds. Unlocked classes (Necromancer) join the pool through meta progression (M5).
- Bought units auto-place into their preferred row (Warrior and Rogue front, others back), overflowing to any empty slot. Units can be moved freely; moving onto an occupied slot swaps the two.
- Duplicates of a class are allowed and never merge (#5, Brandon's call).
- **Extra slots** roll an item, or (35% of the time, if you own a unit) **training** for one of the classes on your board, e.g. "Warrior Training: +2 XP to one Warrior". Training is class-specific and random, so you reroll to chase XP for the unit you want (#5).
- Items and training go to the unit you select. Items can be moved between units in the shop. Selling a unit refunds 1 gold plus 1 per equipped item.

## Enemies

- Each round's enemy party is generated from **archetypes** (`src/data/enemies.ts`): Bandit Brute (Warrior), Cutthroat (Rogue), Poacher (Ranger), Hedge Mage (Mage, round 2+), Cult Acolyte (Cleric, round 3+) and Bonecaller (Necromancer, round 5+).
- Party size by round: 2, 3, 4, then 5 from round 4.
- **Enemies develop like players do.** Each enemy unit is levelled for the round, making random talent and advanced-class choices, and carries random items. Levels and item counts are fractional averages (e.g. level 2.4 = each unit is level 3 with 40% chance), so enemy power ramps smoothly instead of in steps: level 1 → 5 over rounds 1–14, 0 → 2 items over rounds 1–12.
- Synergies apply to enemies too.
- On top of that, HP and ATK start at **95%** and grow **+7% HP / +4.5% ATK per round**.
- The enemy depends only on the run seed and round number, so rerolling or reshuffling your party never changes who you fight.

## Board

- Each side has a **front row (3 slots)** and a **back row (2 slots)**.
- The back row's slots sit *between* the front row's lanes: back slot 0 is between front 0 and 1, back slot 1 is between front 1 and 2. This matters for nearest-lane targeting.
- **Back-row melee:** melee units (Warrior, Rogue) in the back row deal **50% damage** while any ally stands in their front row. Once the front row falls, they hit at full strength. This applies to all their damage, abilities included. *(Issue #2, option 3; kept open to revisit with talents and items.)*

## Stats

| Stat | Meaning | Typical range (base) |
|---|---|---|
| HP | Health. 0 = dead. | 22–42 |
| ATK | Basic attack damage; most abilities scale off it. | 4–7 |
| DEF | Damage reduction with diminishing returns. | 0–3 |
| SPD | How fast the action gauge fills. | 8–13 |

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
| `self` | The unit itself. |
| `lowestHpAlly` | Ally (including self) with the lowest HP **percentage**. |
| `triggerSource` / `triggerTarget` | The other unit involved in a trigger (see below). |

Ties are always broken by board order, so targeting is deterministic.

## Effects and triggers

All special behaviour (class abilities now, talents and items later) is data: a list of **effects** fired by an ability or a **trigger**.

**Effects:** `damage` (with optional `hits`, `splash` to row neighbours, `pierce`), `heal` (capped at max HP), `shield`, `buff` and `debuff` (ATK/DEF/SPD, rest of combat; debuffs floor at 0), `cooldown` (shift a unit's next ability sooner or later; never sooner than next turn). Amounts scale off the source's stats: `flat + atk×ATK + def×DEF + maxHp×MaxHP`.

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
| Necromancer 🔒 | Caster | Ranged | 24/5/1/9 | lowest HP | **Drain Life** (3): 150% ATK to the weakest enemy, heal self 100% ATK | **Dark Harvest:** +2 ATK when an ally dies |

🔒 = unlockable via meta progression (Milestone 5).

**Tags** (for synergies): Warrior martial + guardian, Rogue martial + shadow, Mage arcane, Cleric divine, Ranger martial + wild, Necromancer arcane + shadow. Advanced classes replace their base tags.

**Level-up stat growth** (each level rolls an integer in the range, from the seeded RNG; Brandon's direction):

| Class | HP | ATK | DEF | SPD |
|---|---|---|---|---|
| Warrior | 3–5 | 0–2 | 0–1 | 0–1 |
| Rogue | 1–3 | 1–2 | 0–1 | 1–3 |
| Mage | 1–3 | 1–2 | 0 | 0–1 |
| Cleric | 2–4 | 0–1 | 0–1 | 0–1 |
| Ranger | 1–3 | 1–2 | 0–1 | 1–2 |
| Necromancer | 1–3 | 1–2 | 0–1 | 0–1 |

## Progression

- **XP from combat:** every unit on the board gains 2 XP for a win and 1 for a loss or draw. Training adds more.
- **Levels 1–5** at 0 / 2 / 5 / 9 / 14 cumulative XP. A unit bought in round 1 reaches level 3 around round 4 and level 5 around round 8.
- **Every level-up** rolls stat growth and offers a choice (the run blocks the next fight until you pick):
  - **Level 2:** 1 of 3 talents from the base class pool.
  - **Level 3:** advance into 1 of 2 advanced classes. This replaces the ability and tags, and adds stats and a passive.
  - **Levels 4–5:** 1 of 3 talents from the advanced class pool.
- Content lives in `src/data/builds/<class>.ts`: 4 base talents per class, and 2 advanced classes with 4 talents each. That's 12 advanced classes and 72 talents.

## Advanced classes

| Base | Advanced | Tags | Ability | Passive |
|---|---|---|---|---|
| Warrior | **Knight** | martial, guardian, divine | Holy Bulwark: shield all allies 3 + 150% DEF | 25% when hurt: shield self 3 |
| Warrior | **Berserker** | martial | Whirlwind: 85% ATK to every enemy | +15% lifesteal; +4 ATK when bloodied |
| Rogue | **Assassin** | shadow | Assassinate: 320% ATK to weakest back-row enemy | Shield 6 on kill |
| Rogue | **Duelist** | martial | Flurry: 3 × 80% ATK on nearest | Reach; 35% riposte for 80% ATK |
| Mage | **Pyromancer** | arcane | Meteor (every 2nd turn): 160% ATK to the enemy front row | Kills fling 80% ATK at a random enemy |
| Mage | **Chronomancer** | arcane | Time Warp: allies' abilities 1 turn sooner, 100% ATK nearest | Start of combat: enemies −1 SPD |
| Cleric | **Priest** | divine | Prayer of Healing: heal all 180% ATK, shield all 60% ATK | Ally death: shield all 100% ATK |
| Cleric | **Inquisitor** | divine, martial | Judgment: 200% ATK pierce to strongest, self-heal 100% ATK | After casting: strongest enemy −2 DEF |
| Ranger | **Sharpshooter** | martial | Aimed Shot: 220% ATK pierce to strongest | Kills: next ability 2 turns sooner |
| Ranger | **Beastmaster** | wild | Call the Pack: 4 × 70% ATK at random enemies | Start of combat: allies +1 ATK |
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

"Warriors", "Rogues" and so on include that class's advanced classes. Reach items and talents (Long Spear, Smoke Cloak for Rogues, Polearm Training, Shadowstep, Duelist) are the #2 hook: ways for a build to opt out of the back-row melee penalty.

## Synergies

The highest tier met is active. Synergies apply to enemies too.

| Synergy | Requirement | Bonus |
|---|---|---|
| Martial Discipline | 2 / 4 martial | Martial units +2 ATK / +2 ATK +4 HP |
| Arcane Circle | 2 / 3 arcane | Arcane units +30% AP +8 HP / +50% AP +12 HP |
| Shield Wall | 2 / 3 guardian | Every ally starts with a 3 / 7 shield |
| Divine Choir | 2 divine | Every ally heals 2 HP at the start of its turns |
| Shadow Pact | 2 shadow | Shadow units +10% lifesteal, +1 SPD |
| Call of the Wild | 2 wild | Wild units +1 SPD |
| Vanguard | 1 guardian + 1 divine | Guardians +3 DEF (the brief's "frontline + healer") |
| Adventuring Party | 4 / 5 different classes | Every ally +3 / +4 HP |

## Resolved design questions

- **#1 Heal stalemates:** sudden death (option 3). Implemented in M2.
- **#2 Back-row melee:** 50% damage while the front row stands (option 3). Implemented in M2. M3 adds reach items, talents and the Duelist as ways around it. The issue stays open to revisit.
- **#5 Duplicates:** no merging. XP comes from combat plus random class-specific training offers in the shop (option 3, M3).
- **Run length:** play until 10 wins or 0 lives (the brief's "up to 10 rounds" conflicted with "10 wins = complete").
- **Draws:** count as neither win nor loss.

## Direction from Brandon (implemented in M3)

- **Levelling is weighted random.** Each level-up adds stats rolled from per-class ranges, so growth leans toward the class identity without being fixed. For example, a Rogue might gain 3–5 SPD but only 1–3 HP per level, while a Warrior leans HP/DEF. Exact ranges get tuned with the simulator. Rolls use the seeded RNG, so a run is still reproducible from its seed. *(2026-10-17)*
- Items and talents add further variety. Determinism is about reproducibility, not removing randomness.

## Open design questions (for Brandon)

None blocking. Things to look at when playtesting M3 (they're balance and feel, not rules):

1. **Late-game wall.** From round 11, every bot wins only about 20% (then 7%, 4%), regardless of skill. A run that reaches round 11 has already lost several fights, so it's a final hurdle for comeback runs. Does it feel fair or too punishing?
2. **Talent feel.** Are level-up choices interesting, or do some feel like obvious picks?

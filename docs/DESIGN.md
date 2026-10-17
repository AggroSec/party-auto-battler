# Game Design Doc (living)

> Brandon owns the design. This doc records the current state of the game's rules as implemented, and grows each milestone. The brief lives in [CLAUDE.md](../CLAUDE.md); autonomous choices are logged in [DECISIONS.md](DECISIONS.md).

## Status

| Area | State |
|---|---|
| Combat engine | ✅ Milestone 1 |
| Run loop (shop, gold, rounds, lives, enemies) | ✅ Milestone 2 |
| Builds (XP, talents, advanced classes, items, synergies) | Milestone 3 |
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
| Shop size | 4 units |

- Unspent gold carries over between rounds.
- The shop offers starter classes with equal odds. Unlocked classes (Necromancer) join the pool through meta progression (M5).
- Bought units auto-place into their preferred row (Warrior and Rogue front, others back), overflowing to any empty slot. Units can be moved freely; moving onto an occupied slot swaps the two.
- Duplicates of a class are allowed. Units don't merge or level yet (see open questions).

## Enemies

- Each round's enemy party is generated from **archetypes** (`src/data/enemies.ts`): Bandit Brute (Warrior), Cutthroat (Rogue), Poacher (Ranger), Hedge Mage (Mage, round 2+), Cult Acolyte (Cleric, round 3+) and Bonecaller (Necromancer, round 5+).
- Party size by round: 2, 3, 4, then 5 from round 4.
- Stats start at **75%** of a player unit's and grow **+3.75% HP / +2.75% ATK per round**. Enemies pass player base stats around round 8; from there, player progression (M3) has to keep up.
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

**Effects:** `damage` (with optional `hits`, `splash` to row neighbours, `pierce`), `heal` (capped at max HP), `shield`, `buff` (ATK/DEF/SPD, lasts the rest of combat). Amounts scale off the source's stats: `flat + atk×ATK + def×DEF + maxHp×MaxHP`.

**Triggers:**

| Trigger | Fires when | `triggerSource` | `triggerTarget` |
|---|---|---|---|
| `startOfCombat` | Before the first tick | – | – |
| `onTurnStart` | Start of the unit's turn | – | – |
| `onAttack` | After the unit's basic attack (not abilities) | – | unit attacked |
| `onHurt` | Unit takes damage and survives | attacker | – |
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

## Resolved design questions

- **#1 Heal stalemates:** sudden death (option 3). Implemented in M2.
- **#2 Back-row melee:** 50% damage while the front row stands (option 3). Implemented in M2; the issue stays open to revisit with talents and items.
- **Run length:** play until 10 wins or 0 lives (the brief's "up to 10 rounds" conflicted with "10 wins = complete").
- **Draws:** count as neither win nor loss.

## Direction for Milestone 3 (from Brandon)

- **Levelling is weighted random.** Each level-up adds stats rolled from per-class ranges, so growth leans toward the class identity without being fixed. For example, a Rogue might gain 3–5 SPD but only 1–3 HP per level, while a Warrior leans HP/DEF. Exact ranges get tuned with the simulator. Rolls use the seeded RNG, so a run is still reproducible from its seed. *(2026-10-17)*
- Items and talents add further variety. Determinism is about reproducibility, not removing randomness.

## Open design questions (for Brandon)

1. **Duplicate units** ([#5](https://github.com/AggroSec/party-auto-battler/issues/5)). Buying a second Warrior just gives you two separate Warriors. Many auto-battlers let duplicates merge to level up. The brief says units gain XP *from combat*. For M3, should XP come only from combat, or should merging duplicates also grant XP? Merging adds a reason to reroll and a gold sink.

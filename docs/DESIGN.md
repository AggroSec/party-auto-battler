# Game Design Doc (living)

> Brandon owns the design. This doc records the current state of the game's rules as implemented, and grows each milestone. The brief lives in [CLAUDE.md](../CLAUDE.md); autonomous choices are logged in [DECISIONS.md](DECISIONS.md).

## Status

| Area | State |
|---|---|
| Combat engine | ✅ Milestone 1 |
| Run loop (shop, gold, rounds, lives, enemies) | Milestone 2 |
| Builds (XP, talents, advanced classes, items, synergies) | Milestone 3 |
| Playable UI | Milestone 4 |

## Board

- Each side has a **front row (3 slots)** and a **back row (2 slots)**.
- The back row's slots sit *between* the front row's lanes: back slot 0 is between front 0 and 1, back slot 1 is between front 1 and 2. This matters for melee lane preference.

## Stats

| Stat | Meaning | Typical range (base) |
|---|---|---|
| HP | Health. 0 = dead. | 22–42 |
| ATK | Basic attack damage; most abilities scale off it. | 4–7 |
| DEF | Damage reduction with diminishing returns. | 0–3 |
| SPD | How fast the action gauge fills. | 8–13 |

## Combat rules

**Timeline.** Combat runs in ticks. Every tick, each living unit adds its SPD to an action gauge. When the gauge reaches 100, the unit takes a turn and the gauge drops by 100 (the overflow carries over). SPD 10 = one turn every 10 ticks. SPD is clamped to 1–100.

**Turn order on the same tick:** fullest gauge first → higher SPD → player side before enemy → board order (front 0–2, then back 0–1).

**A turn:**
1. `onTurnStart` triggers fire.
2. The ability cooldown ticks down by 1. If it hits 0, the unit **casts its ability** instead of attacking and the cooldown resets. (Cooldown 3 = casts every 3rd turn.)
3. Otherwise it makes a **basic attack** (1× ATK) at its attack target, then `onAttack` triggers fire.

**Damage.** `damage = max(1, round(raw × 10 / (10 + DEF)))`. 10 DEF halves damage; DEF never makes a unit immune. *Pierce* ignores DEF. **Shields** absorb damage before HP.

**End.** Combat ends when one side has no living units. If both sides die at the same moment, it's a draw. A fight still going at **1,000 ticks is a draw** (timeout).

## Targeting

| Selector | Picks |
|---|---|
| `melee` | Frontmost living enemy row; closest lane to the attacker; ties → lower column. Reaches the back row only when the front row is empty. |
| `backlineFirst` | Lowest-HP enemy in the back row; falls back to `melee`. |
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

| Class | Role | HP/ATK/DEF/SPD | Attacks | Ability | Passive |
|---|---|---|---|---|---|
| Warrior | Frontline | 42/6/3/8 | melee | **Cleave** (every 3rd turn): 80% ATK to each enemy in the front row | **Battle Hardened:** +1 DEF when hurt (max 3 times) |
| Rogue | Striker | 24/6/1/13 | melee | **Backstab** (3): 200% ATK to the weakest back-row enemy | **Bloodlust:** +2 ATK on kill |
| Mage | Caster | 24/7/0/9 | melee | **Fireball** (3): 200% ATK to the weakest enemy, 50% splash to its row neighbours | – |
| Cleric | Support | 30/4/2/9 | melee | **Mend** (2): heal the most injured ally for 250% ATK | **Blessing:** start of combat, shield all allies for 100% ATK |
| Ranger | Striker | 26/5/1/11 | lowest HP | **Volley** (3): 3 arrows at random enemies, 80% ATK each | **Quick Shot:** 25% on attack, extra 50% ATK pierce hit |
| Necromancer 🔒 | Caster | 24/5/1/9 | lowest HP | **Drain Life** (3): 150% ATK to the weakest enemy, heal self 100% ATK | **Dark Harvest:** +2 ATK when an ally dies |

🔒 = unlockable via meta progression (Milestone 5).

## Open design questions (for Brandon)

1. **Heal stalemates** ([#1](https://github.com/AggroSec/party-auto-battler/issues/1)). About 0.15% of random 5v5 fights hit the tick cap, all of them Cleric + Warrior walls out-healing incoming damage. Options: accept it (it's a draw), or add an *overtime* rule (e.g. healing reduced by 50% after tick 300, or growing true damage to everyone). That's a new mechanic, so it's your call.
2. **Melee units in the back row** ([#2](https://github.com/AggroSec/party-auto-battler/issues/2)). Right now a melee unit in the back row attacks normally; the back row only protects it from enemy melee. Should back-row melee units be unable to attack (or deal reduced damage) until the front row clears? That would make positioning matter more, but it's a rule players would notice.

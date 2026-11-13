import type { BossDef, ClassTemplate } from '../../engine/run/content-types.ts';
import type { AbilityDef, Stats } from '../../engine/types.ts';
import { on } from '../builds/dsl.ts';
import { BROKEN_LIMB, DREAD, HELLFIRE } from '../statuses.ts';

/**
 * Bosses (M7, ladder tier 8+): one replaces an enemy on rounds 5, 10 and 15.
 * Each fights as its class with a unique passive; from tier 10 it also casts
 * a second ability. From tier 13 the unique bosses (below) take over.
 */
const CLASS_BOSSES: BossDef[] = [
  {
    id: 'grukk',
    name: 'Grukk the Ironjaw',
    classId: 'warrior',
    minRound: 5,
    statMultiplier: { hp: 1.6, atk: 1.15 },
    passive: { name: 'War Cry', description: 'Start of combat: all allies gain +2 ATK, and Grukk shields himself for 200% ATK.' },
    modifier: {
      triggers: [
        on('startOfCombat', 'War Cry', [
          { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } },
          { kind: 'shield', target: 'self', amount: { atk: 2 } },
        ]),
      ],
    },
    ability: {
      id: 'earthshatter',
      name: 'Earthshatter',
      description: 'Every 4th turn: deal 90% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.9 } }],
    },
  },
  {
    id: 'vesper',
    name: 'Vesper, the Night Queen',
    classId: 'rogue',
    minRound: 5,
    statMultiplier: { hp: 1.6, atk: 1.15 },
    passive: { name: 'Bloodthirst', description: '+15% lifesteal. On kill, gain +3 ATK and +2 SPD.' },
    modifier: {
      lifesteal: 0.15,
      triggers: [
        on('onKill', 'Bloodthirst', [
          { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } },
          { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 2 } },
        ]),
      ],
    },
    ability: {
      id: 'fan-of-knives',
      name: 'Fan of Knives',
      description: 'Every 4th turn: deal 70% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }],
    },
  },
  {
    id: 'ozric',
    name: 'Archmage Ozric',
    classId: 'mage',
    minRound: 5,
    statMultiplier: { hp: 1.6, atk: 1.15 },
    passive: { name: 'Arcane Ward', description: 'Start of combat: shield all allies for 120% ATK.' },
    modifier: { triggers: [on('startOfCombat', 'Arcane Ward', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1.2 } }])] },
    ability: {
      id: 'arcane-barrage',
      name: 'Arcane Barrage',
      description: 'Every 4th turn: deal 60% ATK to random enemies 5 times.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.6 }, hits: 5 }],
    },
  },
  {
    id: 'hollow-king',
    name: 'The Hollow King',
    classId: 'necromancer',
    minRound: 10,
    statMultiplier: { hp: 1.6, atk: 1.15 },
    passive: { name: 'Deathless Court', description: 'Revives once at 50% HP. When an ally dies, all allies heal for 100% ATK.' },
    modifier: {
      revive: 0.5,
      triggers: [on('onAllyDeath', 'Deathless Court', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }])],
    },
    ability: {
      id: 'soul-rend',
      name: 'Soul Rend',
      description: 'Every 4th turn: deal 220% ATK to the weakest enemy and heal yourself for 100% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'lowestHp', amount: { atk: 2.2 } },
        { kind: 'heal', target: 'self', amount: { atk: 1 } },
      ],
    },
  },
  {
    id: 'thornmother',
    name: 'Mother Thornroot',
    classId: 'druid',
    minRound: 10,
    statMultiplier: { hp: 1.6, atk: 1.15 },
    passive: { name: 'Overgrowth', description: '+3 DEF. At the start of each of her turns, all allies heal 4.' },
    modifier: {
      stats: { def: 3 },
      triggers: [on('onTurnStart', 'Overgrowth', [{ kind: 'heal', target: 'allAllies', amount: { flat: 4 } }])],
    },
    ability: {
      id: 'strangling-roots',
      name: 'Strangling Roots',
      description: 'Every 4th turn: deal 120% ATK to each enemy in the front row; they lose 2 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.2 } },
        { kind: 'debuff', target: 'enemyFrontRow', stat: 'spd', amount: { flat: 2 } },
      ],
    },
  },
  {
    id: 'colossus',
    name: 'The Iron Colossus',
    classId: 'engineer',
    minRound: 15,
    statMultiplier: { hp: 1.9, atk: 1.15 },
    passive: { name: 'Reinforced', description: '+4 DEF. When hurt, 25% chance to shield itself for 10.' },
    modifier: {
      stats: { def: 4 },
      triggers: [on('onHurt', 'Reinforced', [{ kind: 'shield', target: 'self', amount: { flat: 10 } }], { chance: 0.25 })],
    },
    ability: {
      id: 'overload',
      name: 'Overload',
      description: 'Every 4th turn: deal 60% ATK to every enemy, twice.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 }, hits: 2 }],
    },
  },
];

/** A unique boss's own class: never in the shop or the regular enemy pool, with no talents or advanced classes. */
export function bossClass(id: string, name: string, baseStats: Stats, range: 'melee' | 'ranged', placement: number, ability: AbilityDef): ClassTemplate {
  return {
    id,
    name,
    baseStats,
    range,
    attackTarget: 'nearest',
    ability,
    triggers: [],
    placement,
    tags: [],
    statWeights: { hp: 4, atk: 3, def: 1, spd: 1 },
    talents: [],
    advancedClasses: [],
    bossOnly: true,
  };
}

/** The unique bosses' classes, added to the run's classes so the engine can build them. */
export const BOSS_CLASSES: Record<string, ClassTemplate> = Object.fromEntries(
  [
    bossClass('chain-warden', 'Chain Warden', { hp: 52, atk: 6, def: 4, spd: 7 }, 'melee', 0, {
      id: 'chain-pull',
      name: 'Chain Pull',
      description: 'Every 3rd turn: deal 140% ATK to the weakest enemy in the back row (else the nearest); it loses 2 SPD.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'backlineFirst', amount: { atk: 1.4 } },
        { kind: 'debuff', target: 'backlineFirst', stat: 'spd', amount: { flat: 2 } },
      ],
    }),
    bossClass('pale-choir', 'Pale Choir', { hp: 40, atk: 7, def: 1, spd: 9 }, 'ranged', 4, {
      id: 'requiem',
      name: 'Requiem',
      description: 'Every 3rd turn: deal 80% ATK to every enemy and heal all allies for 40% ATK.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
        { kind: 'heal', target: 'allAllies', amount: { atk: 0.4 } },
      ],
    }),
    bossClass('bonesaw', 'Bonesaw', { hp: 46, atk: 8, def: 2, spd: 11 }, 'melee', 1, {
      id: 'bonesaw',
      name: 'Bonesaw',
      description: 'Every 3rd turn: hit the nearest enemy 4 times for 50% ATK and break 2 of its limbs.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 0.5 }, hits: 4 },
        { kind: 'status', target: 'nearest', status: BROKEN_LIMB, stacks: 2 },
      ],
    }),
    bossClass('ashen-wyrm', 'Ashen Wyrm', { hp: 80, atk: 8, def: 3, spd: 8 }, 'ranged', 3, {
      id: 'ashen-breath',
      name: 'Ashen Breath',
      description: 'Every 3rd turn: deal 70% ATK to every enemy and give each 2 Hellfire.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } },
        { kind: 'status', target: 'allEnemies', status: HELLFIRE, stacks: 2 },
      ],
    }),
  ].map((c) => [c.id, c]),
);

/**
 * Unique bosses (ladder tier 13+): characters with their own class, not boss
 * versions of a regular class. They take over boss rounds on those tiers;
 * each boss round draws from the bosses with the latest `minRound` that has
 * arrived (round 5: Mordrake or the Pale Choir; 10: Gristle; 15: Vharoth).
 */
/**
 * Unique bosses have no advanced class or talents, so they get bigger
 * multipliers than class bosses to stay at least as dangerous. Tuned with a
 * party-vs-party comparison against the class bosses (see docs/BALANCE.md).
 */
const UNIQUE_MULT = { hp: 3.4, atk: 2.3 };

export const UNIQUE_BOSSES: BossDef[] = [
  {
    id: 'mordrake',
    name: 'Mordrake the Chain Warden',
    classId: 'chain-warden',
    minRound: 5,
    unique: true,
    statMultiplier: UNIQUE_MULT,
    passive: { name: 'Iron Shackles', description: 'Start of combat: taunt for 2 turns. When hurt, 30% chance the attacker loses 1 SPD.' },
    modifier: {
      triggers: [
        on('startOfCombat', 'Iron Shackles', [{ kind: 'taunt', target: 'self', turns: 2 }]),
        on('onHurt', 'Iron Shackles', [{ kind: 'debuff', target: 'triggerSource', stat: 'spd', amount: { flat: 1 } }], { chance: 0.3 }),
      ],
    },
    ability: {
      id: 'chain-lash',
      name: 'Chain Lash',
      description: 'Every 4th turn: deal 80% ATK to every enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } }],
    },
  },
  {
    id: 'pale-choir',
    name: 'The Pale Choir',
    classId: 'pale-choir',
    minRound: 5,
    unique: true,
    statMultiplier: UNIQUE_MULT,
    passive: { name: 'Echoing Dirge', description: 'When an ally falls, all allies gain +2 ATK and the Choir shields itself for 100% ATK.' },
    modifier: {
      triggers: [
        on('onAllyDeath', 'Echoing Dirge', [
          { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 2 } },
          { kind: 'shield', target: 'self', amount: { atk: 1 } },
        ]),
      ],
    },
    ability: {
      id: 'lament',
      name: 'Lament',
      description: 'Every 4th turn: every enemy gains 1 Dread (−1 ATK, up to 2).',
      cooldown: 4,
      effects: [{ kind: 'status', target: 'allEnemies', status: DREAD, stacks: 1 }],
    },
  },
  {
    id: 'gristle',
    name: 'Gristle the Bonesaw',
    classId: 'bonesaw',
    minRound: 10,
    unique: true,
    statMultiplier: UNIQUE_MULT,
    passive: { name: "Butcher's Frenzy", description: '+15% lifesteal. On kill, heal 30% of max HP.' },
    modifier: {
      lifesteal: 0.15,
      triggers: [on('onKill', "Butcher's Frenzy", [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }])],
    },
    ability: {
      id: 'carve-up',
      name: 'Carve Up',
      description: 'Every 4th turn: deal 160% ATK to the weakest enemy.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'lowestHp', amount: { atk: 1.6 } }],
    },
  },
  {
    id: 'vharoth',
    name: 'Vharoth the Ashen Wyrm',
    classId: 'ashen-wyrm',
    minRound: 15,
    unique: true,
    statMultiplier: { hp: UNIQUE_MULT.hp * 1.15, atk: UNIQUE_MULT.atk * 1.1 },
    passive: { name: 'Ancient Scales', description: '+4 DEF. When bloodied, gain +6 ATK and +3 SPD.' },
    modifier: {
      stats: { def: 4 },
      triggers: [
        on('onBloodied', 'Ancient Scales', [
          { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 6 } },
          { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 3 } },
        ]),
      ],
    },
    ability: {
      id: 'tail-sweep',
      name: 'Tail Sweep',
      description: 'Every 4th turn: deal 130% ATK to each enemy in the front row.',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.3 } }],
    },
  },
];

export const BOSSES: BossDef[] = [...CLASS_BOSSES, ...UNIQUE_BOSSES];

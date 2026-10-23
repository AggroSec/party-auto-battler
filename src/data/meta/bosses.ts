import type { BossDef } from '../../engine/run/content-types.ts';
import { on } from '../builds/dsl.ts';

/**
 * Bosses (M7, ladder tier 8+): one replaces an enemy on rounds 5, 10 and 15.
 * Each fights as its class with a unique passive; from tier 10 it also casts
 * a second ability.
 */
export const BOSSES: BossDef[] = [
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

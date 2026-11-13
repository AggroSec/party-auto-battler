// The Hollowing's bosses (Milestone 14): one at the end of each mission, each
// fighting as its own class. Tuned with the story simulator (docs/BALANCE.md).
import type { BossDef, ClassTemplate } from '../../engine/run/content-types.ts';
import type { SummonDef } from '../../engine/types.ts';
import { on } from '../builds/dsl.ts';
import { bossClass } from '../meta/bosses.ts';
import { FEVER, WEAKNESS } from '../rules-mode/statuses.ts';

const hollowWolf: SummonDef = {
  name: 'Hollow Wolf',
  classId: 'wolf',
  hp: { maxHp: 0.3 },
  atk: { atk: 0.6 },
  def: 1,
  spd: 12,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

/** The bosses' classes, added to the run's classes so the engine can build them. */
export const HOLLOWING_BOSS_CLASSES: Record<string, ClassTemplate> = Object.fromEntries(
  [
    bossClass('raider-chief', 'Raider Chief', { hp: 46, atk: 7, def: 3, spd: 8 }, 'melee', 0, {
      id: 'totem-smash',
      name: 'Totem Smash',
      description: 'Every 3rd turn: deal 150% ATK to the nearest enemy (40% splash to its neighbours).',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 1.5 }, splash: 0.4 }],
    }),
    bossClass('hollow-stag', 'Hollow Stag', { hp: 52, atk: 7, def: 2, spd: 10 }, 'melee', 0, {
      id: 'antler-charge',
      name: 'Antler Charge',
      description: 'Every 3rd turn: deal 120% ATK to each enemy in the front row.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 1.2 } }],
    }),
    bossClass('hollow-king', 'Hollow King', { hp: 58, atk: 8, def: 2, spd: 9 }, 'ranged', 4, {
      id: 'drain-the-heartwood',
      name: 'Drain the Heartwood',
      description: 'Every 3rd turn: deal 80% ATK to every enemy and heal himself for 100% ATK.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
        { kind: 'heal', target: 'self', amount: { atk: 1 } },
      ],
    }),
  ].map((c) => [c.id, c]),
);

export const GORRASK: BossDef = {
  id: 'gorrask',
  name: 'Gorrask Totem-Breaker',
  classId: 'raider-chief',
  minRound: 1,
  unique: true,
  statMultiplier: { hp: 1.6, atk: 1.25 },
  passive: { name: 'Stolen Spirits', description: 'Start of combat: +2 ATK and +2 DEF from his stolen spirit-stones. When bloodied, shield himself for 150% ATK.' },
  modifier: {
    triggers: [
      on('startOfCombat', 'Stolen Spirits', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'buff', target: 'self', stat: 'def', amount: { flat: 2 } },
      ]),
      on('onBloodied', 'Stolen Spirits', [{ kind: 'shield', target: 'self', amount: { atk: 1.5 } }]),
    ],
  },
  ability: {
    id: 'war-stomp',
    name: 'War Stomp',
    description: 'Every 4th turn: deal 70% ATK to every enemy.',
    cooldown: 4,
    effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }],
  },
};

export const HOLLOW_STAG: BossDef = {
  id: 'hollow-stag',
  name: 'The Hollow Stag',
  classId: 'hollow-stag',
  minRound: 1,
  unique: true,
  statMultiplier: { hp: 2.0, atk: 1.4 },
  passive: { name: 'Call of the Hollow Pack', description: 'Start of combat, and when bloodied: a Hollow Wolf joins the fight.' },
  modifier: {
    triggers: [
      on('startOfCombat', 'Call of the Hollow Pack', [{ kind: 'summon', summon: hollowWolf }]),
      on('onBloodied', 'Call of the Hollow Pack', [{ kind: 'summon', summon: hollowWolf }]),
    ],
  },
  ability: {
    id: 'blight-bellow',
    name: 'Blight Bellow',
    description: 'Every 4th turn: every enemy is Weakened (−3 ATK for 4 turns).',
    cooldown: 4,
    effects: [{ kind: 'status', target: 'allEnemies', status: WEAKNESS, stacks: 1 }],
  },
};

export const HOLLOW_KING: BossDef = {
  id: 'hollow-king',
  name: 'The Hollow King',
  classId: 'hollow-king',
  minRound: 1,
  unique: true,
  statMultiplier: { hp: 2.4, atk: 1.6 },
  passive: { name: 'Crown of Hollows', description: 'Start of combat: shield himself for 200% ATK. When an ally falls, he gains +3 ATK.' },
  modifier: {
    triggers: [
      on('startOfCombat', 'Crown of Hollows', [{ kind: 'shield', target: 'self', amount: { atk: 2 } }]),
      on('onAllyDeath', 'Crown of Hollows', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 3 } }]),
    ],
  },
  ability: {
    id: 'the-hollowing',
    name: 'The Hollowing',
    description: 'Every 4th turn: every enemy catches Fever (heals on it are halved for 4 turns).',
    cooldown: 4,
    effects: [{ kind: 'status', target: 'allEnemies', status: FEVER, stacks: 1 }],
  },
};

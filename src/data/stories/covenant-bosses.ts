// The Black Covenant's bosses (Milestone 15): one at the end of each mission,
// each fighting as its own class. Tuned with the story simulator (docs/BALANCE.md).
import type { BossDef, ClassTemplate } from '../../engine/run/content-types.ts';
import type { SummonDef } from '../../engine/types.ts';
import { on } from '../builds/dsl.ts';
import { bossClass } from '../meta/bosses.ts';
import { BIND, HUSH, ROOTED } from '../rules-mode/statuses.ts';

const barrowSpirit: SummonDef = {
  name: 'Barrow Spirit',
  classId: 'barrow-spirit',
  hp: { maxHp: 0.3 },
  atk: { atk: 0.6 },
  def: 1,
  spd: 10,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

/** The bosses' classes, added to the run's classes so the engine can build them. */
export const COVENANT_BOSS_CLASSES: Record<string, ClassTemplate> = Object.fromEntries(
  [
    bossClass('warden-inquisitor', 'Warden-Inquisitor', { hp: 46, atk: 7, def: 3, spd: 8 }, 'melee', 0, {
      id: 'shackles-of-dawn',
      name: 'Shackles of Dawn',
      description: 'Every 3rd turn: deal 120% ATK to the nearest enemy and Bind it (it loses its next turn).',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 1.2 } },
        { kind: 'status', target: 'nearest', status: BIND, stacks: 1 },
      ],
    }),
    bossClass('abbess', 'Mother Abbess', { hp: 50, atk: 7, def: 2, spd: 9 }, 'ranged', 4, {
      id: 'mercy-of-dawn',
      name: 'Mercy of Dawn',
      description: 'Every 3rd turn: heal every ally for 80% ATK and deal 60% ATK to the nearest enemy.',
      cooldown: 3,
      effects: [
        { kind: 'heal', target: 'allAllies', amount: { atk: 0.8 } },
        { kind: 'damage', target: 'nearest', amount: { atk: 0.6 } },
      ],
    }),
    bossClass('barrow-mother', 'Barrow-Mother', { hp: 58, atk: 8, def: 2, spd: 9 }, 'melee', 0, {
      id: 'ancestors-wrath',
      name: 'Ancestors’ Wrath',
      description: 'Every 3rd turn: deal 80% ATK to every enemy.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } }],
    }),
  ].map((c) => [c.id, c]),
);

export const HALRIC: BossDef = {
  id: 'halric',
  name: 'Halric, Warden-Inquisitor',
  classId: 'warden-inquisitor',
  minRound: 1,
  unique: true,
  statMultiplier: { hp: 1.3, atk: 1.1 },
  passive: { name: 'Iron Faith', description: 'Start of combat: shield himself for 150% ATK. When bloodied, +3 DEF.' },
  modifier: {
    triggers: [
      on('startOfCombat', 'Iron Faith', [{ kind: 'shield', target: 'self', amount: { atk: 1.5 } }]),
      on('onBloodied', 'Iron Faith', [{ kind: 'buff', target: 'self', stat: 'def', amount: { flat: 3 } }]),
    ],
  },
  ability: {
    id: 'interrogation',
    name: 'Interrogation',
    description: 'Every 4th turn: Hush the enemy with the highest ATK (no abilities for 2 turns).',
    cooldown: 4,
    effects: [{ kind: 'status', target: 'highestAtk', status: HUSH, stacks: 1 }],
  },
};

export const SERAPHINE: BossDef = {
  id: 'seraphine',
  name: 'Mother Abbess Seraphine',
  classId: 'abbess',
  minRound: 1,
  unique: true,
  statMultiplier: { hp: 2, atk: 1.45 },
  passive: { name: 'Martyr’s Grace', description: 'When an ally falls, heal every ally for 100% ATK.' },
  modifier: {
    triggers: [on('onAllyDeath', 'Martyr’s Grace', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }])],
  },
  ability: {
    id: 'sanctify',
    name: 'Sanctify',
    description: 'Every 4th turn: shield every ally for 100% ATK.',
    cooldown: 4,
    effects: [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }],
  },
};

export const BARROW_MOTHER: BossDef = {
  id: 'barrow-mother',
  name: 'The Barrow-Mother',
  classId: 'barrow-mother',
  minRound: 1,
  unique: true,
  statMultiplier: { hp: 1.85, atk: 1.35 },
  passive: { name: 'The Greymoor Remembers', description: 'Start of combat, and when bloodied: a Barrow Spirit rises to fight for her.' },
  modifier: {
    triggers: [
      on('startOfCombat', 'The Greymoor Remembers', [{ kind: 'summon', summon: barrowSpirit }]),
      on('onBloodied', 'The Greymoor Remembers', [{ kind: 'summon', summon: barrowSpirit }]),
    ],
  },
  ability: {
    id: 'rite-of-warding',
    name: 'Rite of Warding',
    description: 'Every 4th turn: every enemy is Rooted (−3 SPD for 2 turns).',
    cooldown: 4,
    effects: [{ kind: 'status', target: 'allEnemies', status: ROOTED, stacks: 1 }],
  },
};

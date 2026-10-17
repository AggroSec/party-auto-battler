import type { ClassTemplate } from '../engine/run/content-types.ts';
import { BASE_TALENTS, talentIds } from './builds/index.ts';

export type ClassId = 'warrior' | 'rogue' | 'mage' | 'cleric' | 'ranger' | 'necromancer';

export type ClassRole = 'frontline' | 'striker' | 'caster' | 'support';

/**
 * A playable class. `triggers` are innate passives; `growth` is the per-level
 * stat roll (weighted toward the class identity); `talents` is the level-2
 * pool and `advancedClasses` the level-3 choice.
 */
export interface ClassDef extends ClassTemplate {
  id: ClassId;
  role: ClassRole;
  /** Locked behind meta progression. */
  unlockable: boolean;
  description: string;
}

export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    role: 'frontline',
    tags: ['martial', 'guardian'],
    unlockable: false,
    description: 'Durable front-liner who hits the whole enemy front row.',
    baseStats: { hp: 42, atk: 6, def: 3, spd: 8 },
    range: 'melee',
    placement: 0,
    growth: { hp: [3, 5], atk: [0, 2], def: [0, 1], spd: [0, 1] },
    talents: talentIds(BASE_TALENTS.warrior),
    advancedClasses: ['knight', 'berserker'],
    attackTarget: 'nearest',
    ability: {
      id: 'cleave',
      name: 'Cleave',
      description: 'Every 3rd turn: deal 80% ATK to each enemy in the front row.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'enemyFrontRow', amount: { atk: 0.8 } }],
    },
    triggers: [
      {
        label: 'Battle Hardened',
        on: 'onHurt',
        limit: 3,
        effects: [{ kind: 'buff', target: 'self', stat: 'def', amount: { flat: 1 } }],
      },
    ],
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    role: 'striker',
    tags: ['martial', 'shadow'],
    unlockable: false,
    description: 'Fast striker who slips past the front line to finish off the back row.',
    baseStats: { hp: 24, atk: 6, def: 1, spd: 13 },
    range: 'melee',
    placement: 1,
    growth: { hp: [1, 3], atk: [1, 2], def: [0, 1], spd: [1, 3] },
    talents: talentIds(BASE_TALENTS.rogue),
    advancedClasses: ['assassin', 'duelist'],
    attackTarget: 'nearest',
    ability: {
      id: 'backstab',
      name: 'Backstab',
      description: 'Every 3rd turn: deal 200% ATK to the weakest back-row enemy.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'backlineFirst', amount: { atk: 2 } }],
    },
    triggers: [
      {
        label: 'Bloodlust',
        on: 'onKill',
        effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }],
      },
    ],
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    role: 'caster',
    tags: ['arcane'],
    unlockable: false,
    description: 'Fragile caster whose Fireball splashes across a row.',
    baseStats: { hp: 24, atk: 7, def: 0, spd: 9 },
    range: 'ranged',
    placement: 4,
    growth: { hp: [1, 3], atk: [1, 2], def: [0, 0], spd: [0, 1] },
    talents: talentIds(BASE_TALENTS.mage),
    advancedClasses: ['pyromancer', 'chronomancer'],
    attackTarget: 'nearest',
    ability: {
      id: 'fireball',
      name: 'Fireball',
      description: 'Every 3rd turn: deal 200% ATK to the weakest enemy and 50% of that to its row neighbours.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'lowestHp', amount: { atk: 2 }, splash: 0.5 }],
    },
    triggers: [],
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    role: 'support',
    tags: ['divine'],
    unlockable: false,
    description: 'Healer who shields the party at the start of combat.',
    baseStats: { hp: 30, atk: 4, def: 2, spd: 9 },
    range: 'ranged',
    placement: 2,
    growth: { hp: [2, 4], atk: [0, 1], def: [0, 1], spd: [0, 1] },
    talents: talentIds(BASE_TALENTS.cleric),
    advancedClasses: ['priest', 'inquisitor'],
    attackTarget: 'nearest',
    ability: {
      id: 'mend',
      name: 'Mend',
      description: 'Every 2nd turn: heal the most injured ally for 250% ATK.',
      cooldown: 2,
      effects: [{ kind: 'heal', target: 'lowestHpAlly', amount: { atk: 2.5 } }],
    },
    triggers: [
      {
        label: 'Blessing',
        on: 'startOfCombat',
        effects: [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }],
      },
    ],
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    role: 'striker',
    tags: ['martial', 'wild'],
    unlockable: false,
    description: 'Ranged attacker who picks off the weakest enemy.',
    baseStats: { hp: 26, atk: 5, def: 1, spd: 11 },
    range: 'ranged',
    placement: 3,
    growth: { hp: [1, 3], atk: [1, 2], def: [0, 1], spd: [1, 2] },
    talents: talentIds(BASE_TALENTS.ranger),
    advancedClasses: ['sharpshooter', 'beastmaster'],
    attackTarget: 'lowestHp',
    ability: {
      id: 'volley',
      name: 'Volley',
      description: 'Every 3rd turn: fire 3 arrows at random enemies for 80% ATK each.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'randomEnemy', amount: { atk: 0.8 }, hits: 3 }],
    },
    triggers: [
      {
        label: 'Quick Shot',
        on: 'onAttack',
        chance: 0.25,
        effects: [{ kind: 'damage', target: 'triggerTarget', amount: { atk: 0.5 }, pierce: true }],
      },
    ],
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    role: 'caster',
    tags: ['arcane', 'shadow'],
    unlockable: true,
    description: 'Drains life from enemies and grows stronger as allies fall.',
    baseStats: { hp: 24, atk: 5, def: 1, spd: 9 },
    range: 'ranged',
    placement: 3,
    growth: { hp: [1, 3], atk: [1, 2], def: [0, 1], spd: [0, 1] },
    talents: talentIds(BASE_TALENTS.necromancer),
    advancedClasses: ['lich', 'plaguelord'],
    attackTarget: 'lowestHp',
    ability: {
      id: 'drain',
      name: 'Drain Life',
      description: 'Every 3rd turn: deal 150% ATK to the weakest enemy and heal self for 100% ATK.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'lowestHp', amount: { atk: 1.5 } },
        { kind: 'heal', target: 'self', amount: { atk: 1 } },
      ],
    },
    triggers: [
      {
        label: 'Dark Harvest',
        on: 'onAllyDeath',
        effects: [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }],
      },
    ],
  },
};

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
export const STARTER_CLASS_IDS = CLASS_IDS.filter((id) => !CLASSES[id].unlockable);

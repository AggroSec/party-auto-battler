// Classic Shaman (Milestone 14): the rules-mode Shaman (Brandon's design) as a
// classic class. It stacks afflictions on the most afflicted enemy; Hexcaller
// cashes them in as damage per affliction, Spiritbinder closes the lock
// (Frostbite, Weakness and Hush) and severs the soul outright. Unlocked by
// finishing The Hollowing. Its ids start with `c-` because the rules-mode
// Shaman already has the plain ones (rules ids must never shadow classic ones).
import type { ClassDef } from '../class-types.ts';
import { BRITTLE, FROSTBITE, HUSH, WEAKNESS } from '../rules-mode/statuses.ts';
import { advanced, on, talent, talentIds, trig } from './dsl.ts';

/** The status a Shaman effect puts on the most afflicted enemy (or another target). */
export const hex = (status: typeof FROSTBITE, target: 'mostAfflicted' | 'triggerTarget' | 'highestAtk' | 'allEnemies' | 'nearest' = 'mostAfflicted', stacks = 1) =>
  ({ kind: 'status', target, status, stacks }) as const;

/** Sever Soul's execution: Frostbite, Weakness and Hush together kill (bosses lose 25% max HP). */
export const SEVER = { kind: 'execute', target: 'mostAfflicted', requires: [FROSTBITE.id, WEAKNESS.id, HUSH.id], bossMaxHp: 0.25 } as const;

export const shamanTalents = [
  talent('c-shaman/cold-spirits', 'Cold Spirits', 'Start of combat: Frostbite on the enemy with the highest ATK.', trig(
    on('startOfCombat', 'Cold Spirits', [hex(FROSTBITE, 'highestAtk')]),
  )),
  talent('c-shaman/spirit-lash', 'Spirit Lash', '+30% ability power.', { abilityPower: 0.3 }),
  talent('c-shaman/ancestral-hide', 'Ancestral Hide', '+10 HP, +1 DEF.', { stats: { hp: 10, def: 1 } }),
  talent('c-shaman/withering-touch', 'Withering Touch', '30% on attack: Weakness on the target.', trig(
    on('onAttack', 'Withering Touch', [hex(WEAKNESS, 'triggerTarget')], { chance: 0.3 }),
  )),
];

export const hexcallerC = advanced({
  id: 'c-hexcaller',
  name: 'Hexcaller',
  baseClassId: 'c-shaman',
  description: 'Piles on afflictions, then rends the soul for damage per affliction.',
  tags: ['spirit', 'nature', 'occult'],
  ability: {
    id: 'c-soul-rend',
    name: 'Soul Rend',
    description: 'Every 3rd turn: Brittle on the most afflicted enemy (−3 DEF), then deal 60% ATK + 50% ATK per affliction on it.',
    cooldown: 3,
    effects: [hex(BRITTLE), { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.6 }, perAffliction: 0.5 }],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Lingering Hex', description: 'On attack: Frostbite on the target (−3 SPD for 4 turns).' },
  modifier: {
    stats: { hp: 6, atk: 3 },
    triggers: [on('onAttack', 'Lingering Hex', [hex(FROSTBITE, 'triggerTarget')])],
  },
  talents: [
    talent('c-hexcaller/malice', 'Malice', '+3 ATK.', { stats: { atk: 3 } }),
    talent('c-hexcaller/wither', 'Wither', 'After your ability, Weakness on the most afflicted enemy.', trig(
      on('onAbility', 'Wither', [hex(WEAKNESS)]),
    )),
    talent('c-hexcaller/hexweave', 'Hexweave', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    talent('c-hexcaller/spite', 'Spite', '+30% ability power.', { abilityPower: 0.3 }),
  ],
});

export const spiritbinderC = advanced({
  id: 'c-spiritbinder',
  name: 'Spiritbinder',
  baseClassId: 'c-shaman',
  description: 'Locks the victim with Frostbite, Weakness and Hush, then severs its soul.',
  tags: ['spirit', 'nature'],
  ability: {
    id: 'c-sever-soul',
    name: 'Sever Soul',
    description: 'Every 4th turn: Hush the most afflicted enemy (no abilities for 2 turns) and deal 40% ATK to it. If it also has Frostbite and Weakness, it dies outright (bosses lose 25% max HP).',
    cooldown: 4,
    effects: [hex(HUSH), { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.4 } }, SEVER],
  },
  statWeights: { hp: 4, atk: 3, def: 1, spd: 2 },
  passive: { name: 'Binding Frost', description: 'On attack: 50% chance of Frostbite, and 50% chance of Weakness, on the target.' },
  modifier: {
    stats: { hp: 10, atk: 1, spd: 1 },
    triggers: [
      on('onAttack', 'Binding Frost', [hex(FROSTBITE, 'triggerTarget')], { chance: 0.5 }),
      on('onAttack', 'Binding Frost', [hex(WEAKNESS, 'triggerTarget')], { chance: 0.5 }),
    ],
  },
  talents: [
    talent('c-spiritbinder/patience', 'Patient Spirits', '+12 HP.', { stats: { hp: 12 } }),
    talent('c-spiritbinder/cold-grip', 'Cold Grip', 'Start of combat: Frostbite and Weakness on the enemy with the highest ATK.', trig(
      on('startOfCombat', 'Cold Grip', [hex(FROSTBITE, 'highestAtk'), hex(WEAKNESS, 'highestAtk')]),
    )),
    talent('c-spiritbinder/swift-spirits', 'Swift Spirits', '+3 SPD.', { stats: { spd: 3 } }),
    talent('c-spiritbinder/soul-thief', 'Soul Thief', 'On kill, gain +2 ATK.', trig(
      on('onKill', 'Soul Thief', [{ kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } }]),
    )),
  ],
});

export const shamanClass: ClassDef = {
  id: 'c-shaman',
  name: 'Shaman',
  role: 'caster',
  tags: ['spirit', 'nature'],
  unlockable: true,
  look: 'shaman',
  description: 'Stacks afflictions on one enemy, then kills it: by damage per affliction, or by severing its soul.',
  baseStats: { hp: 28, atk: 6, def: 1, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  talents: talentIds(shamanTalents),
  advancedClasses: ['c-hexcaller', 'c-spiritbinder'],
  attackTarget: 'mostAfflicted',
  ability: {
    id: 'c-frost-hex',
    name: 'Frost Hex',
    description: 'Every 3rd turn: Frostbite and Weakness on the most afflicted enemy (−3 SPD and −3 ATK for 4 turns), then deal 50% ATK + 30% ATK per affliction on it.',
    cooldown: 3,
    effects: [hex(FROSTBITE), hex(WEAKNESS), { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.5 }, perAffliction: 0.3 }],
  },
  passive: { name: 'Spirit Sight', description: 'Start of combat: Weakness on the enemy with the highest ATK.' },
  triggers: [on('startOfCombat', 'Spirit Sight', [hex(WEAKNESS, 'highestAtk')])],
};

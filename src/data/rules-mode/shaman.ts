// Shaman (Brandon, rules mode): stacks afflictions into a lock, then kills.
// Hexcaller kills with damage per affliction (Imperian); Spiritbinder locks
// Frostbite, Weakness and Hush, then severs the soul outright (Achaea).
import { BIND, BRITTLE, FEVER, FROSTBITE, HUSH, MARKED, ROT, WEAKNESS } from './statuses.ts';
import { advancedTier, afflict, afflictions, allyBelow, baseClass, hit, lacks, rule, skill, tertiaryTier } from './dsl.ts';

const SPIRIT = ['spirit', 'nature'];

export const shaman = baseClass({
  id: 'shaman',
  name: 'Shaman',
  description: 'Builds afflictions into a lock, then finishes the victim.',
  tags: SPIRIT,
  role: 'caster',
  look: 'shaman',
  baseStats: { hp: 28, atk: 6, def: 1, spd: 9 },
  range: 'ranged',
  placement: 3,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  advancedClasses: ['hexcaller', 'spiritbinder'],
  skills: [
    skill('frost-hex', 'Frost Hex', 1, 'enemy', '40% ATK and Frostbite (−3 SPD).', [hit(0.4), afflict(FROSTBITE)]),
    skill('wither', 'Wither', 2, 'enemy', '40% ATK and Weakness (−3 ATK).', [hit(0.4), afflict(WEAKNESS)]),
    skill('spirit-lash', 'Spirit Lash', 2, 'enemy', '50% ATK + 30% ATK per affliction on the target.', [hit(0.5, { perAffliction: 0.3 })]),
  ],
  rules: [
    rule('spirit-lash', afflictions(3), 'mostAfflicted'),
    rule('frost-hex', lacks(FROSTBITE), 'mostAfflicted'),
    rule('wither', lacks(WEAKNESS), 'mostAfflicted'),
    rule('spirit-lash', undefined, 'mostAfflicted'),
  ],
});

export const hexcaller = advancedTier({
  id: 'hexcaller',
  name: 'Hexcaller',
  baseClassId: 'shaman',
  description: 'Piles on afflictions, then rends the soul for damage per affliction.',
  tags: SPIRIT,
  tertiaryClasses: ['doomspeaker', 'witch-doctor'],
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 3, hp: 6 } },
  skills: [
    skill('brittle-curse', 'Brittle Curse', 2, 'enemy', '40% ATK and Brittle (−3 DEF).', [hit(0.4), afflict(BRITTLE)]),
    skill('soul-rend', 'Soul Rend', 3, 'enemy', '60% ATK + 50% ATK per affliction on the target.', [hit(0.6, { perAffliction: 0.5 })]),
  ],
  rules: [rule('soul-rend', afflictions(4), 'mostAfflicted'), rule('brittle-curse', lacks(BRITTLE), 'mostAfflicted')],
});

export const spiritbinder = advancedTier({
  id: 'spiritbinder',
  name: 'Spiritbinder',
  baseClassId: 'shaman',
  description: 'Locks the victim with Frostbite, Weakness and Hush, then severs its soul.',
  tags: SPIRIT,
  tertiaryClasses: ['soulreaver', 'spirit-warden'],
  statWeights: { hp: 4, atk: 3, def: 1, spd: 2 },
  modifier: { stats: { hp: 8, spd: 1 } },
  skills: [
    skill('hush', 'Hush', 3, 'enemy', '30% ATK and Hush: no skills or abilities for 2 turns.', [hit(0.3), afflict(HUSH)]),
    skill('sever-soul', 'Sever Soul', 4, 'enemy', '40% ATK. If the target has Frostbite, Weakness and Hush, it dies outright (bosses lose 25% max HP).', [
      hit(0.4),
      { kind: 'execute', target: 'focus', requires: [FROSTBITE.id, WEAKNESS.id, HUSH.id], bossMaxHp: 0.25 },
    ]),
  ],
  rules: [
    rule('sever-soul', { kind: 'targetHas', status: HUSH.id }, 'mostAfflicted'),
    rule('hush', afflictions(2), 'mostAfflicted'),
  ],
});

export const doomspeaker = tertiaryTier({
  id: 'doomspeaker',
  name: 'Doomspeaker',
  baseClassId: 'shaman',
  advancedClassId: 'hexcaller',
  description: 'Doom for everyone: rot on the victim, and a cataclysm that scales with every enemy’s afflictions.',
  tags: SPIRIT,
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  modifier: { stats: { atk: 3, hp: 8 } },
  skills: [
    skill('rot-curse', 'Rot Curse', 2, 'enemy', '2 Rot (damage each turn, up to 3).', [afflict(ROT, 2)]),
    skill('cataclysm', 'Cataclysm', 4, null, 'Each enemy takes 30% ATK + 30% ATK per affliction on it.', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.3 }, perAffliction: 0.3 }]),
  ],
  rules: [rule('cataclysm', { kind: 'enemiesAtLeast', count: 3 }), rule('rot-curse', lacks(ROT), 'mostAfflicted')],
});

export const witchDoctor = tertiaryTier({
  id: 'witch-doctor',
  name: 'Witch Doctor',
  baseClassId: 'shaman',
  advancedClassId: 'hexcaller',
  description: 'Afflicts for the whole party: fevers stop healing, and hex totems mark every enemy.',
  tags: SPIRIT,
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  modifier: { stats: { hp: 12, atk: 1 } },
  skills: [
    skill('fever-curse', 'Fever Curse', 2, 'enemy', '30% ATK and Fever (heals on it are halved).', [hit(0.3), afflict(FEVER)]),
    skill('hex-totem', 'Hex Totem', 4, null, 'Every enemy is Marked: +25% damage taken for 3 turns.', [afflict(MARKED, 1, 'allEnemies')]),
  ],
  rules: [rule('hex-totem', lacks(MARKED)), rule('fever-curse', lacks(FEVER), 'mostAfflicted')],
});

export const soulreaver = tertiaryTier({
  id: 'soulreaver',
  name: 'Soulreaver',
  baseClassId: 'shaman',
  advancedClassId: 'spiritbinder',
  description: 'Chains the victim in place while the lock closes.',
  tags: SPIRIT,
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  modifier: { stats: { atk: 2, hp: 8, spd: 1 } },
  skills: [skill('spirit-chains', 'Spirit Chains', 4, 'enemy', '30% ATK and Bind: it loses its next turn.', [hit(0.3), afflict(BIND)])],
  rules: [rule('spirit-chains', afflictions(1), 'mostAfflicted')],
});

export const spiritWarden = tertiaryTier({
  id: 'spirit-warden',
  name: 'Spirit Warden',
  baseClassId: 'shaman',
  advancedClassId: 'spiritbinder',
  description: 'Locks enemies while the ancestors guard the party.',
  tags: SPIRIT,
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  modifier: { stats: { hp: 14, def: 1 } },
  skills: [
    skill('spirit-ward', 'Spirit Ward', 3, 'ally', 'Shield an ally for 120% ATK and remove one of its afflictions.', [
      { kind: 'shield', target: 'focus', amount: { atk: 1.2 } },
      { kind: 'cure', target: 'focus', count: 1 },
    ]),
  ],
  rules: [rule('spirit-ward', allyBelow(60))],
});

export const SHAMAN_TREE = [shaman, hexcaller, spiritbinder, doomspeaker, witchDoctor, soulreaver, spiritWarden];

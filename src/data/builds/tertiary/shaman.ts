// Classic Shaman tertiary classes (level 7): Hexcaller → Doomspeaker / Witch
// Doctor, Spiritbinder → Soulreaver / Spirit Warden. Ported from rules mode.
import { BIND, FEVER, FROSTBITE, HUSH, MARKED, ROT, WEAKNESS } from '../../rules-mode/statuses.ts';
import { hex, SEVER } from '../shaman.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const doomspeakerC = tertiary({
  id: 'c-doomspeaker',
  name: 'Doomspeaker',
  baseClassId: 'c-shaman',
  advancedClassId: 'c-hexcaller',
  description: 'Doom for everyone: rot on the victim, and a cataclysm that scales with every enemy’s afflictions.',
  tags: ['spirit', 'nature', 'occult'],
  ability: {
    id: 'c-cataclysm',
    name: 'Cataclysm',
    description: 'Every 4th turn: 2 Rot on the most afflicted enemy (30% ATK each turn), then every enemy takes 40% ATK + 35% ATK per affliction on it.',
    cooldown: 4,
    effects: [hex(ROT, 'mostAfflicted', 2), { kind: 'damage', target: 'allEnemies', amount: { atk: 0.4 }, perAffliction: 0.35 }],
  },
  statWeights: { hp: 3, atk: 5, def: 1, spd: 1 },
  passive: { name: 'Creeping Doom', description: 'On attack: Frostbite and 1 Rot on the target.' },
  modifier: {
    stats: { hp: 8, atk: 3 },
    triggers: [on('onAttack', 'Creeping Doom', [hex(FROSTBITE, 'triggerTarget'), hex(ROT, 'triggerTarget')])],
  },
  talents: [
    talent('c-doomspeaker/apocalypse', 'Apocalypse', '+30% ability power.', { abilityPower: 0.3 }),
    talent('c-doomspeaker/omen', 'Ill Omen', 'Start of combat: Weakness on every enemy.', trig(
      on('startOfCombat', 'Ill Omen', [hex(WEAKNESS, 'allEnemies')]),
    )),
    talent('c-doomspeaker/dread-voice', 'Dread Voice', '+4 ATK.', { stats: { atk: 4 } }),
    abilityTalent('c-doomspeaker/rot-curse', {
      id: 'c-rot-curse',
      name: 'Rot Curse',
      description: 'Every 3rd turn: 3 Rot on the enemy with the highest ATK.',
      cooldown: 3,
      effects: [hex(ROT, 'highestAtk', 3)],
    }),
  ],
});

export const witchDoctorC = tertiary({
  id: 'c-witch-doctor',
  name: 'Witch Doctor',
  baseClassId: 'c-shaman',
  advancedClassId: 'c-hexcaller',
  description: 'Afflicts for the whole party: fevers stop healing, and hex totems mark every enemy.',
  tags: ['spirit', 'nature', 'occult'],
  ability: {
    id: 'c-hex-totem',
    name: 'Hex Totem',
    description: 'Every 3rd turn: every enemy is Marked (+25% damage taken for 3 turns); the most afflicted takes 60% ATK and Fever (heals on it are halved).',
    cooldown: 3,
    effects: [
      hex(MARKED, 'allEnemies'),
      { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.6 } },
      hex(FEVER),
    ],
  },
  statWeights: { hp: 4, atk: 4, def: 1, spd: 1 },
  passive: { name: 'Juju', description: 'On attack: 40% chance of Weakness on the target.' },
  modifier: {
    stats: { hp: 10, atk: 2 },
    triggers: [on('onAttack', 'Juju', [hex(WEAKNESS, 'triggerTarget')], { chance: 0.4 })],
  },
  talents: [
    talent('c-witch-doctor/voodoo', 'Voodoo', '+30% ability power.', { abilityPower: 0.3 }),
    talent('c-witch-doctor/fetish', 'Fetish', 'Start of combat: Fever on every enemy.', trig(
      on('startOfCombat', 'Fetish', [hex(FEVER, 'allEnemies')]),
    )),
    talent('c-witch-doctor/mojo', 'Mojo', '+12 HP, +2 ATK.', { stats: { hp: 12, atk: 2 } }),
    abilityTalent('c-witch-doctor/spirit-lash', {
      id: 'c-spirit-lash',
      name: 'Spirit Lash',
      description: 'Every 3rd turn: deal 50% ATK + 40% ATK per affliction to the most afflicted enemy.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.5 }, perAffliction: 0.4 }],
    }),
  ],
});

export const soulreaverC = tertiary({
  id: 'c-soulreaver',
  name: 'Soulreaver',
  baseClassId: 'c-shaman',
  advancedClassId: 'c-spiritbinder',
  description: 'Chains the victim in place while the lock closes, then reaps it.',
  tags: ['spirit', 'nature'],
  ability: {
    id: 'c-soul-reap',
    name: 'Soul Reap',
    description: 'Every 4th turn: Bind the most afflicted enemy (it loses its next turn) and Hush it, deal 50% ATK, and if it also has Frostbite and Weakness it dies outright (bosses lose 25% max HP).',
    cooldown: 4,
    effects: [hex(BIND), hex(HUSH), { kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.5 } }, SEVER],
  },
  statWeights: { hp: 3, atk: 4, def: 1, spd: 2 },
  passive: { name: 'Frozen Chains', description: 'On attack: Frostbite and Weakness on the target.' },
  modifier: {
    stats: { hp: 8, atk: 2, spd: 1 },
    triggers: [on('onAttack', 'Frozen Chains', [hex(FROSTBITE, 'triggerTarget'), hex(WEAKNESS, 'triggerTarget')])],
  },
  talents: [
    talent('c-soulreaver/harvest', 'Soul Harvest', 'On kill, gain +2 ATK and +1 SPD.', trig(
      on('onKill', 'Soul Harvest', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'buff', target: 'self', stat: 'spd', amount: { flat: 1 } },
      ]),
    )),
    talent('c-soulreaver/reaping', 'Reaping Hour', 'Ability cooldown −1.', { abilityCooldown: -1 }),
    talent('c-soulreaver/wraith-step', 'Wraith Step', '+3 SPD, +8 HP.', { stats: { spd: 3, hp: 8 } }),
    abilityTalent('c-soulreaver/spirit-chains', {
      id: 'c-spirit-chains',
      name: 'Spirit Chains',
      description: 'Every 3rd turn: Bind the enemy with the highest ATK.',
      cooldown: 3,
      effects: [hex(BIND, 'highestAtk')],
    }),
  ],
});

export const spiritWardenC = tertiary({
  id: 'c-spirit-warden',
  name: 'Spirit Warden',
  baseClassId: 'c-shaman',
  advancedClassId: 'c-spiritbinder',
  description: 'Locks enemies while the ancestors guard the party.',
  tags: ['spirit', 'nature', 'guardian'],
  ability: {
    id: 'c-spirit-ward',
    name: 'Spirit Ward',
    description: 'Every 3rd turn: shield the most wounded ally for 120% ATK and remove an affliction from every ally; Hush the most afflicted enemy.',
    cooldown: 3,
    effects: [
      { kind: 'shield', target: 'lowestHpAlly', amount: { atk: 1.2 } },
      { kind: 'cure', target: 'allAllies', count: 1 },
      hex(HUSH),
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Ancestral Lock', description: 'On attack: 50% chance of Frostbite, and 50% chance of Weakness, on the target.' },
  modifier: {
    stats: { hp: 14, def: 1 },
    triggers: [
      on('onAttack', 'Ancestral Lock', [hex(FROSTBITE, 'triggerTarget')], { chance: 0.5 }),
      on('onAttack', 'Ancestral Lock', [hex(WEAKNESS, 'triggerTarget')], { chance: 0.5 }),
    ],
  },
  talents: [
    talent('c-spirit-warden/totem-guard', 'Totem Guard', 'Start of combat: shield all allies for 60% ATK.', trig(
      on('startOfCombat', 'Totem Guard', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } }]),
    )),
    talent('c-spirit-warden/elders', 'Council of Elders', '+30% ability power.', { abilityPower: 0.3 }),
    talent('c-spirit-warden/bulwark', 'Spirit Bulwark', '+14 HP, +1 DEF.', { stats: { hp: 14, def: 1 } }),
    abilityTalent('c-spirit-warden/sever-soul', {
      id: 'c-warden-sever',
      name: 'Sever Soul',
      description: 'Every 4th turn: deal 40% ATK to the most afflicted enemy; if it has Frostbite, Weakness and Hush, it dies outright (bosses lose 25% max HP).',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'mostAfflicted', amount: { atk: 0.4 } }, SEVER],
    }),
  ],
});

export const SHAMAN_TERTIARY = [doomspeakerC, witchDoctorC, soulreaverC, spiritWardenC];

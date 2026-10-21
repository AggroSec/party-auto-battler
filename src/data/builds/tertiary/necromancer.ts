// Necromancer tertiary classes (level 7): Lich → Archlich / Soul Reaper, Plaguelord → Blightlord / Rotcaller.
import type { SummonDef } from '../../../engine/types.ts';
import { abilityTalent, on, talent, tertiary, trig } from '../dsl.ts';

export const archlich = tertiary({
  id: 'archlich',
  name: 'Archlich',
  baseClassId: 'necromancer',
  advancedClassId: 'lich',
  description: 'Ancient undead sorcerer: waves of death that sustain it.',
  tags: ['arcane', 'shadow'],
  ability: {
    id: 'death-wave',
    name: 'Death Wave',
    description: 'Every 3rd turn: deal 120% ATK to every enemy and heal yourself for 150% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 1.2 } },
      { kind: 'heal', target: 'self', amount: { atk: 1.5 } },
    ],
  },
  passive: { name: 'Phylactery', description: 'When bloodied, shield yourself for 60% of max HP.' },
  modifier: {
    stats: { hp: 10, atk: 3 },
    triggers: [on('onBloodied', 'Phylactery', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.6 } }])],
  },
  talents: [
    talent('archlich/dark-mastery', 'Dark Mastery', '+35% ability power.', { abilityPower: 0.35 }),
    talent('archlich/frost-aura', 'Frost Aura', 'Start of combat: every enemy loses 1 SPD.', trig(
      on('startOfCombat', 'Frost Aura', [{ kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('archlich/bone-shield', 'Bone Shield', 'Start of combat: shield yourself for 250% ATK.', trig(
      on('startOfCombat', 'Bone Shield', [{ kind: 'shield', target: 'self', amount: { atk: 2.5 } }]),
    )),
    abilityTalent('archlich/frost-nova', {
      id: 'frost-nova',
      name: 'Frost Nova',
      description: 'Every 4th turn: deal 80% ATK to every enemy; they lose 1 SPD.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.8 } },
        { kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } },
      ],
    }),
  ],
});

export const soulReaper = tertiary({
  id: 'soul-reaper',
  name: 'Soul Reaper',
  baseClassId: 'necromancer',
  advancedClassId: 'lich',
  description: 'Harvests the weak: each kill makes it stronger and faster.',
  tags: ['shadow'],
  ability: {
    id: 'reap',
    name: 'Reap',
    description: 'Every 3rd turn: deal 280% ATK to the weakest enemy and heal yourself for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'lowestHp', amount: { atk: 2.8 } },
      { kind: 'heal', target: 'self', amount: { atk: 1 } },
    ],
  },
  statWeights: { hp: 2, atk: 5, def: 1, spd: 2 },
  passive: { name: 'Harvest', description: 'On kill, gain +2 ATK and your next ability comes 1 turn sooner.' },
  modifier: {
    stats: { hp: 8, atk: 3, spd: 1 },
    triggers: [
      on('onKill', 'Harvest', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'cooldown', target: 'self', turns: -1 },
      ]),
    ],
  },
  talents: [
    talent('soul-reaper/scythe', 'Spectral Scythe', '+35% ability power.', { abilityPower: 0.35 }),
    talent('soul-reaper/haunt', 'Haunt', 'When an ally dies, every enemy loses 1 DEF.', trig(
      on('onAllyDeath', 'Haunt', [{ kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('soul-reaper/deathless', 'Deathless', 'When bloodied, heal 40% of max HP.', trig(
      on('onBloodied', 'Deathless', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.4 } }]),
    )),
    abilityTalent('soul-reaper/wail', {
      id: 'banshee-wail',
      name: 'Banshee Wail',
      description: 'Every 4th turn: every enemy loses 2 ATK and takes 50% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 2 } },
        { kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } },
      ],
    }),
  ],
});

export const blightlord = tertiary({
  id: 'blightlord',
  name: 'Blightlord',
  baseClassId: 'necromancer',
  advancedClassId: 'plaguelord',
  description: 'Spreads a rot that eats armour and strength alike.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'pandemic',
    name: 'Pandemic',
    description: 'Every 3rd turn: every enemy loses 2 ATK and 2 DEF and takes 60% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 2 } },
      { kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 2 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.6 } },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 2, spd: 1 },
  passive: { name: 'Plague Cloud', description: 'Start of combat: every enemy loses 1 ATK.' },
  modifier: {
    stats: { hp: 12, atk: 2, def: 1 },
    triggers: [on('startOfCombat', 'Plague Cloud', [{ kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } }])],
  },
  talents: [
    talent('blightlord/potency', 'Potency', '+35% ability power.', { abilityPower: 0.35 }),
    talent('blightlord/carrier', 'Carrier', 'When hurt, the attacker loses 1 ATK (up to 6 times per fight).', trig(
      on('onHurt', 'Carrier', [{ kind: 'debuff', target: 'triggerSource', stat: 'atk', amount: { flat: 1 } }], { limit: 6 }),
    )),
    talent('blightlord/festering', 'Festering', 'When an ally dies, every enemy takes 100% ATK.', trig(
      on('onAllyDeath', 'Festering', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 1 } }]),
    )),
    abilityTalent('blightlord/corpse-explosion', {
      id: 'corpse-explosion',
      name: 'Corpse Explosion',
      description: 'Every 4th turn: deal 150% ATK to the weakest enemy (100% splash).',
      cooldown: 4,
      effects: [{ kind: 'damage', target: 'lowestHp', amount: { atk: 1.5 }, splash: 1 }],
    }),
  ],
});

const ghoul: SummonDef = {
  name: 'Ghoul',
  classId: 'ghoul',
  hp: { maxHp: 0.6 },
  atk: { atk: 0.9 },
  def: 1,
  spd: 11,
  range: 'melee',
  attackTarget: 'nearest',
  row: 'front',
};

export const rotcaller = tertiary({
  id: 'rotcaller',
  name: 'Rotcaller',
  baseClassId: 'necromancer',
  advancedClassId: 'plaguelord',
  description: 'Raises ghouls from the rot to swarm the front line.',
  tags: ['shadow', 'occult'],
  ability: {
    id: 'raise-ghoul',
    name: 'Raise Ghoul',
    description: 'Every 3rd turn (first on turn 1): summon a Ghoul in an empty slot (60% of your max HP, 90% ATK). If the board is full, every enemy loses 1 ATK and takes 70% ATK instead.',
    cooldown: 3,
    initialCooldown: 1,
    effects: [
      {
        kind: 'summon',
        summon: ghoul,
        fallback: [
          { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } },
          { kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } },
        ],
      },
    ],
  },
  statWeights: { hp: 4, atk: 3, def: 1, spd: 2 },
  passive: { name: 'Grave Pact', description: 'When an ally dies, gain +2 ATK and heal 10% of max HP.' },
  modifier: {
    stats: { hp: 12, atk: 2 },
    triggers: [
      on('onAllyDeath', 'Grave Pact', [
        { kind: 'buff', target: 'self', stat: 'atk', amount: { flat: 2 } },
        { kind: 'heal', target: 'self', amount: { maxHp: 0.1 } },
      ]),
    ],
  },
  talents: [
    talent('rotcaller/unholy-strength', 'Unholy Strength', '+40% ability power (stronger ghouls).', { abilityPower: 0.4 }),
    talent('rotcaller/graveyard', 'Graveyard', 'Start of combat: shield all allies for 6.', trig(
      on('startOfCombat', 'Graveyard', [{ kind: 'shield', target: 'allAllies', amount: { flat: 6 } }]),
    )),
    talent('rotcaller/necrosis', 'Necrosis', 'When an ally dies, the strongest enemy loses 2 ATK.', trig(
      on('onAllyDeath', 'Necrosis', [{ kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 2 } }]),
    )),
    abilityTalent('rotcaller/death-coil', {
      id: 'death-coil',
      name: 'Death Coil',
      description: 'Every 4th turn: deal 180% ATK to the nearest enemy and heal the most wounded ally for 120% ATK.',
      cooldown: 4,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 1.8 } },
        { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 1.2 } },
      ],
    }),
  ],
});

export const NECROMANCER_TERTIARY = [archlich, soulReaper, blightlord, rotcaller];

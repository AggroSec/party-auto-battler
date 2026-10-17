import { advanced, on, talent, trig } from './dsl.ts';

export const necromancerTalents = [
  talent('necromancer/siphon', 'Soul Siphon', '+20% lifesteal.', { lifesteal: 0.2 }),
  talent('necromancer/bone-armor', 'Bone Armor', 'Start of combat: shield yourself for 200% ATK.', trig(
    on('startOfCombat', 'Bone Armor', [{ kind: 'shield', target: 'self', amount: { atk: 2 } }]),
  )),
  talent('necromancer/corpse-explosion', 'Corpse Explosion', 'When an ally falls, deal 50% ATK to every enemy.', trig(
    on('onAllyDeath', 'Corpse Explosion', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } }]),
  )),
  talent('necromancer/weakness', 'Curse of Weakness', 'After casting, the strongest enemy loses 2 ATK.', trig(
    on('onAbility', 'Curse of Weakness', [{ kind: 'debuff', target: 'highestAtk', stat: 'atk', amount: { flat: 2 } }]),
  )),
];

export const lich = advanced({
  id: 'lich',
  name: 'Lich',
  baseClassId: 'necromancer',
  description: 'Undead archmage whose nova drains the whole enemy party.',
  tags: ['arcane', 'shadow'],
  ability: {
    id: 'death-nova',
    name: 'Death Nova',
    description: 'Every 3rd turn: deal 90% ATK to every enemy and heal yourself for 100% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.9 } },
      { kind: 'heal', target: 'self', amount: { atk: 1 } },
    ],
  },
  modifier: {
    stats: { atk: 2, hp: 4 },
    triggers: [on('onKill', 'Soul Harvest', [{ kind: 'heal', target: 'self', amount: { atk: 2 } }])],
  },
  talents: [
    talent('lich/necrotic-power', 'Necrotic Power', '+40% ability power.', { abilityPower: 0.4 }),
    talent('lich/frost-armor', 'Frost Armor', 'Start of combat: shield yourself for 30% of max HP.', trig(
      on('startOfCombat', 'Frost Armor', [{ kind: 'shield', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    talent('lich/undying', 'Undying', 'The first time you drop below 50% HP, heal 30% of max HP.', trig(
      on('onBloodied', 'Undying', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.3 } }]),
    )),
    talent('lich/dark-pact', 'Dark Pact', 'Ability cooldown −1.', { abilityCooldown: -1 }),
  ],
});

export const plaguelord = advanced({
  id: 'plaguelord',
  name: 'Plaguelord',
  baseClassId: 'necromancer',
  description: 'Spreads rot that weakens the entire enemy party.',
  tags: ['shadow'],
  ability: {
    id: 'plague',
    name: 'Plague',
    description: 'Every 3rd turn: every enemy loses 1 ATK and 1 DEF and takes 50% ATK.',
    cooldown: 3,
    effects: [
      { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } },
      { kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } },
      { kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } },
    ],
  },
  modifier: {
    stats: { hp: 6, def: 1 },
    triggers: [on('onAllyDeath', 'Pestilence', [{ kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } }])],
  },
  talents: [
    talent('plaguelord/virulence', 'Virulence', '+40% ability power.', { abilityPower: 0.4 }),
    talent('plaguelord/contagion', 'Contagion', 'On kill, every enemy loses 1 DEF.', trig(
      on('onKill', 'Contagion', [{ kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } }]),
    )),
    talent('plaguelord/rot', 'Rot', 'Basic attacks strip 1 SPD from the target.', trig(
      on('onAttack', 'Rot', [{ kind: 'debuff', target: 'triggerTarget', stat: 'spd', amount: { flat: 1 } }]),
    )),
    talent('plaguelord/miasma', 'Miasma', 'Start of combat: every enemy loses 1 SPD.', trig(
      on('startOfCombat', 'Miasma', [{ kind: 'debuff', target: 'allEnemies', stat: 'spd', amount: { flat: 1 } }]),
    )),
  ],
});

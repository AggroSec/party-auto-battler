// Signature items (M7) for the Bard's tertiary classes.
import { mirrorImage } from '../builds/tertiary/bard.ts';
import { on, signature } from '../builds/dsl.ts';

export const BARD_SIGNATURES = [
  signature('warchanter', 'warhorn', 'Warhorn', 'Start of combat: all allies gain +1 ATK and +1 SPD. When an ally dies, all allies gain +1 SPD.', {
    triggers: [
      on('startOfCombat', 'Warhorn', [
        { kind: 'buff', target: 'allAllies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } },
      ]),
      on('onAllyDeath', 'Warhorn', [{ kind: 'buff', target: 'allAllies', stat: 'spd', amount: { flat: 1 } }]),
    ],
  }),
  signature('lorekeeper', 'tome-of-sagas', 'Tome of Sagas', 'Start of combat: all allies gain +1 DEF. When an ally dies, heal all allies for 150% ATK.', {
    triggers: [
      on('startOfCombat', 'Tome of Sagas', [{ kind: 'buff', target: 'allAllies', stat: 'def', amount: { flat: 1 } }]),
      on('onAllyDeath', 'Tome of Sagas', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1.5 } }]),
    ],
  }),
  signature(
    'illusionist',
    'hall-of-mirrors',
    'Hall of Mirrors',
    'When bloodied, summon a Mirror Image in an empty slot. When an ally falls, summon another (once per fight).',
    {
      triggers: [
        on('onBloodied', 'Hall of Mirrors', [{ kind: 'summon', summon: mirrorImage }]),
        on('onAllyDeath', 'Hall of Mirrors', [{ kind: 'summon', summon: mirrorImage }], { limit: 1 }),
      ],
    },
    8,
  ),
  signature('harlequin', 'jesters-bells', "Jester's Bells", "+20% ability power. On kill, every enemy's ability comes 1 turn later.", {
    abilityPower: 0.2,
    triggers: [on('onKill', "Jester's Bells", [{ kind: 'cooldown', target: 'allEnemies', turns: 1 }])],
  }),
];

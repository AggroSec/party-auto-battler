// Signature items (M7) for the Warlock's tertiary classes.
import { fiend } from '../builds/tertiary/warlock.ts';
import { on, signature } from '../builds/dsl.ts';

export const WARLOCK_SIGNATURES = [
  signature('doombringer', 'blood-moon-idol', 'Blood Moon Idol', '+15% lifesteal. After casting, heal 10% of your max HP.', {
    lifesteal: 0.15,
    triggers: [on('onAbility', 'Blood Moon Idol', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.1 } }])],
  }),
  signature('curseweaver', 'black-grimoire', 'Black Grimoire', '+20% ability power. Start of combat: every enemy loses 1 ATK and 1 DEF.', {
    abilityPower: 0.2,
    triggers: [
      on('startOfCombat', 'Black Grimoire', [
        { kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } },
        { kind: 'debuff', target: 'allEnemies', stat: 'def', amount: { flat: 1 } },
      ]),
    ],
  }),
  signature(
    'pit-lord',
    'hellforge-collar',
    'Hellforge Collar',
    'When an ally falls, summon a Fiend in an empty slot (up to 2 times per fight).',
    { triggers: [on('onAllyDeath', 'Hellforge Collar', [{ kind: 'summon', summon: fiend }], { limit: 2 })] },
    8,
  ),
  signature('soulbinder', 'soul-gem', 'Soul Gem', 'On kill or when an ally dies, shield all allies for 60% ATK.', {
    triggers: [
      on('onKill', 'Soul Gem', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } }]),
      on('onAllyDeath', 'Soul Gem', [{ kind: 'shield', target: 'allAllies', amount: { atk: 0.6 } }]),
    ],
  }),
];

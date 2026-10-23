// Signature items (M7) for the Druid's tertiary classes.
import { ancient } from '../builds/tertiary/druid.ts';
import { on, signature } from '../builds/dsl.ts';

export const DRUID_SIGNATURES = [
  signature('elder-bear', 'ursine-totem', 'Ursine Totem', '+3 DEF. 30% when hurt: heal 6% of your max HP.', {
    stats: { def: 3 },
    triggers: [on('onHurt', 'Ursine Totem', [{ kind: 'heal', target: 'self', amount: { maxHp: 0.06 } }], { chance: 0.3 })],
  }),
  signature('wildstalker', 'moonfang-claws', 'Moonfang Claws', '+2 ATK, +2 SPD. On kill, deal 150% ATK to the weakest enemy.', {
    stats: { atk: 2, spd: 2 },
    triggers: [on('onKill', 'Moonfang Claws', [{ kind: 'damage', target: 'lowestHp', amount: { atk: 1.5 } }])],
  }),
  signature(
    'archdruid',
    'seed-of-renewal',
    'Seed of Renewal',
    '+20% ability power. Start of combat: shield all allies for 150% ATK. When an ally dies, heal all allies for 100% ATK.',
    {
      abilityPower: 0.2,
      triggers: [
        on('startOfCombat', 'Seed of Renewal', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1.5 } }]),
        on('onAllyDeath', 'Seed of Renewal', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }]),
      ],
    },
    8,
  ),
  signature('treelord', 'heartwood-staff', 'Heartwood Staff', '+20% ability power. When an ally falls, summon an Ancient in an empty slot (up to 2 times per fight).', {
    abilityPower: 0.2,
    triggers: [on('onAllyDeath', 'Heartwood Staff', [{ kind: 'summon', summon: ancient }], { limit: 2 })],
  }),
];

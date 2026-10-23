// Signature items (M7) for the Mage's tertiary classes.
import { on, signature } from '../builds/dsl.ts';

export const MAGE_SIGNATURES = [
  signature(
    'firelord',
    'ember-crown',
    'Ember Crown',
    'Wildfire spreads: when an ally gets a kill, deal 50% ATK to every enemy.',
    { triggers: [on('onAllyKill', 'Ember Crown', [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.5 } }])] },
    8,
  ),
  signature(
    'phoenix',
    'ashen-heart',
    'Ashen Heart',
    'The first time you would fall, rise again at 40% HP and heal all allies for 100% ATK.',
    { revive: 0.4, triggers: [on('onRevive', 'Ashen Heart', [{ kind: 'heal', target: 'allAllies', amount: { atk: 1 } }])] },
    8,
  ),
  signature(
    'chronarch',
    'paradox-engine',
    'Paradox Engine',
    "Start of combat: every ally's first ability comes 1 turn sooner.",
    { triggers: [on('startOfCombat', 'Paradox Engine', [{ kind: 'cooldown', target: 'allAllies', turns: -1 }])] },
    8,
  ),
  signature('entropist', 'hourglass-of-ruin', 'Hourglass of Ruin', '+20% ability power. After casting, every enemy loses 1 ATK.', {
    abilityPower: 0.2,
    triggers: [on('onAbility', 'Hourglass of Ruin', [{ kind: 'debuff', target: 'allEnemies', stat: 'atk', amount: { flat: 1 } }])],
  }),
];

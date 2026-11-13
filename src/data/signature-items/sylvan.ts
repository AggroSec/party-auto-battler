// Signature items (Milestone 14) for the Sylvan's tertiary classes.
import { on, signature } from '../builds/dsl.ts';
import { GREATER_RENEWAL, RENEWAL, ROOTED, THORNS } from '../statuses.ts';

export const SYLVAN_SIGNATURES = [
  signature('lifebinder', 'heartseed', 'Heartseed', '+8 HP. Start of combat: give every ally Renewal.', {
    stats: { hp: 8 },
    triggers: [on('startOfCombat', 'Heartseed', [{ kind: 'status', target: 'allAllies', status: RENEWAL, stacks: 1 }])],
  }),
  signature('bloomcaller', 'everbloom-garland', 'Everbloom Garland', '+20% ability power. When bloodied, give every ally Greater Renewal.', {
    abilityPower: 0.2,
    triggers: [on('onBloodied', 'Everbloom Garland', [{ kind: 'status', target: 'allAllies', status: GREATER_RENEWAL, stacks: 1 }])],
  }),
  signature('briarheart', 'bramble-crown', 'Bramble Crown', '+3 DEF. Start of combat: Thorns on every ally.', {
    stats: { def: 3 },
    triggers: [on('startOfCombat', 'Bramble Crown', [{ kind: 'status', target: 'allAllies', status: THORNS, stacks: 1 }])],
  }),
  signature('rootwarden', 'ironroot-staff', 'Ironroot Staff', '+2 ATK. Start of combat: Root every enemy (−3 SPD for 2 turns).', {
    stats: { atk: 2 },
    triggers: [on('startOfCombat', 'Ironroot Staff', [{ kind: 'status', target: 'allEnemies', status: ROOTED, stacks: 1 }])],
  }),
];

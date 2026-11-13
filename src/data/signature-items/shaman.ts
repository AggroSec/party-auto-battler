// Signature items (Milestone 14) for the classic Shaman's tertiary classes.
import { on, signature } from '../builds/dsl.ts';
import { BIND, ROT, WEAKNESS } from '../rules-mode/statuses.ts';

export const SHAMAN_SIGNATURES = [
  signature('c-doomspeaker', 'skull-of-ruin', 'Skull of Ruin', '+2 ATK. Start of combat: 2 Rot on the enemy with the highest ATK.', {
    stats: { atk: 2 },
    triggers: [on('startOfCombat', 'Skull of Ruin', [{ kind: 'status', target: 'highestAtk', status: ROT, stacks: 2 }])],
  }),
  signature('c-witch-doctor', 'juju-pouch', 'Juju Pouch', '+25% ability power. Start of combat: Weakness on the enemy with the highest ATK.', {
    abilityPower: 0.25,
    triggers: [on('startOfCombat', 'Juju Pouch', [{ kind: 'status', target: 'highestAtk', status: WEAKNESS, stacks: 1 }])],
  }),
  // Brandon's Soulshackle idea, classic version: a Bound victim can't defend itself.
  signature('c-soulreaver', 'chain-of-souls', 'Chain of Souls', 'Your Sever Soul and Soul Reap kill a Bound enemy outright, without the full lock (bosses still lose 25% max HP).', {
    executeWith: [BIND.id],
  }),
  signature('c-spirit-warden', 'spirit-drum', 'Spirit Drum', '+10 HP. When an ally falls, shield every ally for 100% ATK.', {
    stats: { hp: 10 },
    triggers: [on('onAllyDeath', 'Spirit Drum', [{ kind: 'shield', target: 'allAllies', amount: { atk: 1 } }])],
  }),
];

// Signature items (after M9) for the Adventurer's tertiary classes.
import { signature } from '../builds/dsl.ts';

export const ADVENTURER_SIGNATURES = [
  signature('master-of-none', 'odds-and-ends', 'Bag of Odds and Ends', '+6 HP, +1 ATK, +1 DEF, +1 SPD.', { stats: { hp: 6, atk: 1, def: 1, spd: 1 } }),
  signature('master-of-one', 'trusty-tool', 'Trusty Old Tool', '+4 ATK, +10% ability power.', { stats: { atk: 4 }, abilityPower: 0.1 }),
  signature('polymath', 'dog-eared-notebook', 'Dog-Eared Notebook', '+1 SPD, +20% ability power.', { stats: { spd: 1 }, abilityPower: 0.2 }),
  signature('savant', 'unfinished-thesis', 'Unfinished Thesis', '+30% ability power.', { abilityPower: 0.3 }),
];

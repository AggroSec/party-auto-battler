// Signature items for rules mode's tertiary classes (Milestone 13). Like the
// classic ones (M7): only that class can equip one, a unit is offered it once
// on reaching the class, and it holds at most one copy.
import type { ItemDef } from '../../engine/run/content-types.ts';
import { on, signature } from '../builds/dsl.ts';
import {
  ANATHEMA, BIND, BLEED, BLESSED, BRITTLE, BURN, DEFILED, ENRAGED, FEVER, FORSAKEN, GREATER_RENEWAL, GRUDGE, HASTED, HUSH, IRONCLAD, POISON,
  PROFANE_ANATHEMA, RENEWAL, ROOTED, ROT, RUNE_MARK, SLOWED, THORNS,
} from './statuses.ts';

const startAfflict = (label: string, status: typeof POISON, target: 'allEnemies' | 'enemyFrontRow' | 'highestAtk' = 'allEnemies') =>
  on('startOfCombat', label, [{ kind: 'status', target, status, stacks: 1 }]);

const WARRIOR = [
  signature('bulwark', 'bastion-standard', 'Bastion Standard', '+2 DEF. Start of combat: shield every ally for 100% DEF.', {
    stats: { def: 2 },
    triggers: [on('startOfCombat', 'Bastion Standard', [{ kind: 'shield', target: 'allAllies', amount: { def: 1 } }])],
  }),
  signature('warden', 'shackle-flail', 'Shackle Flail', '+4 DEF. Shield Bash’s cooldown is 1 turn shorter.', { stats: { def: 4 }, skillCooldown: { 'shield-bash': -1 } }),
  signature('reaver', 'serrated-cleaver', 'Serrated Cleaver', 'On kill: 2 Bleed on every enemy.', {
    triggers: [on('onKill', 'Serrated Cleaver', [{ kind: 'status', target: 'allEnemies', status: BLEED, stacks: 2 }])],
  }),
  signature('slayer', 'headsmans-greataxe', 'Headsman’s Greataxe', '+2 ATK. +50% damage to enemies below half HP.', { stats: { atk: 2 }, executeBonus: 0.5 }),
];

const CLERIC = [
  signature('r-oracle', 'seers-lens', 'Seer’s Lens', 'After each skill, shield the most wounded ally for 40% ATK.', {
    triggers: [on('onAbility', 'Seer’s Lens', [{ kind: 'shield', target: 'lowestHpAlly', amount: { atk: 0.4 } }])],
  }),
  signature('saint', 'halo-of-mercy', 'Halo of Mercy', 'Miracle has +40% power. When bloodied, you’re Blessed (can’t drop below 1 HP for 2 turns).', {
    skillPower: { miracle: 0.4 },
    triggers: [on('onBloodied', 'Halo of Mercy', [{ kind: 'status', target: 'self', status: BLESSED, stacks: 1 }])],
  }),
  signature('r-zealot', 'censer-of-wrath', 'Censer of Wrath', '+2 ATK. On kill, every skill comes a turn sooner.', {
    stats: { atk: 2 },
    triggers: [on('onKill', 'Censer of Wrath', [{ kind: 'cooldown', target: 'self', turns: -1 }])],
  }),
  signature('r-templar', 'seal-of-silence', 'Seal of Silence', '+2 DEF. Start of combat: Hush the enemy with the highest ATK (no skills or abilities for 2 turns).', {
    stats: { def: 2 },
    triggers: [startAfflict('Seal of Silence', HUSH, 'highestAtk')],
  }),
];

const ROGUE = [
  signature('r-nightblade', 'umbral-fang', 'Umbral Fang', '+15% critical hit chance. Shadowstrike has +30% power.', { critChance: 0.15, skillPower: { shadowstrike: 0.3 } }),
  signature('phantom', 'mirage-veil', 'Mirage Veil', 'When bloodied, you’re Hasted (+4 SPD for 3 turns) and shield yourself for 100% ATK.', {
    triggers: [
      on('onBloodied', 'Mirage Veil', [
        { kind: 'status', target: 'self', status: HASTED, stacks: 1 },
        { kind: 'shield', target: 'self', amount: { atk: 1 } },
      ]),
    ],
  }),
  signature('plaguebringer', 'pestilent-thurible', 'Pestilent Thurible', 'Start of combat: Poison every enemy in the front row.', { triggers: [startAfflict('Pestilent Thurible', POISON, 'enemyFrontRow')] }),
  signature('envenomer', 'viper-fang', 'Viper Fang', '+2 ATK and +20% lifesteal.', { stats: { atk: 2 }, lifesteal: 0.2 }),
];

const MAGE = [
  signature('flamecaller', 'meteor-core', 'Meteor Core', 'Meteor’s cooldown is 1 turn shorter, and it has +20% power.', {
    skillCooldown: { meteor: -1 },
    skillPower: { meteor: 0.2 },
  }),
  signature('ashbringer', 'cinder-crown', 'Cinder Crown', 'Start of combat: Burn the enemy with the highest ATK.', { triggers: [startAfflict('Cinder Crown', BURN, 'highestAtk')] }),
  signature('timeweaver', 'chrono-gear', 'Chrono Gear', 'Start of combat: every ally is Hasted (+4 SPD for 3 turns).', {
    triggers: [on('startOfCombat', 'Chrono Gear', [{ kind: 'status', target: 'allAllies', status: HASTED, stacks: 1 }])],
  }),
  signature('riftmage', 'rift-prism', 'Rift Prism', '+1 SPD. Start of combat: Slow the enemy with the highest ATK (−4 SPD for 3 turns).', {
    stats: { spd: 1 },
    triggers: [startAfflict('Rift Prism', SLOWED, 'highestAtk')],
  }),
];

const RUNEBLADE = [
  signature('r-stormblade', 'storm-sigil', 'Storm Sigil', '+2 SPD. Chain Lightning has +30% power.', { stats: { spd: 2 }, skillPower: { 'chain-lightning': 0.3 } }),
  signature('blademaster', 'twin-edged-hilt', 'Twin-Edged Hilt', '+2 ATK and +15% critical hit chance.', { stats: { atk: 2 }, critChance: 0.15 }),
  signature('runelord', 'runic-codex', 'Runic Codex', 'Start of combat: a Rune on every enemy.', { triggers: [startAfflict('Runic Codex', RUNE_MARK)] }),
  signature('r-spellbreaker', 'null-blade', 'Null Blade', 'Nullify has +30% power. Start of combat: Brittle on the enemy with the highest ATK (−3 DEF).', {
    skillPower: { nullify: 0.3 },
    triggers: [startAfflict('Null Blade', BRITTLE, 'highestAtk')],
  }),
];

const SHAMAN = [
  signature('doomspeaker', 'doom-idol', 'Doom Idol', 'Start of combat: 2 Rot on the enemy with the highest ATK.', {
    triggers: [on('startOfCombat', 'Doom Idol', [{ kind: 'status', target: 'highestAtk', status: ROT, stacks: 2 }])],
  }),
  signature('witch-doctor', 'fever-fetish', 'Fever Fetish', '+2 ATK. Start of combat: Fever on every enemy (heals on them are halved).', {
    stats: { atk: 2 },
    triggers: [startAfflict('Fever Fetish', FEVER)],
  }),
  // Brandon's idea: a Bound victim can't defend itself, so the lock is already closed.
  signature(
    'soulreaver',
    'soulshackle-totem',
    'Soulshackle Totem',
    'Sever Soul kills a Bound enemy outright, without Frostbite, Weakness and Hush (bosses still lose 25% max HP).',
    { executeWith: [BIND.id] },
  ),
  signature('spirit-warden', 'ancestor-totem', 'Ancestor Totem', 'When an ally falls, shield every ally for 100% ATK and remove an affliction from each.', {
    triggers: [
      on('onAllyDeath', 'Ancestor Totem', [
        { kind: 'shield', target: 'allAllies', amount: { atk: 1 } },
        { kind: 'cure', target: 'allAllies', count: 1 },
      ]),
    ],
  }),
];

// Milestone 15: the story classes.
const SYLVAN = [
  signature('r-lifebinder', 'wellspring-seed', 'Wellspring Seed', '+8 HP. Start of combat: Renewal on every ally.', {
    stats: { hp: 8 },
    triggers: [on('startOfCombat', 'Wellspring Seed', [{ kind: 'status', target: 'allAllies', status: RENEWAL, stacks: 1 }])],
  }),
  signature('r-bloomcaller', 'spring-garland', 'Spring Garland', '+20% ability power. When bloodied, Greater Renewal on every ally.', {
    abilityPower: 0.2,
    triggers: [on('onBloodied', 'Spring Garland', [{ kind: 'status', target: 'allAllies', status: GREATER_RENEWAL, stacks: 1 }])],
  }),
  signature('r-briarheart', 'thicket-crown', 'Thicket Crown', '+3 DEF. Start of combat: Thorns on every ally.', {
    stats: { def: 3 },
    triggers: [on('startOfCombat', 'Thicket Crown', [{ kind: 'status', target: 'allAllies', status: THORNS, stacks: 1 }])],
  }),
  signature('r-rootwarden', 'deeproot-staff', 'Deeproot Staff', '+2 ATK. Start of combat: Root every enemy (−3 SPD for 2 turns).', {
    stats: { atk: 2 },
    triggers: [startAfflict('Deeproot Staff', ROOTED)],
  }),
];

const APOSTATE = [
  signature('r-heresiarch', 'heretics-tongue', 'Heretic’s Tongue', '+2 ATK. Start of combat: Profane Anathema and Hush on the enemy with the highest ATK.', {
    stats: { atk: 2 },
    triggers: [
      on('startOfCombat', 'Heretic’s Tongue', [
        { kind: 'status', target: 'highestAtk', status: PROFANE_ANATHEMA, stacks: 1 },
        { kind: 'status', target: 'highestAtk', status: HUSH, stacks: 1 },
      ]),
    ],
  }),
  signature('r-voidspeaker', 'void-bell', 'Void Bell', 'Start of combat: Anathema on every enemy.', { triggers: [startAfflict('Void Bell', ANATHEMA)] }),
  signature('r-defiler', 'carrion-thurible', 'Carrion Thurible', 'Start of combat: 2 Defiled on every enemy.', {
    triggers: [on('startOfCombat', 'Carrion Thurible', [{ kind: 'status', target: 'allEnemies', status: DEFILED, stacks: 2 }])],
  }),
  signature('r-profaner', 'brand-of-the-forsaken', 'Brand of the Forsaken', '+3 ATK. On kill: Forsaken on the most afflicted enemy.', {
    stats: { atk: 3 },
    triggers: [on('onKill', 'Brand of the Forsaken', [{ kind: 'status', target: 'mostAfflicted', status: FORSAKEN, stacks: 1 }])],
  }),
];

const MARAUDER = [
  signature('r-ironhide', 'riveted-plate', 'Riveted Plate', '+4 DEF. Start of combat: gain 3 Ironclad (+1 DEF each).', {
    stats: { def: 4 },
    triggers: [on('startOfCombat', 'Riveted Plate', [{ kind: 'status', target: 'self', status: IRONCLAD, stacks: 3 }])],
  }),
  signature('r-siegebreaker', 'grudge-ledger', 'Grudge Ledger', '+2 ATK. Start of combat: gain 3 Grudge.', {
    stats: { atk: 2 },
    triggers: [on('startOfCombat', 'Grudge Ledger', [{ kind: 'status', target: 'self', status: GRUDGE, stacks: 3 }])],
  }),
  signature('r-headtaker', 'trophy-axe', 'Trophy Axe', '+3 ATK and +15% critical hit chance.', { stats: { atk: 3 }, critChance: 0.15 }),
  signature('r-warmonger', 'war-horn', 'War Horn', 'Start of combat: every ally is Enraged (+4 ATK for 3 turns).', {
    triggers: [on('startOfCombat', 'War Horn', [{ kind: 'status', target: 'allAllies', status: ENRAGED, stacks: 1 }])],
  }),
];

export const RULES_SIGNATURES: ItemDef[] = [...WARRIOR, ...CLERIC, ...ROGUE, ...MAGE, ...RUNEBLADE, ...SHAMAN, ...SYLVAN, ...APOSTATE, ...MARAUDER];

// Adventurer (after M9, Brandon's design): always named Jack, one per party.
// A jack of all trades: every talent and borrowed ability comes from another
// class, so each Jack is different and some roll better than others. The pools
// are built from the other classes' data, so new classes join them on their own.
import type { AdvancedClassDef, TalentDef, TertiaryClassDef } from '../../engine/run/content-types.ts';
import type { ClassDef, ClassId } from '../class-types.ts';
import { abilityTalent, advanced, tertiary } from './dsl.ts';
import { runebladeClass } from './runeblade.ts';

type ClassWithTalents<C> = { cls: C; talents: TalentDef[] };

export interface AdventurerSources {
  classes: readonly ClassDef[];
  baseTalents: Record<Exclude<ClassId, 'adventurer'>, readonly TalentDef[]>;
  advanced: readonly ClassWithTalents<AdvancedClassDef>[];
  tertiary: readonly ClassWithTalents<TertiaryClassDef>[];
}

const isMartial = (c: ClassDef) => c.role === 'frontline' || c.role === 'striker';

export function buildAdventurer({ classes, baseTalents, advanced: adv, tertiary: tert }: AdventurerSources) {
  const martial = new Set(classes.filter(isMartial).map((c) => c.id as string));
  const isMartialTier = (t: { cls: { baseClassId: string } }) => martial.has(t.cls.baseClassId);
  const isArcaneTier = (t: { cls: { baseClassId: string } }) => !martial.has(t.cls.baseClassId);

  // Talents naming another class's ability ("After Cleave...") read wrong on anyone else.
  const abilityNames = [...classes, ...adv.map((a) => a.cls), ...tert.map((t) => t.cls)].map((c) => c.ability.name);
  const portable = (t: TalentDef) => !!t.grantAbility || !abilityNames.some((n) => t.description.includes(n));
  const talentsOf = (tiers: readonly ClassWithTalents<unknown>[]) => tiers.flatMap((t) => t.talents.filter(portable).map((x) => x.id));

  // Each class's ability as something Jack can take, with that class's tags.
  const borrowed: TalentDef[] = [];
  const borrow = (tiers: readonly ClassWithTalents<AdvancedClassDef | TertiaryClassDef>[]) =>
    tiers.map(({ cls }) => {
      const id = `borrow/${cls.ability.id}`;
      if (!borrowed.some((t) => t.id === id)) {
        borrowed.push({ ...abilityTalent(id, cls.ability), sourceClassId: cls.baseClassId, tags: cls.tags });
      }
      return id;
    });
  const martialTert = tert.filter(isMartialTier);
  const arcaneTert = tert.filter(isArcaneTier);

  const journeyman = advanced({
    id: 'journeyman',
    name: 'Journeyman',
    baseClassId: 'adventurer',
    description: 'Learned on the road: borrows from fighters and strikers.',
    tags: ['martial'],
    ability: {
      id: 'hard-won-lesson',
      name: 'Hard-Won Lesson',
      description: 'Every 3rd turn: deal 150% ATK to the nearest enemy and shield yourself for 50% ATK.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'nearest', amount: { atk: 1.5 } },
        { kind: 'shield', target: 'self', amount: { atk: 0.5 } },
      ],
    },
    modifier: { stats: { hp: 6, atk: 2 } },
    talents: [],
    tertiaryClasses: ['master-of-none', 'master-of-one'],
  });
  const hedgeWizard = advanced({
    id: 'hedge-wizard',
    name: 'Hedge Wizard',
    baseClassId: 'adventurer',
    description: 'Self-taught and proud of it: borrows from casters and healers.',
    tags: ['arcane'],
    ability: {
      id: 'cantrip',
      name: 'Cantrip',
      description: 'Every 3rd turn: deal 120% ATK to a random enemy and heal the most wounded ally for 40% ATK.',
      cooldown: 3,
      effects: [
        { kind: 'damage', target: 'randomEnemy', amount: { atk: 1.2 } },
        { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.4 } },
      ],
    },
    passive: { name: 'Book Learning', description: 'Fights at full strength from the back row.' },
    modifier: { stats: { hp: 4, atk: 1 }, reach: true },
    talents: [],
    tertiaryClasses: ['polymath', 'savant'],
  });
  const withPools = <C extends AdvancedClassDef | TertiaryClassDef>(c: { cls: C; talents: TalentDef[] }, talents: string[], borrows: Record<number, readonly string[]>) => ({
    cls: { ...c.cls, talents, borrows },
    talents: [] as TalentDef[],
  });

  const advancedOut = [
    withPools(journeyman, talentsOf(adv.filter(isMartialTier)), { 3: borrow(adv.filter(isMartialTier)) }),
    withPools(hedgeWizard, talentsOf(adv.filter(isArcaneTier)), { 3: borrow(adv.filter(isArcaneTier)) }),
  ];
  const tertiaryOut = [
    withPools(
      tertiary({
        id: 'master-of-none',
        name: 'Master of None',
        baseClassId: 'adventurer',
        advancedClassId: 'journeyman',
        description: 'A little of everything: talents from any class, and a third borrowed ability at level 10.',
        tags: ['martial'],
        ability: {
          id: 'bit-of-everything',
          name: 'Bit of Everything',
          description: 'Every 3rd turn: deal 80% ATK to the nearest enemy, shield yourself for 40% ATK, and heal the most wounded ally for 40% ATK.',
          cooldown: 3,
          effects: [
            { kind: 'damage', target: 'nearest', amount: { atk: 0.8 } },
            { kind: 'shield', target: 'self', amount: { atk: 0.4 } },
            { kind: 'heal', target: 'lowestHpAlly', amount: { atk: 0.4 } },
          ],
        },
        modifier: { stats: { hp: 4, atk: 1 } },
        talents: [],
      }),
      talentsOf(tert),
      { 7: borrow(tert), 10: borrow(tert) },
    ),
    withPools(
      tertiary({
        id: 'master-of-one',
        name: 'Master of One',
        baseClassId: 'adventurer',
        advancedClassId: 'journeyman',
        description: 'Finally settles on a trade: the ability borrowed at level 7 decides the class all later talents come from.',
        tags: ['martial'],
        ability: {
          id: 'perfected-strike',
          name: 'Perfected Strike',
          description: 'Every 3rd turn: deal 200% ATK to the nearest enemy.',
          cooldown: 3,
          effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 2 } }],
        },
        modifier: { stats: { hp: 14, atk: 4, def: 1 } },
        talents: [],
        focusBorrowed: true,
      }),
      talentsOf(martialTert),
      { 7: borrow(martialTert) },
    ),
    withPools(
      tertiary({
        id: 'polymath',
        name: 'Polymath',
        baseClassId: 'adventurer',
        advancedClassId: 'hedge-wizard',
        description: 'Reads everything: one more talent option on every level-up.',
        tags: ['arcane'],
        ability: {
          id: 'wild-theory',
          name: 'Wild Theory',
          description: 'Every 3rd turn: deal 100% ATK to 2 random enemies and shield the most wounded ally for 60% ATK.',
          cooldown: 3,
          effects: [
            { kind: 'damage', target: 'randomEnemy', amount: { atk: 1 } },
            { kind: 'damage', target: 'randomEnemy', amount: { atk: 1 } },
            { kind: 'shield', target: 'lowestHpAlly', amount: { atk: 0.6 } },
          ],
        },
        modifier: { stats: { hp: 8, atk: 2 } },
        talents: [],
        extraTalentChoices: 1,
      }),
      talentsOf(arcaneTert),
      { 7: borrow(arcaneTert) },
    ),
    withPools(
      tertiary({
        id: 'savant',
        name: 'Savant',
        baseClassId: 'adventurer',
        advancedClassId: 'hedge-wizard',
        description: 'Whatever it borrows, it does better than the original.',
        tags: ['arcane'],
        ability: {
          id: 'grand-thesis',
          name: 'Grand Thesis',
          description: 'Every 3rd turn: deal 70% ATK to every enemy.',
          cooldown: 3,
          effects: [{ kind: 'damage', target: 'allEnemies', amount: { atk: 0.7 } }],
        },
        passive: { name: 'Prodigy', description: '+40% ability power.' },
        modifier: { stats: { hp: 6 }, abilityPower: 0.4 },
        talents: [],
      }),
      talentsOf(arcaneTert),
      { 7: borrow(arcaneTert) },
    ),
  ];

  const cls: ClassDef = {
    id: 'adventurer',
    name: 'Adventurer',
    role: 'striker',
    tags: ['wanderer'],
    unlockable: true,
    description: 'Jack, a jack of all trades: every talent and borrowed ability comes from another class. Only one per party.',
    baseStats: { hp: 32, atk: 5, def: 1, spd: 10 },
    range: 'melee',
    placement: 1,
    statWeights: { hp: 3, atk: 3, def: 1, spd: 2 },
    talents: Object.entries(baseTalents).flatMap(([, talents]) => talents.filter(portable).map((t) => t.id)),
    advancedClasses: ['journeyman', 'hedge-wizard'],
    attackTarget: 'nearest',
    ability: {
      id: 'odd-job',
      name: 'Odd Job',
      description: 'Every 3rd turn: deal 130% ATK to the nearest enemy.',
      cooldown: 3,
      effects: [{ kind: 'damage', target: 'nearest', amount: { atk: 1.3 } }],
    },
    triggers: [],
    uniqueInParty: true,
    fixedName: 'Jack',
    borrowLevels: [3, 7, 10],
    // Runes do nothing without this: they'd build to 5 and detonate for no effect.
    borrowedPassives: [{ statusId: 'rune', passive: runebladeClass.passive!, triggers: runebladeClass.triggers }],
  };
  return { cls, advanced: advancedOut, tertiary: tertiaryOut, borrowed };
}

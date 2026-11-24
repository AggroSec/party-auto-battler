// The Black Covenant (Milestone 15): the second story, and a prequel to The
// Hollowing (Brandon: true villains). A fallen knight breaks out of the Dawn
// Order's gaol, burns its abbey and wakes the Crown of Hollows in the
// Greymoor barrows, becoming the Hollow King. Finishing it unlocks the
// Apostate, the Marauder and Reign of Dread for normal runs.
import type { StoryDef, StoryEventDef } from '../../engine/story/types.ts';
import { BARROW_MOTHER, HALRIC, SERAPHINE } from './covenant-bosses.ts';

const EVENTS: StoryEventDef[] = [
  // Mission 1: out of the Dawn Order's lands.
  {
    id: 'jailers-keys',
    title: 'The Jailer’s Keys',
    text: 'The jailer is still breathing. He has keys to every cell in the Lantern Gaol, and a family in town, he says. Brakka cracks her knuckles.',
    options: [
      { label: 'Free every prisoner (+2 XP each; the next fight is an elite)', result: 'The gaol empties into the night, and the guards go after the crowd instead of you. Most of them.', outcomes: [{ kind: 'xp', amount: 2 }, { kind: 'eliteNext' }] },
      { label: 'Make an example of him (Brakka +2 ATK)', result: 'Brakka wears his keys on a cord around her neck after that.', outcomes: [{ kind: 'growth', hero: 'brakka', stats: { atk: 2 } }] },
    ],
  },
  {
    id: 'roadside-shrine',
    title: 'A Roadside Shrine',
    text: 'A shrine to the Dawn, heaped with pilgrims’ coins and burning candles.',
    options: [
      { label: 'Rob it (+8 gold)', result: 'Vaskar pockets the coins without breaking stride.', outcomes: [{ kind: 'gold', amount: 8 }] },
      { label: 'Desecrate it (+2 stat points each; the next fight is an elite)', result: 'The candles go out all at once. Somewhere behind you, a bell starts ringing.', outcomes: [{ kind: 'statPoints', amount: 2 }, { kind: 'eliteNext' }] },
    ],
  },
  {
    id: 'frightened-village',
    title: 'A Frightened Village',
    text: 'The villagers saw the gaol burning. They offer bread, and their silence, if you pass them by.',
    options: [
      { label: 'Take the bread and pass by (+1 life)', result: 'They don’t breathe until you’re out of sight.', outcomes: [{ kind: 'life', amount: 1 }] },
      { label: 'Take everything (+6 gold, a free item)', result: 'They’ll tell the Order where you went. Let them.', outcomes: [{ kind: 'gold', amount: 6 }, { kind: 'item', count: 1 }] },
    ],
  },
  {
    id: 'pit-master',
    title: 'The Pit-Master',
    text: 'Brakka’s old pit-master runs a fighting ring at the crossroads. He’s the one who sold her to the Order.',
    options: [
      { label: 'Brakka settles the debt (Brakka +6 HP, +2 ATK; the next fight is an elite)', result: 'The crowd cheers the wrong fighter for once. Then the ring’s guards come over the rail.', outcomes: [{ kind: 'growth', hero: 'brakka', stats: { hp: 6, atk: 2 } }, { kind: 'eliteNext' }] },
      { label: 'Sell him your silence (+5 gold, +2 XP each)', result: 'He pays to forget your faces. Brakka doesn’t forget his.', outcomes: [{ kind: 'gold', amount: 5 }, { kind: 'xp', amount: 2 }] },
    ],
  },
  // Mission 2: the Abbey of the Dawn.
  {
    id: 'pilgrim-caravan',
    title: 'A Pilgrim Caravan',
    text: 'Pilgrims bound for the abbey, singing. Ysolde smiles at them in a way that makes them stop.',
    options: [
      { label: 'Ysolde takes their blood (Ysolde +4 XP, +2 stat points)', result: 'The singing stops. Ysolde writes something in her ledger.', outcomes: [{ kind: 'xp', amount: 4, hero: 'ysolde' }, { kind: 'statPoints', amount: 2, hero: 'ysolde' }] },
      { label: 'Take their offerings (+3 gold, a free consumable)', result: 'They give it all without being asked twice, down to the last flask of holy water.', outcomes: [{ kind: 'gold', amount: 3 }, { kind: 'consumable' }] },
    ],
  },
  {
    id: 'forbidden-library',
    title: 'The Forbidden Library',
    text: 'Shelves of chained books, and some of them are whispering to Sefin.',
    options: [
      { label: 'Sefin reads the worst one (Sefin +2 ATK, +1 SPD; lose a life)', result: 'Sefin screams for an hour. Afterwards he is very calm, and his shadow moves a little late.', outcomes: [{ kind: 'growth', hero: 'sefin', stats: { atk: 2, spd: 1 } }, { kind: 'life', amount: -1 }] },
      { label: 'Burn it all (+3 XP each)', result: 'The books scream as they burn. You learn a great deal from what they scream.', outcomes: [{ kind: 'xp', amount: 3 }] },
    ],
  },
  {
    id: 'bell-tower',
    title: 'The Bell Tower',
    text: 'If the abbey bells ring, every soldier in the valley comes running.',
    options: [
      { label: 'Cut the ropes (+1 life)', result: 'The bells hang silent. The valley sleeps on.', outcomes: [{ kind: 'life', amount: 1 }] },
      { label: 'Ring them yourselves (2 free items; the next fight is an elite)', result: '“Let them come,” Vaskar says. “Bring us their armour.”', outcomes: [{ kind: 'item', count: 2 }, { kind: 'eliteNext' }] },
    ],
  },
  {
    id: 'reliquary',
    title: 'The Reliquary',
    text: 'A saint’s bones in a silver box, said to bless whoever holds them.',
    options: [
      { label: 'Melt down the silver (a free item)', result: 'The bones go in the river. The silver buys a smith’s silence, and his best work.', outcomes: [{ kind: 'item', count: 1 }] },
      { label: 'Vaskar takes the blessing (Vaskar +8 HP, +1 DEF)', result: 'It should burn him. It doesn’t. That worries Ysolde more than she lets on.', outcomes: [{ kind: 'growth', hero: 'vaskar', stats: { hp: 8, def: 1 } }] },
    ],
  },
  // Mission 3: the Greymoor barrows.
  {
    id: 'war-leaders-oath',
    title: 'The War-Leader’s Oath',
    text: 'A young Greymoor war-leader blocks the path alone, spear raised. “My children’s children will remember this,” she says. She is right.',
    options: [
      { label: 'Cut her down (+2 stat points each; the next fight is an elite)', result: 'Her line will remember. Generations from now, one of them will come for the King.', outcomes: [{ kind: 'statPoints', amount: 2 }, { kind: 'eliteNext' }] },
      { label: 'Let her run and spread the fear (+1 life, +2 XP each)', result: 'She runs to warn the others. Fear will do half your work for you.', outcomes: [{ kind: 'life', amount: 1 }, { kind: 'xp', amount: 2 }] },
    ],
  },
  {
    id: 'totem-circle',
    title: 'A Circle of Totems',
    text: 'Totems ring the barrow, humming with the tribe’s spirits. Corvin says they’ll weaken anything that crosses them.',
    options: [
      { label: 'Corvin unbinds the spirits (Corvin +2 ATK, +1 SPD)', result: 'The spirits come loose with a sound like weeping, and Corvin breathes them in.', outcomes: [{ kind: 'growth', hero: 'corvin', stats: { atk: 2, spd: 1 } }] },
      { label: 'Smash them for their spirit-stones (+3 gold, +2 XP each)', result: 'Raiders will be doing this for generations. You were the first.', outcomes: [{ kind: 'gold', amount: 3 }, { kind: 'xp', amount: 2 }] },
    ],
  },
  {
    id: 'spirit-well',
    title: 'The Spirit-Well',
    text: 'A well where the tribe pours offerings for its dead. The water is very clear, and very cold.',
    options: [
      { label: 'Poison it (Ysolde +2 ATK; the next fight is an elite)', result: 'Ysolde empties a vial into the water. The tribe will know by morning.', outcomes: [{ kind: 'growth', hero: 'ysolde', stats: { atk: 2 } }, { kind: 'eliteNext' }] },
      { label: 'Drink from it (+1 stat point each, +1 life)', result: 'The dead don’t mind sharing. Not yet.', outcomes: [{ kind: 'statPoints', amount: 1 }, { kind: 'life', amount: 1 }] },
    ],
  },
  {
    id: 'night-before',
    title: 'The Night Before',
    text: 'Nobody sleeps. Sefin argues with something only he can hear. Brakka sharpens her knuckles. Vaskar stares at the barrow and doesn’t blink.',
    options: [
      { label: 'Rehearse the rite (+3 XP each)', result: 'By dawn every one of you knows the words. Corvin makes you say them twice.', outcomes: [{ kind: 'xp', amount: 3 }] },
      { label: 'Raid the tribe’s stores (+3 gold, a free item)', result: 'Brakka comes back with a strongbox, a war-leader’s gear and somebody else’s blood on her.', outcomes: [{ kind: 'gold', amount: 3 }, { kind: 'item', count: 1 }] },
    ],
  },
];

export const BLACK_COVENANT: StoryDef = {
  id: 'black-covenant',
  name: 'The Black Covenant',
  blurb:
    'Long before the Hollowing, the Dawn Order locked away a knight who wanted never to die. This is the story of how he got out, what he burned on the way, and the crown he found in the Greymoor barrows. You are the villains.',
  heroes: [
    { id: 'vaskar', name: 'Vaskar', classId: 'dark-knight', title: 'Once the Dawn Order’s finest knight, condemned for seeking a way never to die.' },
    { id: 'brakka', name: 'Brakka', classId: 'marauder', title: 'A pit-fighter who owes the Order a lifetime of grudges.' },
    { id: 'ysolde', name: 'Ysolde', classId: 'cultist', title: 'Keeps a blood cult’s ledger. Every debt gets paid.' },
    { id: 'sefin', name: 'Sefin', classId: 'warlock', title: 'Bargains with things in the dark, and always reads the small print.' },
    {
      id: 'corvin',
      name: 'Corvin',
      classId: 'apostate',
      title: 'The Order’s own confessor, until he heard one confession too many. Still wears its mail (+14 HP, +1 DEF), and will stand in the front line if he must.',
      bonus: { hp: 14, def: 1 },
    },
  ],
  missions: [
    {
      id: 'chains',
      name: 'Chains',
      intro:
        'The Dawn Order keeps its worst heretics in the Lantern Gaol. Tonight its worst is Vaskar, once the Order’s finest knight, condemned for seeking a way never to die. In the next cell a pit-fighter called Brakka has been counting the guards. When the midnight bell rings she breaks her chains over the jailer’s head, and Vaskar walks out after her.',
      outro:
        'Halric falls in his own courtyard, still reciting the Dawn Oath. In his strongbox Vaskar finds what he came for: the Order’s list of forbidden relics, with one name circled in red. The Crown of Hollows, buried in the Greymoor barrows, past the abbey that guards the way.',
      joins: ['vaskar', 'brakka'],
      enemies: [
        { id: 'lantern-jailer', name: 'Lantern Jailer', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.1, atk: 0.9 } },
        { id: 'dawn-crossbow', name: 'Dawn Crossbow', classId: 'ranger', minRound: 1, statMultiplier: { hp: 0.9 } },
        { id: 'order-hound', name: 'Order Hound', classId: 'rogue', minRound: 1 },
        { id: 'dawn-acolyte', name: 'Dawn Acolyte', classId: 'cleric', minRound: 2 },
        { id: 'sworn-blade', name: 'Sworn Blade', classId: 'mercenary', minRound: 2 },
        { id: 'inquisition-mage', name: 'Inquisition Mage', classId: 'mage', minRound: 3 },
      ],
      boss: HALRIC,
      events: ['jailers-keys', 'roadside-shrine', 'frightened-village', 'pit-master'],
    },
    {
      id: 'burning-abbey',
      name: 'The Burning Abbey',
      intro:
        'The Abbey of the Dawn guards the only road into the Greymoor, and the Order’s library of forbidden things. Two new faces wait at its gate: Ysolde, whose blood cult has bled the abbey’s pilgrims for years, and Sefin, a warlock promised the library by something that rarely keeps its word. Vaskar promises them everything. He even means some of it.',
      outro:
        'Seraphine dies on the altar steps, praying for you. The abbey burns behind you. In its vault Sefin finds the barrow rite, and a confessor named Corvin who has read it too, and has decided which side he is on.',
      joins: ['ysolde', 'sefin'],
      enemies: [
        { id: 'abbey-guard', name: 'Abbey Guard', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.1 } },
        { id: 'sister-of-mercy', name: 'Sister of Mercy', classId: 'cleric', minRound: 1 },
        { id: 'choir-mage', name: 'Choir Mage', classId: 'mage', minRound: 1, statMultiplier: { hp: 0.9 } },
        { id: 'bell-ringer', name: 'Bell-Ringer', classId: 'monk', minRound: 1 },
        { id: 'pilgrim-minstrel', name: 'Pilgrim Minstrel', classId: 'bard', minRound: 1 },
        { id: 'relic-knight', name: 'Relic Knight', classId: 'runeblade', minRound: 1 },
      ],
      boss: SERAPHINE,
      events: ['pilgrim-caravan', 'forbidden-library', 'bell-tower', 'reliquary'],
    },
    {
      id: 'the-barrow',
      name: 'The Barrow',
      intro:
        'The Greymoor tribe buries its honoured dead in barrows older than the Order, and the oldest holds the Crown of Hollows. Corvin knows the rite that wakes it. Once the Order’s confessor, he heard one confession too many and stopped believing. Now he believes in something much worse. The tribe’s warriors are already gathering at the barrow.',
      outro:
        'The Barrow-Mother falls, and the barrow goes silent. Vaskar lifts the Crown of Hollows and sets it on his brow, and across the Greymoor the dead open their eyes. It will take the tribe a generation, and every spirit it has, to drive the Hollow King out. But the dead are patient. And so is he.',
      joins: ['corvin'],
      enemies: [
        { id: 'greymoor-warrior', name: 'Greymoor Warrior', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.1 } },
        { id: 'greymoor-hunter', name: 'Greymoor Hunter', classId: 'ranger', minRound: 1 },
        { id: 'spirit-speaker', name: 'Spirit-Speaker', classId: 'c-shaman', minRound: 1 },
        { id: 'grove-druid', name: 'Grove Druid', classId: 'druid', minRound: 1 },
        { id: 'barrow-ancestor', name: 'Barrow Ancestor', classId: 'runeblade', minRound: 1 },
        { id: 'heartwood-sylvan', name: 'Heartwood Sylvan', classId: 'sylvan', minRound: 1 },
      ],
      boss: BARROW_MOTHER,
      events: ['war-leaders-oath', 'totem-circle', 'spirit-well', 'night-before'],
    },
  ],
  events: Object.fromEntries(EVENTS.map((e) => [e.id, e])),
  tiers: [
    { tier: 1, description: 'Enemies have +10% HP and ATK.', modifier: { enemyStats: 0.1 } },
    { tier: 2, description: 'Bosses cast a second ability, and elite stops field a second Elite.', modifier: { empoweredBosses: true, secondEliteFrom: 1 } },
    { tier: 3, description: 'One less life, enemies gain a level, and from round 5 one enemy carries a consumable.', modifier: { startingLives: -1, enemyLevels: 1, enemyConsumablesFrom: 5 } },
  ],
  startingGold: 6,
  lives: 3,
  startLevel: 2,
  enemyStats: -0.25,
  synergy: 'reign-of-dread',
};

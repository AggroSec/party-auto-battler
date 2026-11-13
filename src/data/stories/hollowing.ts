// The Hollowing (Milestone 14): the first story, the Tribe (Brandon's theme).
// Three missions; the war band grows from two heroes to five. Finishing it
// unlocks the Shaman, the Sylvan and Strength of the Tribe for normal runs.
import type { StoryDef, StoryEventDef } from '../../engine/story/types.ts';
import { GORRASK, HOLLOW_KING, HOLLOW_STAG } from './hollowing-bosses.ts';

const EVENTS: StoryEventDef[] = [
  // Mission 1: the ancestor grounds.
  {
    id: 'cracked-totem',
    title: 'A Cracked Totem',
    text: 'A totem lies split in the grass, its spirit-stone dull. Ama kneels beside it. "There is still someone in there," she says. "Barely."',
    options: [
      { label: 'Ama takes its last spirit (Ama +3 XP, +2 stat points)', result: 'The spirit settles into Ama with a sigh. She stands a little taller.', outcomes: [{ kind: 'xp', amount: 3, hero: 'ama' }, { kind: 'statPoints', amount: 2, hero: 'ama' }] },
      { label: 'Let it rest (+1 life)', result: 'Ama sings it to sleep. The air feels lighter as you walk on.', outcomes: [{ kind: 'life', amount: 1 }] },
    ],
  },
  {
    id: 'raider-stash',
    title: 'The Raiders’ Stash',
    text: 'Under a cairn you find a raider stash: coin, and the spirit-stones they pried from the totems. Whoever hid it will want it back.',
    options: [
      { label: 'Take the coin (+8 gold; the next fight is an elite)', result: 'Heavy pockets. Behind you, horns sound.', outcomes: [{ kind: 'gold', amount: 8 }, { kind: 'eliteNext' }] },
      { label: 'Take only the spirit-stones (+2 XP each)', result: 'You return the stones to the earth, where they belong.', outcomes: [{ kind: 'xp', amount: 2 }] },
    ],
  },
  {
    id: 'ancestor-grave',
    title: 'An Ancestor’s Grave',
    text: 'A burial mound, half dug up. A weapon lies across the bones, old but sharp.',
    options: [
      { label: 'Pay your respects (+2 XP each)', result: 'You rebuild the mound. Somewhere, someone is grateful.', outcomes: [{ kind: 'xp', amount: 2 }] },
      { label: 'Take the weapon (a free item)', result: '"They would want it used," Korrin says. Ama doesn’t answer.', outcomes: [{ kind: 'item', count: 1 }] },
    ],
  },
  {
    id: 'war-drums',
    title: 'War Drums',
    text: 'Drums in the hills: a raider champion calling for a challenger. Korrin is already grinning.',
    options: [
      { label: 'Korrin answers (Korrin +2 ATK; the next fight is an elite)', result: 'Korrin roars back. The drums stop, and then they come.', outcomes: [{ kind: 'growth', hero: 'korrin', stats: { atk: 2 } }, { kind: 'eliteNext' }] },
      { label: 'Slip away (+4 gold from an empty camp)', result: 'You circle round while they wait for an answer, and help yourselves.', outcomes: [{ kind: 'gold', amount: 4 }] },
    ],
  },
  // Mission 2: the wild paths.
  {
    id: 'wounded-wolf',
    title: 'A Wounded Wolf',
    text: 'A grey wolf lies in a snare, the Hollowing dark in its eyes. Bram goes still. "That’s Ash. That’s my wolf."',
    options: [
      { label: 'Free and heal Ash (Bram +2 ATK, +1 SPD)', result: 'It takes the whole night. By dawn Ash knows Bram again, and runs at his side.', outcomes: [{ kind: 'growth', hero: 'bram', stats: { atk: 2, spd: 1 } }] },
      { label: 'Leave Ash be (+5 gold from the snare-setter’s pack)', result: 'Bram says nothing for a long time.', outcomes: [{ kind: 'gold', amount: 5 }] },
    ],
  },
  {
    id: 'whispering-grove',
    title: 'The Whispering Grove',
    text: 'The trees here still talk, if you listen. Thessa listens. The others fidget.',
    options: [
      { label: 'Listen with Thessa (Thessa +4 XP)', result: 'The grove tells Thessa where the sickness runs deepest.', outcomes: [{ kind: 'xp', amount: 4, hero: 'thessa' }] },
      { label: 'Gather sap and herbs (a free consumable, +3 gold)', result: 'You fill a satchel. The grove does not seem to mind.', outcomes: [{ kind: 'consumable' }, { kind: 'gold', amount: 3 }] },
    ],
  },
  {
    id: 'hunters-cache',
    title: 'A Hunters’ Cache',
    text: 'An old cache of the tribe’s hunters: arrows, furs, a few good blades. Fleeing families could use it too.',
    options: [
      { label: 'Arm the war band (a free item)', result: 'You take what you need and leave the rest.', outcomes: [{ kind: 'item', count: 1 }] },
      { label: 'Leave it for the families (+1 life, +1 XP each)', result: 'A child runs up to thank you. It helps more than you expected.', outcomes: [{ kind: 'life', amount: 1 }, { kind: 'xp', amount: 1 }] },
    ],
  },
  {
    id: 'blighted-spring',
    title: 'The Blighted Spring',
    text: 'A spring that fed three villages, now black and still. Thessa could cleanse it, if she has the strength.',
    options: [
      { label: 'Thessa cleanses it (+1 life, Thessa +2 stat points)', result: 'The water clears. Thessa sways, but smiles.', outcomes: [{ kind: 'life', amount: 1 }, { kind: 'statPoints', amount: 2, hero: 'thessa' }] },
      { label: 'Press on (+2 XP each)', result: 'There is no time. The Heartwood is waiting.', outcomes: [{ kind: 'xp', amount: 2 }] },
    ],
  },
  // Mission 3: the Heartwood.
  {
    id: 'ancestor-shade',
    title: 'A Hollowed Ancestor',
    text: 'A shade blocks the path: one of the tribe’s honored dead, hollowed and confused. It does not attack. Yet.',
    options: [
      { label: 'Ama speaks with it (+3 XP each)', result: 'Ama finds its name, and it remembers itself long enough to point the way.', outcomes: [{ kind: 'xp', amount: 3 }] },
      { label: 'Put it to rest (+2 stat points each; the next fight is an elite)', result: 'It goes quietly. Others heard it fall.', outcomes: [{ kind: 'statPoints', amount: 2 }, { kind: 'eliteNext' }] },
    ],
  },
  {
    id: 'heartwood-sap',
    title: 'Heartwood Sap',
    text: 'Golden sap wells from a wound in an ancient tree. Lio presses a hand to the bark. "It’s offering."',
    options: [
      { label: 'Lio drinks (Lio +6 HP, +2 ATK)', result: 'Lio glows faintly for an hour afterwards.', outcomes: [{ kind: 'growth', hero: 'lio', stats: { hp: 6, atk: 2 } }] },
      { label: 'Share it (+1 stat point each, +1 life)', result: 'Everyone takes a sip. It tastes like the first warm day of spring.', outcomes: [{ kind: 'statPoints', amount: 1 }, { kind: 'life', amount: 1 }] },
    ],
  },
  {
    id: 'cult-altar',
    title: 'The Cult’s Altar',
    text: 'An altar of bone and stolen spirit-stones, humming with the Hollowing. The cultists who tend it are close.',
    options: [
      { label: 'Smash it (2 free items; the next fight is an elite)', result: 'The stones scatter free. So does every cultist in earshot.', outcomes: [{ kind: 'item', count: 2 }, { kind: 'eliteNext' }] },
      { label: 'Slip past (+6 gold)', result: 'You lift a cultist’s purse on the way by.', outcomes: [{ kind: 'gold', amount: 6 }] },
    ],
  },
  {
    id: 'last-campfire',
    title: 'The Last Campfire',
    text: 'One night before the Heart. Nobody sleeps much. Korrin sharpens. Bram tells bad jokes. Ama watches the stars.',
    options: [
      { label: 'Talk until dawn (+3 XP each)', result: 'By morning you are less a war band than a family.', outcomes: [{ kind: 'xp', amount: 3 }] },
      { label: 'Scout ahead (+8 gold)', result: 'Bram and Ash come back with a cultist’s strongbox.', outcomes: [{ kind: 'gold', amount: 8 }] },
    ],
  },
];

export const HOLLOWING: StoryDef = {
  id: 'hollowing',
  name: 'The Hollowing',
  blurb:
    'The Greymoor tribe lives where the old spirits still answer. Lately the totems have gone quiet. Something is hollowing the spirit out of the land, and a small war band sets out to find it.',
  heroes: [
    { id: 'korrin', name: 'Korrin', classId: 'warrior', lockedAdvanced: 'berserker', title: 'The war-leader’s child, too proud to wait for the elders.' },
    { id: 'ama', name: 'Ama', classId: 'c-shaman', title: 'The elder’s apprentice, the only one who still hears the spirits.' },
    { id: 'thessa', name: 'Thessa', classId: 'druid', title: 'Speaks for the groves; has watched the sickness spread.' },
    { id: 'bram', name: 'Bram', classId: 'ranger', lockedAdvanced: 'beastmaster', title: 'A hunter whose wolf, Ash, went feral and came back wrong.' },
    { id: 'lio', name: 'Lio', classId: 'sylvan', title: 'The last spirit of the Heartwood, keeping the dying tree alive.' },
  ],
  missions: [
    {
      id: 'silent-totems',
      name: 'Silent Totems',
      intro:
        'The ancestor grounds have gone silent. Korrin wants answers; Ama wants to listen. Raiders have been seen among the totems, smashing them for the spirit-stones inside. Their chief calls himself Gorrask Totem-Breaker.',
      outro:
        'Gorrask falls, his stolen stones spilling into the grass. As the last totem dies it shows Ama a vision: the Hollowing pours out of the Heartwood, and it is spreading.',
      joins: ['korrin', 'ama'],
      enemies: [
        { id: 'raider-brute', name: 'Raider Brute', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.1, atk: 0.9 } },
        { id: 'raider-cutthroat', name: 'Raider Cutthroat', classId: 'rogue', minRound: 1 },
        { id: 'raider-archer', name: 'Raider Archer', classId: 'ranger', minRound: 1, statMultiplier: { hp: 0.9 } },
        { id: 'raider-sellsword', name: 'Raider Sellsword', classId: 'mercenary', minRound: 2 },
        { id: 'totem-breaker', name: 'Totem Breaker', classId: 'dark-knight', minRound: 3, statMultiplier: { hp: 1.05, atk: 0.9 } },
        { id: 'raider-hexer', name: 'Raider Hexer', classId: 'warlock', minRound: 3 },
      ],
      boss: GORRASK,
      events: ['cracked-totem', 'raider-stash', 'ancestor-grave', 'war-drums'],
    },
    {
      id: 'wild-paths',
      name: 'The Wild Paths',
      intro:
        'The road to the Heartwood runs through the deep forest, and the forest has gone mad. Thessa, a druid of the groves, joins the war band. So does Bram, a hunter tracking his wolf, Ash, who came back from the woods with something wrong in his eyes.',
      outro:
        'The Hollow Stag kneels, and for a moment its eyes clear. "Not the wood," it breathes. "Someone feeds on the Heart." Then it is only a stag, and then it is gone.',
      joins: ['thessa', 'bram'],
      enemies: [
        { id: 'feral-wolf', name: 'Feral Wolf', classId: 'rogue', minRound: 1, statMultiplier: { hp: 0.85, spd: 1.15 } },
        { id: 'blighted-bear', name: 'Blighted Bear', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.25, atk: 0.9 } },
        { id: 'thornback-boar', name: 'Thornback Boar', classId: 'monk', minRound: 1 },
        { id: 'hollow-hawk', name: 'Hollow Hawk', classId: 'ranger', minRound: 1, statMultiplier: { hp: 0.85, spd: 1.1 } },
        { id: 'mad-grove-keeper', name: 'Maddened Grove Keeper', classId: 'druid', minRound: 1 },
        { id: 'blight-wisp', name: 'Blight Wisp', classId: 'mage', minRound: 1, statMultiplier: { hp: 0.8 } },
      ],
      boss: HOLLOW_STAG,
      events: ['wounded-wolf', 'whispering-grove', 'hunters-cache', 'blighted-spring'],
    },
    {
      id: 'heartwood',
      name: 'The Heartwood',
      intro:
        'At the edge of the Heartwood a spirit steps out of a tree: Lio, the last of its keepers, who has been holding the dying Heart together alone. Lio knows who is feeding on it: the Hollow King, cast out of the Greymoor generations ago, and his cult of the hollowed dead.',
      outro:
        'The Hollow King crumbles to ash and stolen light. The Heart beats again, and across the Greymoor, one by one, the totems begin to sing. The spirits are back, and the tribe remembers who brought them home.',
      joins: ['lio'],
      enemies: [
        { id: 'hollowed-ancestor', name: 'Hollowed Ancestor', classId: 'dark-knight', minRound: 1 },
        { id: 'hollow-cultist', name: 'Hollow Cultist', classId: 'cultist', minRound: 1 },
        { id: 'bone-caller', name: 'Bone Caller', classId: 'necromancer', minRound: 1 },
        { id: 'hexbinder', name: 'Hexbinder', classId: 'warlock', minRound: 1 },
        { id: 'hollow-warden', name: 'Hollow Warden', classId: 'warrior', minRound: 1, statMultiplier: { hp: 1.1 } },
        { id: 'grave-priest', name: 'Grave Priest', classId: 'cleric', minRound: 1 },
      ],
      boss: HOLLOW_KING,
      events: ['ancestor-shade', 'heartwood-sap', 'cult-altar', 'last-campfire'],
    },
  ],
  events: Object.fromEntries(EVENTS.map((e) => [e.id, e])),
  // The story's own ladder (Brandon: "a small tier ladder for replaying story mode").
  tiers: [
    { tier: 1, description: 'Enemies have +10% HP and ATK.', modifier: { enemyStats: 0.1 } },
    { tier: 2, description: 'Bosses cast a second ability, and elite stops field a second Elite.', modifier: { empoweredBosses: true, secondEliteFrom: 1 } },
    { tier: 3, description: 'One less life, enemies gain a level, and from round 5 one enemy carries a consumable.', modifier: { startingLives: -1, enemyLevels: 1, enemyConsumablesFrom: 5 } },
  ],
  startingGold: 6,
  lives: 3,
  startLevel: 2,
  enemyStats: -0.2,
};

export const STORIES: Record<string, StoryDef> = { [HOLLOWING.id]: HOLLOWING };

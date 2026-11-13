// Story mode (Milestone 14): starting a story, moving across a mission's map,
// events and camps, fights and their rewards, and restarting a mission when
// lives run out. A story run is a RunState with `story` set: the party, gold,
// lives and level-up choices work exactly as in a normal run.
import { simulateCombat } from '../combat.ts';
import { Rng } from '../rng.ts';
import { boardOrder } from '../state.ts';
import { autoPlaceSlot, emptyBoard, setSlot, slotOf } from '../run/board.ts';
import { boardUnits, classFor, effectiveClassId, newUnit, resolveBoard } from '../run/build.ts';
import { generateEnemy } from '../run/enemies.ts';
import { allocatePoints, grantXp, isMaxLevel, recommendedAllocation } from '../run/progression.ts';
import { runContext } from '../run/setup.ts';
import { rollConsumable, rollShop } from '../run/shop.ts';
import type { RunModifier } from '../run/content-types.ts';
import type { ActionResult, FightResult, OwnedUnit, RunContext, RunError, RunSetup, RunState, ShopOffer } from '../run/types.ts';
import { BOSS_LAYER, generateMap, isFightNode, reachable } from './map.ts';
import type { StoryDef, StoryEventOption, StoryNode, StoryOutcome } from './types.ts';

/** XP after a story fight, by result and stop. */
export const STORY_XP = { fight: 2, elite: 3, boss: 3, loss: 1, draw: 1 } as const;
/** Gold for winning a fight, by stop. */
export const STORY_GOLD = { fight: 5, elite: 7, boss: 10 } as const;
/** Free items for winning an elite or a boss. */
const STORY_ITEMS = { fight: 0, elite: 1, boss: 2 } as const;
/** XP a camp's training gives one hero. */
export const CAMP_XP = 4;

const fail = (error: RunError): { ok: false; error: RunError } => ({ ok: false, error });

export function storyDef(ctx: RunContext, storyId: string): StoryDef {
  const story = (ctx.base ?? ctx).content.stories?.[storyId];
  if (!story) throw new Error(`Unknown story: ${storyId}`);
  return story;
}

/** Run `fn` with the state's RNG and store its new position. */
function withRng<T>(state: RunState, fn: (rng: Rng) => T): T {
  const rng = new Rng(state.rngState);
  const out = fn(rng);
  state.rngState = rng.getState();
  return out;
}

function addXp(state: RunState, unit: OwnedUnit, amount: number, ctx: RunContext): void {
  state.pending.push(...withRng(state, (rng) => grantXp(unit, amount, ctx.content, ctx.config.progression, rng)));
}

/**
 * The difficulty a stop fights at, as a normal run's round: each mission
 * starts five rounds after the last, and every layer is one round deeper.
 */
export function nodeRound(mission: number, layer: number): number {
  return 1 + mission * 5 + layer;
}

/** Heroes who join at the start of `mission`, at about the party's level. */
function joinHeroes(state: RunState, story: StoryDef, mission: number, ctx: RunContext): void {
  const party = boardUnits(state.board);
  const average = party.length > 0 ? Math.floor(party.reduce((s, u) => s + u.level, 0) / party.length) : 1;
  const level = Math.max(1, story.startLevel ?? 1, average);
  const xp = ctx.config.progression.xpForLevel[level - 1] ?? 0;
  for (const heroId of story.missions[mission]?.joins ?? []) {
    const hero = story.heroes.find((h) => h.id === heroId);
    if (!hero) continue;
    const unit: OwnedUnit = { ...newUnit(state.nextUid, hero.classId, hero.name), storyHero: hero.id, ...(hero.lockedAdvanced ? { lockedAdvanced: hero.lockedAdvanced } : {}) };
    const slot = autoPlaceSlot(state.board, classFor(ctx.content, hero.classId));
    if (!slot) continue;
    setSlot(state.board, slot, unit);
    state.nextUid += 1;
    if (xp > 0) addXp(state, unit, xp, ctx);
  }
}

/** Open a mission: its map, its new heroes, and a checkpoint to restart from. */
function startMission(state: RunState, story: StoryDef, mission: number, ctx: RunContext): void {
  const progress = state.story!;
  progress.mission = mission;
  progress.map = generateMap(state.seed, mission, story.missions[mission]?.events ?? []);
  progress.at = null;
  progress.path = [];
  progress.prompt = null;
  progress.toFight = false;
  progress.shopOpen = false;
  progress.eliteNext = false;
  joinHeroes(state, story, mission, ctx);
  progress.checkpoint = null;
  progress.checkpoint = structuredClone(state);
}

/** Lives a story run starts each mission attempt with. */
export function storyLives(ctx: RunContext, story: StoryDef): number {
  return Math.max(1, story.lives + (ctx.run?.startingLives ?? 0));
}

/** Start a story run. `setup` must name the story (mode 'story'). */
export function createStoryRun(seed: string, baseCtx: RunContext, setup: RunSetup): RunState {
  if (setup.mode !== 'story' || !setup.story) throw new Error('A story run needs a story setup');
  const ctx = runContext(setup, baseCtx);
  const story = storyDef(ctx, setup.story);
  const state: RunState = {
    seed,
    setup,
    rngState: new Rng(`${seed}:shop`).getState(),
    phase: 'shop',
    round: 1,
    lives: storyLives(ctx, story),
    wins: 0,
    losses: 0,
    draws: 0,
    gold: Math.max(0, story.startingGold + (ctx.run?.startingGold ?? 0)),
    winStreak: 0,
    lossStreak: 0,
    board: emptyBoard(),
    shop: [],
    pending: [],
    nextUid: 1,
    history: [],
    freeRerollUsed: false,
    secondWindUsed: false,
    story: { storyId: story.id, mission: 0, map: [], at: null, path: [], restarts: 0, checkpoint: null, scene: 'intro' },
  };
  startMission(state, story, 0, ctx);
  return state;
}

/** The current stop, if the party is at one. */
export function currentNode(state: RunState): StoryNode | undefined {
  const s = state.story;
  return s?.at ? s.map.find((n) => n.id === s.at) : undefined;
}

/** A free random item offer (cost 0), or null with an empty item pool. */
function freeItem(rng: Rng, ctx: RunContext): ShopOffer | null {
  return ctx.content.itemPool.length > 0 ? { kind: 'item', itemId: rng.pick(ctx.content.itemPool), cost: 0 } : null;
}

/** Move to a stop on the map. Shops open, events and camps ask, fights wait for the Fight button. */
export function travel(state: RunState, nodeId: string, baseCtx: RunContext): ActionResult {
  const s = state.story;
  if (!s) return fail('notHere');
  if (s.scene || s.toFight || (s.prompt && s.prompt.picked === undefined)) return fail('busy');
  const node = reachable(s.map, s.at).find((n) => n.id === nodeId);
  if (!node) return fail('unreachable');
  const ctx = runContext(state.setup, baseCtx);
  const next = structuredClone(state);
  const p = next.story!;
  p.at = node.id;
  p.path.push(node.id);
  p.prompt = null;
  p.shopOpen = false;
  // Leaving a stop ends whatever was on offer there.
  next.shop = [];
  next.locked = [];
  next.freeRerollUsed = false;
  if (node.kind === 'shop') {
    next.shop = withRng(next, (rng) => rollShop(rng, ctx, next.board, nodeRound(p.mission, node.layer)));
    p.shopOpen = true;
  } else if (node.kind === 'event' && node.eventId) {
    p.prompt = { id: node.eventId };
  } else if (node.kind === 'rest') {
    p.prompt = { id: 'rest' };
  } else if (isFightNode(node.kind)) {
    p.toFight = true;
  }
  return { ok: true, state: next };
}

/** A camp's options: rest for a life, or train one hero. */
export function campOptions(state: RunState, ctx: RunContext): StoryEventOption[] {
  const story = storyDef(ctx, state.story!.storyId);
  const heroes = boardUnits(state.board).filter((u) => !isMaxLevel(u, ctx.config.progression));
  const rest: StoryEventOption = { label: 'Rest by the fire (+1 life)', result: 'The party rests. Wounds close; spirits lift.', outcomes: [{ kind: 'life', amount: 1 }] };
  const train = heroes.map(
    (u): StoryEventOption => ({
      label: `Train ${u.name} (+${CAMP_XP} XP)`,
      result: `${u.name} trains late into the night.`,
      outcomes: [{ kind: 'xp', amount: CAMP_XP, hero: u.storyHero ?? String(u.uid) }],
    }),
  );
  // Resting is offered only when a life is missing (or there's nobody left to train).
  return state.lives < storyLives(ctx, story) || train.length === 0 ? [rest, ...train] : train;
}

/** The options at the current stop's event or camp. */
export function promptOptions(state: RunState, ctx: RunContext): readonly StoryEventOption[] {
  const prompt = state.story?.prompt;
  if (!prompt) return [];
  if (prompt.id === 'rest') return campOptions(state, ctx);
  return storyDef(ctx, state.story!.storyId).events[prompt.id]?.options ?? [];
}

const heroMatch = (u: OwnedUnit, hero?: string) => hero === undefined || u.storyHero === hero || String(u.uid) === hero;

function applyOutcome(state: RunState, o: StoryOutcome, ctx: RunContext, story: StoryDef): void {
  const units = boardUnits(state.board);
  switch (o.kind) {
    case 'gold':
      state.gold = Math.max(0, state.gold + o.amount);
      return;
    case 'xp':
      for (const u of units.filter((u) => heroMatch(u, o.hero))) addXp(state, u, o.amount, ctx);
      return;
    case 'life':
      state.lives = Math.max(1, Math.min(storyLives(ctx, story), state.lives + o.amount));
      return;
    case 'statPoints':
      for (const u of units.filter((u) => heroMatch(u, o.hero))) u.statPoints += o.amount;
      return;
    case 'growth':
      for (const u of units.filter((u) => heroMatch(u, o.hero))) {
        for (const [k, v] of Object.entries(o.stats) as [keyof typeof u.growth, number][]) u.growth[k] += v;
      }
      return;
    case 'item':
      for (let i = 0; i < o.count; i++) {
        const offer = withRng(state, (rng) => freeItem(rng, ctx));
        if (offer) state.shop.push(offer);
      }
      return;
    case 'consumable': {
      const offer = withRng(state, (rng) => rollConsumable(rng, ctx, 0));
      if (offer) state.shop.push(offer);
      return;
    }
    case 'eliteNext':
      state.story!.eliteNext = true;
      return;
  }
}

/** Pick an option at the current event or camp. */
export function chooseStoryOption(state: RunState, option: number, baseCtx: RunContext): ActionResult {
  const s = state.story;
  if (!s?.prompt || s.prompt.picked !== undefined) return fail('noPendingChoice');
  const ctx = runContext(state.setup, baseCtx);
  const picked = promptOptions(state, ctx)[option];
  if (!picked) return fail('invalidChoice');
  const next = structuredClone(state);
  const story = storyDef(ctx, s.storyId);
  for (const o of picked.outcomes) applyOutcome(next, o, ctx, story);
  next.story!.prompt = { id: s.prompt.id, picked: option, chosen: { label: picked.label, result: picked.result } };
  return { ok: true, state: next };
}

/** Done reading the story text. */
export function dismissScene(state: RunState): ActionResult {
  if (!state.story?.scene) return fail('notHere');
  const next = structuredClone(state);
  next.story!.scene = next.story!.scene === 'outro' ? 'intro' : null;
  next.story!.restarted = false;
  // The final outro has no next mission to introduce.
  if (next.phase === 'complete') next.story!.scene = null;
  return { ok: true, state: next };
}

/** A run modifier without its Elite rules: story stops decide Elites themselves. */
function withoutElites(run: RunModifier | undefined): RunModifier {
  const rest = { ...run };
  delete rest.elitesFrom;
  delete rest.secondEliteFrom;
  return rest;
}

/** The enemy at a stop: the mission's own enemies, its boss at the end, an Elite on elite stops. */
export function storyEnemy(state: RunState, node: StoryNode, ctx: RunContext, elite: boolean) {
  const s = state.story!;
  const mission = storyDef(ctx, s.storyId).missions[s.mission]!;
  const round = nodeRound(s.mission, node.layer);
  const heroes = boardUnits(state.board).length;
  const boss = node.kind === 'boss';
  const fightCtx: RunContext = {
    ...ctx,
    content: {
      ...ctx.content,
      enemies: mission.enemies,
      bosses: [mission.boss],
      // As many enemies as heroes (an elite stop brings one more).
      enemyScaling: { ...ctx.content.enemyScaling, unitsByRound: [Math.min(5, heroes + (elite && !boss ? 1 : 0))] },
    },
    run: {
      ...withoutElites(ctx.run),
      enemyStats: (ctx.run?.enemyStats ?? 0) + (storyDef(ctx, s.storyId).enemyStats ?? 0),
      bossRounds: boss ? [round] : [],
      uniqueBosses: true,
      // An elite stop (and the boss's guard) has an Elite; story tier 2+ adds a second on elite stops.
      ...(elite || boss ? { elitesFrom: round } : {}),
      ...(elite && ctx.run?.secondEliteFrom !== undefined ? { secondEliteFrom: round } : {}),
    },
  };
  return generateEnemy(`${state.seed}:story:${s.mission}:${node.id}`, round, fightCtx);
}

/** Fight the current stop: settle XP, gold, rewards and lives; a won boss fight opens the next mission. */
export function storyFight(state: RunState, baseCtx: RunContext): FightResult {
  const s = state.story;
  const node = state.story ? currentNode(state) : undefined;
  if (!s || !node || !s.toFight) return fail('notHere');
  if (boardUnits(state.board).length === 0) return fail('emptyBoard');
  if (state.pending.length > 0) return fail('pendingChoice');
  const ctx = runContext(state.setup, baseCtx);
  const story = storyDef(ctx, s.storyId);
  const next = structuredClone(state);
  const p = next.story!;
  for (const unit of boardUnits(next.board)) {
    const cfg = ctx.config.progression;
    if (unit.statPoints > 0) allocatePoints(unit, recommendedAllocation(unit, ctx.content, cfg), cfg);
  }
  const elite = node.kind === 'elite' || (node.kind === 'fight' && !!s.eliteNext);
  const playerParty = resolveBoard(next.board, ctx.content);
  const enemy = storyEnemy(next, node, ctx, elite);
  const combat = simulateCombat({ player: playerParty, enemy: enemy.party, rng: new Rng(`${next.seed}:combat:${next.round}`) });

  const used = new Set(combat.events.flatMap((e) => (e.type === 'consume' ? [e.source] : [])));
  for (const unit of boardUnits(next.board)) {
    const slot = slotOf(next.board, unit);
    if (unit.consumable && slot && used.has(`p${boardOrder(slot)}`)) unit.consumable = null;
  }

  const kind = node.kind === 'boss' ? 'boss' : elite ? 'elite' : 'fight';
  const won = combat.winner === 'player';
  if (node.kind === 'fight' && s.eliteNext) p.eliteNext = false;
  const xp: number = STORY_XP[combat.winner === 'draw' ? 'draw' : won ? kind : 'loss'];
  if (won) {
    next.wins += 1;
    next.winStreak += 1;
    next.lossStreak = 0;
    next.gold += STORY_GOLD[kind];
    p.toFight = false;
    for (let i = 0; i < STORY_ITEMS[kind]; i++) {
      const offer = withRng(next, (rng) => freeItem(rng, ctx));
      if (offer) next.shop.push(offer);
    }
  } else {
    if (combat.winner === 'enemy') {
      next.losses += 1;
      next.lives -= 1;
    } else next.draws += 1;
    next.winStreak = 0;
    next.lossStreak += combat.winner === 'enemy' ? 1 : 0;
    // A lost or drawn fight is over (no reward), except the boss: it waits for another try.
    p.toFight = node.kind === 'boss';
  }
  next.history.push({ round: next.round, result: combat.winner, enemy: boardUnits(enemy.builds).map(effectiveClassId), income: null, gold: state.gold });
  next.round += 1;

  if (next.lives <= 0) {
    // Out of lives: the mission starts over from its checkpoint, with full lives.
    const restart = structuredClone(p.checkpoint!);
    restart.story!.checkpoint = structuredClone(p.checkpoint!);
    restart.story!.restarts = p.restarts + 1;
    restart.story!.scene = 'intro';
    restart.story!.restarted = true;
    restart.round = next.round;
    restart.history = next.history;
    restart.wins = next.wins;
    restart.losses = next.losses;
    restart.draws = next.draws;
    return { ok: true, state: restart, combat, playerParty, enemyParty: enemy.party, enemyBuilds: enemy.builds, income: null };
  }

  for (const unit of boardUnits(next.board)) addXp(next, unit, xp, ctx);
  if (won && node.layer === BOSS_LAYER) {
    if (p.mission + 1 >= story.missions.length) {
      next.phase = 'complete';
      p.scene = 'outro';
    } else {
      // The boss's spoils (free items) stay on offer into the next mission.
      next.shop = next.shop.filter((o) => o?.cost === 0);
      next.lives = storyLives(ctx, story);
      startMission(next, story, p.mission + 1, ctx);
      p.scene = 'outro';
      p.checkpoint!.story!.scene = 'intro';
    }
  }
  return { ok: true, state: next, combat, playerParty, enemyParty: enemy.party, enemyBuilds: enemy.builds, income: null };
}

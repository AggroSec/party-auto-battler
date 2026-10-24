// Run setup (M7): the ladder tier, perks and unlocked content a run starts
// with, and the effective rules (config + content) they produce.
import type { RunModifier } from './content-types.ts';
import type { RunConfig, RunContent, RunContext, RunSetup } from './types.ts';

/** Every class, item and synergy the content offers, at tier 0 with no perks. */
export function defaultSetup(ctx: RunContext): RunSetup {
  const base = ctx.base ?? ctx;
  return {
    tier: 0,
    perks: [],
    classes: [...base.content.shopPool],
    items: [...base.content.itemPool],
    synergies: base.content.synergies.map((s) => s.id),
  };
}

/** Combine modifiers: numbers add up, flags OR together, boss rounds merge. */
export function mergeRunModifiers(mods: readonly RunModifier[]): RunModifier {
  const out: RunModifier = {};
  const add = (k: keyof RunModifier, v: number | undefined) => {
    if (v !== undefined) (out as Record<string, number>)[k] = ((out as Record<string, number>)[k] ?? 0) + v;
  };
  for (const m of mods) {
    add('startingGold', m.startingGold);
    add('startingLives', m.startingLives);
    add('rerollCost', m.rerollCost);
    add('lockCost', m.lockCost);
    add('lockSlots', m.lockSlots);
    add('maxInterest', m.maxInterest);
    add('trainingCost', m.trainingCost);
    add('talentChoices', m.talentChoices);
    add('shopSlots', m.shopSlots);
    add('statPointsPerLevel', m.statPointsPerLevel);
    add('enemyStats', m.enemyStats);
    add('enemyLevels', m.enemyLevels);
    if (m.freeReroll) out.freeReroll = true;
    if (m.veteranRecruit) out.veteranRecruit = true;
    if (m.secondWind) out.secondWind = true;
    if (m.freeItem) out.freeItem = true;
    if (m.empoweredBosses) out.empoweredBosses = true;
    if (m.earlyRecruitCost) {
      const e = out.earlyRecruitCost;
      out.earlyRecruitCost = e
        ? { rounds: Math.max(e.rounds, m.earlyRecruitCost.rounds), cost: Math.min(e.cost, m.earlyRecruitCost.cost) }
        : m.earlyRecruitCost;
    }
    if (m.enemyExtraItemFrom !== undefined) out.enemyExtraItemFrom = Math.min(out.enemyExtraItemFrom ?? Infinity, m.enemyExtraItemFrom);
    if (m.elitesFrom !== undefined) out.elitesFrom = Math.min(out.elitesFrom ?? Infinity, m.elitesFrom);
    if (m.bossRounds) out.bossRounds = [...new Set([...(out.bossRounds ?? []), ...m.bossRounds])].sort((a, b) => a - b);
  }
  return out;
}

/** The modifiers a setup applies: ladder tiers 1..tier, then the chosen perks. */
export function setupModifiers(setup: RunSetup, content: RunContent): RunModifier[] {
  const tiers = content.ladder.filter((t) => t.tier <= setup.tier).map((t) => t.modifier);
  const perks = setup.perks.flatMap((id) => (content.perks[id] ? [content.perks[id].modifier] : []));
  return [...tiers, ...perks];
}

function applyToConfig(config: RunConfig, m: RunModifier): RunConfig {
  const p = config.progression;
  const extraPoints = m.statPointsPerLevel ?? 0;
  return {
    ...config,
    startingGold: Math.max(0, config.startingGold + (m.startingGold ?? 0)),
    startingLives: Math.max(1, config.startingLives + (m.startingLives ?? 0)),
    rerollCost: Math.max(0, config.rerollCost + (m.rerollCost ?? 0)),
    lockCost: Math.max(0, config.lockCost + (m.lockCost ?? 0)),
    maxLocks: Math.max(0, config.maxLocks + (m.lockSlots ?? 0)),
    maxInterest: Math.max(0, config.maxInterest + (m.maxInterest ?? 0)),
    shop: { ...config.shop, extraSlots: config.shop.extraSlots + (m.shopSlots ?? 0) },
    progression: {
      ...p,
      trainingCost: Math.max(0, p.trainingCost + (m.trainingCost ?? 0)),
      talentChoices: Math.max(1, p.talentChoices + (m.talentChoices ?? 0)),
      statPointsByLevel: extraPoints ? p.statPointsByLevel.map((n, i) => (i === 0 ? n : n + extraPoints)) : p.statPointsByLevel,
    },
  };
}

function filterContent(content: RunContent, setup: RunSetup): RunContent {
  const classes = setup.classes.filter((id) => content.classes[id]);
  const enemies = content.enemies.filter((a) => classes.includes(a.classId));
  return {
    ...content,
    shopPool: classes,
    itemPool: setup.items.filter((id) => content.items[id] && !content.items[id].tertiaryClassId),
    synergies: content.synergies.filter((s) => setup.synergies.includes(s.id)),
    // Never leave a round without enemies, even with a tiny unlocked pool.
    enemies: enemies.length > 0 ? enemies : content.enemies,
  };
}

const cache = new WeakMap<RunContext, Map<string, RunContext>>();

/**
 * The effective rules for a run: config adjusted by its tier and perks,
 * content narrowed to what it has unlocked. Idempotent: passing an
 * already-effective context starts again from its base.
 */
export function runContext(setup: RunSetup, ctx: RunContext): RunContext {
  const base = ctx.base ?? ctx;
  let byKey = cache.get(base);
  if (!byKey) cache.set(base, (byKey = new Map()));
  const key = JSON.stringify(setup);
  const hit = byKey.get(key);
  if (hit) return hit;
  const run = mergeRunModifiers(setupModifiers(setup, base.content));
  const out: RunContext = { config: applyToConfig(base.config, run), content: filterContent(base.content, setup), run, base };
  byKey.set(key, out);
  return out;
}

/** What a recruit costs in a given round (perks can discount early recruits). */
export function recruitCost(round: number, ctx: RunContext): number {
  const early = ctx.run?.earlyRecruitCost;
  return early && round <= early.rounds ? Math.min(early.cost, ctx.config.unitCost) : ctx.config.unitCost;
}

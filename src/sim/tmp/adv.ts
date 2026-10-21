import { buildRunContext } from '../../data/content.ts';
const ctx = buildRunContext();
for (const a of Object.values(ctx.content.advancedClasses)) {
  console.log(`${a.id} [${a.tags.join(',')}] ${JSON.stringify(a.modifier.stats)} :: ${a.ability.name}: ${a.ability.description}`);
  console.log(`   talents: ${a.talents.map((t) => ctx.content.talents[t]!.name).join(' | ')}`);
}
console.log(Object.values(ctx.content.classes).map((c) => `${c.id} ${JSON.stringify(c.baseStats)} ${c.range}`).join('\n'));

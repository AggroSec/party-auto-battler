import { useState } from 'react';
import { META_CATALOG } from '../../data/meta/catalog.ts';
import { unlockedContent, type AchievementDef, type Unlocks } from '../../engine/meta/index.ts';
import { Rules } from './Rules.tsx';
import type { Game } from './useGame.ts';

const TABS = ['Achievements', 'Classes', 'Items', 'Synergies', 'Perks', 'Ladder'] as const;
type Tab = (typeof TABS)[number];
type Kind = 'classes' | 'items' | 'synergies' | 'perks';

/** Which achievement unlocks each piece of content. */
function unlockedBy(kind: Kind, id: string): AchievementDef | undefined {
  return META_CATALOG.achievements.find((a) => a.reward[kind]?.includes(id));
}

/** A reward as words: "Necromancer, Skull Totem". */
export function rewardText(reward: Unlocks, game: Game): string {
  const { content } = game.baseCtx;
  const parts = [
    ...(reward.classes ?? []).map((id) => `${content.classes[id]?.name ?? id} (class)`),
    ...(reward.items ?? []).map((id) => content.items[id]?.name ?? id),
    ...(reward.synergies ?? []).map((id) => `${content.synergies.find((s) => s.id === id)?.name ?? id} (synergy)`),
    ...(reward.perks ?? []).map((id) => `${content.perks[id]?.name ?? id} (perk)`),
  ];
  if (reward.perkSlots) parts.push(`keep ${reward.perkSlots} more starting perk`);
  return parts.length > 0 ? parts.join(', ') : 'Bragging rights';
}

function Lock({ kind, id, have }: { kind: Kind; id: string; have: boolean }) {
  if (have) return null;
  const by = unlockedBy(kind, id);
  return <span className="lock muted small">🔒 {by ? `${by.name}: ${by.description}` : 'Locked'}</span>;
}

/** Everything the game has, what you've unlocked, and how to unlock the rest. */
export function CollectionScreen({ game }: { game: Game }) {
  const [tab, setTab] = useState<Tab>('Achievements');
  const { profile, unlocked } = game;
  const { content } = game.baseCtx;
  // What's been earned, ignoring the unlock-all toggle, so 🔒 still shows progress.
  const earned = unlockedContent({ ...profile, unlockAll: false }, META_CATALOG);
  const signatures = Object.values(content.items).filter((i) => i.tertiaryClassId);
  const general = META_CATALOG.all.items.map((id) => content.items[id]!).filter(Boolean);

  return (
    <div className="screen collection-screen">
      <header className="setup-head">
        <button type="button" onClick={game.toTitle}>
          ← Back
        </button>
        <h1>Collection</h1>
      </header>
      {profile.unlockAll && <p className="muted small">Unlock everything is on: all content is available, and 🔒 shows what you haven&apos;t earned yet.</p>}
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Achievements' && (
        <ul className="collection-list">
          {META_CATALOG.achievements.map((a) => {
            const earned = profile.achievements.includes(a.id);
            return (
              <li key={a.id} className={earned ? 'earned' : 'locked'}>
                <span aria-hidden>{earned ? '🏅' : '⬜'}</span>
                <div>
                  <strong>{a.name}</strong> <span className="muted">{a.description}</span>
                  <span className="small reward">Unlocks: {rewardText(a.reward, game)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'Classes' && (
        <>
          <ul className="collection-list">
            {META_CATALOG.all.classes.map((id) => {
              const cls = content.classes[id]!;
              const have = earned.classes.includes(id);
              return (
                <li key={id} className={have ? 'earned' : 'locked'}>
                  <strong>{cls.name}</strong> <span className="muted small">{cls.tags.join(' · ')}</span>
                  <Lock kind="classes" id={id} have={have} />
                </li>
              );
            })}
          </ul>
          <h2>
            Tertiary classes discovered: {profile.discovered.length}/{Object.keys(content.tertiaryClasses).length}
          </h2>
          <p className="muted small">
            {Object.values(content.tertiaryClasses)
              .map((t) => (profile.discovered.includes(t.id) ? t.name : '???'))
              .join(' · ')}
          </p>
        </>
      )}

      {tab === 'Items' && (
        <>
          <ul className="collection-list">
            {general.map((item) => {
              const have = earned.items.includes(item.id);
              return (
                <li key={item.id} className={have ? 'earned' : 'locked'}>
                  <strong>{item.name}</strong> <span className="muted small">{item.cost}g</span> <Rules text={item.description} />
                  <Lock kind="items" id={item.id} have={have} />
                </li>
              );
            })}
          </ul>
          <h2>Signature items</h2>
          <p className="muted small">Each tertiary class has one. It shows up in the shop while that class is in your party; only that class can equip it.</p>
          <ul className="collection-list">
            {signatures
              .filter((item) => profile.discovered.includes(item.tertiaryClassId!))
              .map((item) => (
                <li key={item.id} className="earned">
                  🌟 <strong>{item.name}</strong>{' '}
                  <span className="muted small">
                    {content.tertiaryClasses[item.tertiaryClassId!]?.name} · {item.cost}g
                  </span>{' '}
                  <Rules text={item.description} />
                </li>
              ))}
            {signatures.length > profile.discovered.length && (
              <li className="locked muted">
                ??? {signatures.length - profile.discovered.length} more: reach new tertiary classes to discover them.
              </li>
            )}
          </ul>
        </>
      )}

      {tab === 'Synergies' && (
        <ul className="collection-list">
          {content.synergies.map((s) => {
            const have = earned.synergies.includes(s.id);
            return (
              <li key={s.id} className={have ? 'earned' : 'locked'}>
                <strong>{s.name}</strong>
                {s.tiers.map((t, i) => (
                  <span key={i} className="small">
                    <Rules text={t.description} />
                  </span>
                ))}
                <Lock kind="synergies" id={s.id} have={have} />
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'Perks' && (
        <>
          <p className="muted small">
            You keep {unlocked.perkSlots} of {unlocked.perkSlots + META_CATALOG.perkChoiceExtra} perks offered at the start of a run.
          </p>
          <ul className="collection-list">
            {META_CATALOG.all.perks.map((id) => {
              const perk = content.perks[id]!;
              const have = earned.perks.includes(id);
              return (
                <li key={id} className={have ? 'earned' : 'locked'}>
                  <strong>{perk.name}</strong> <span className="muted">{perk.description}</span>
                  <Lock kind="perks" id={id} have={have} />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'Ladder' && (
        <ol className="collection-list ladder">
          {content.ladder.map((l) => (
            <li key={l.tier} className={l.tier <= profile.maxTier ? 'earned' : 'locked'}>
              <strong>Tier {l.tier}</strong> <span className="muted">{l.description}</span>
              {l.tier > profile.maxTier && <span className="lock muted small">🔒 Win a run on tier {l.tier - 1}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

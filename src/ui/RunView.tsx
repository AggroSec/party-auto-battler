import { useMemo, useState } from 'react';
import { buildRunContext } from '../data/content.ts';
import {
  activeSynergies,
  applyShopAction,
  boardUnits,
  createRun,
  fight,
  getSlot,
  resolveBoard,
  type FightResult,
  type OwnedUnit,
  type RunError,
  type ShopAction,
  type SlotRef,
} from '../engine/run/index.ts';
import { CombatReport } from './CombatReport.tsx';
import { BoardPanel, sameSlot } from './run/BoardPanel.tsx';
import { ChoicePanel } from './run/ChoicePanel.tsx';
import { ShopPanel } from './run/ShopPanel.tsx';
import { SynergyPanel } from './run/SynergyPanel.tsx';
import { UnitDetail } from './run/UnitDetail.tsx';

const ERRORS: Record<RunError, string> = {
  notShopPhase: 'The run is over.',
  notEnoughGold: 'Not enough gold.',
  noSuchOffer: 'That offer is gone.',
  invalidSlot: 'Invalid slot.',
  slotOccupied: 'That slot is taken.',
  emptySlot: 'Nothing there.',
  boardFull: 'Your party is full (5 units). Sell someone first.',
  emptyBoard: 'Recruit at least one unit before fighting.',
  needsTarget: 'Select a unit on your board first, then buy.',
  itemSlotsFull: 'That unit already has 2 items.',
  wrongClass: 'That training is for a different class. Select a matching unit.',
  noSuchItem: 'No such item.',
  pendingChoice: 'Make your level-up choices before fighting.',
  noPendingChoice: 'Nothing to choose.',
  invalidChoice: 'Invalid choice.',
};

type Mode = { kind: 'select' } | { kind: 'moveUnit' } | { kind: 'moveItem'; index: number };

/**
 * Debug view of the run loop: shop, board, level-ups, fight, repeat.
 * Deliberately plain. The real game UI arrives in Milestone 4.
 */
export function RunView() {
  const ctx = useMemo(() => buildRunContext(), []);
  const [seed, setSeed] = useState('run-1');
  const [run, setRun] = useState(() => createRun('run-1', ctx));
  const [selected, setSelected] = useState<SlotRef | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'select' });
  const [lastFight, setLastFight] = useState<Extract<FightResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const party = useMemo(() => resolveBoard(run.board, ctx.content), [run.board, ctx]);
  const synergies = useMemo(() => activeSynergies(boardUnits(run.board), ctx.content), [run.board, ctx]);
  const selectedUnit = selected ? (getSlot(run.board, selected) ?? null) : null;

  const dispatch = (action: ShopAction) => {
    const r = applyShopAction(run, action, ctx);
    if (r.ok) {
      setRun(r.state);
      setError(null);
    } else {
      setError(ERRORS[r.error]);
    }
    return r.ok;
  };

  const onSlotClick = (slot: SlotRef, unit: OwnedUnit | null) => {
    if (selected && mode.kind === 'moveUnit') {
      if (dispatch({ type: 'move', from: selected, to: slot })) setSelected(slot);
      setMode({ kind: 'select' });
    } else if (selected && mode.kind === 'moveItem') {
      dispatch({ type: 'moveItem', from: selected, item: mode.index, to: slot });
      setMode({ kind: 'select' });
    } else {
      setSelected(unit && !sameSlot(selected, slot) ? slot : null);
    }
  };

  const onBuy = (offer: number) => {
    const o = run.shop[offer];
    const to = o && o.kind !== 'unit' ? (selected ?? undefined) : undefined;
    dispatch(to ? { type: 'buy', offer, to } : { type: 'buy', offer });
  };

  const onFight = () => {
    const r = fight(run, ctx);
    if (!r.ok) return setError(ERRORS[r.error]);
    setRun(r.state);
    setLastFight(r);
    setMode({ kind: 'select' });
    setError(null);
  };

  const newRun = () => {
    setRun(createRun(seed, ctx));
    setLastFight(null);
    setSelected(null);
    setMode({ kind: 'select' });
    setError(null);
  };

  const over = run.phase !== 'shop';
  const pending = run.pending[0];
  const hint =
    mode.kind === 'moveUnit'
      ? 'Click a slot to move the selected unit there (swaps if occupied).'
      : mode.kind === 'moveItem'
        ? 'Click the unit that should receive the item.'
        : 'Click a unit to inspect it and to target items/training. Melee units fight at 50% from the back row unless they have reach.';

  return (
    <>
      <section className="controls">
        <label className="seed">
          Seed
          <input value={seed} onChange={(e) => setSeed(e.target.value)} />
        </label>
        <button onClick={newRun}>New run</button>
      </section>

      <section className="hud">
        <span>Round {run.round}</span>
        <span>💰 {run.gold} gold</span>
        <span>❤️ {run.lives} lives</span>
        <span>
          🏆 {run.wins}/{ctx.config.winsToComplete} wins
        </span>
        {run.draws > 0 && <span className="muted">{run.draws} draws</span>}
        {(run.winStreak > 1 || run.lossStreak > 1) && (
          <span className="muted">{run.winStreak > 1 ? `${run.winStreak}-win streak` : `${run.lossStreak}-loss streak`}</span>
        )}
      </section>

      {over && (
        <section className={`banner ${run.phase === 'complete' ? 'player' : 'enemy'}`}>
          {run.phase === 'complete'
            ? `Run complete! 10 wins in ${run.history.length} rounds with ${run.lives} lives left.`
            : `Run over after ${run.history.length} rounds with ${run.wins} wins.`}{' '}
          Start a new run above.
        </section>
      )}

      {!over && pending && (
        <ChoicePanel
          choice={pending}
          unit={boardUnits(run.board).find((u) => u.uid === pending.uid)}
          remaining={run.pending.length}
          content={ctx.content}
          onChoose={(option) => dispatch({ type: 'choose', option })}
        />
      )}

      {!over && (
        <div className="columns">
          <ShopPanel
            shop={run.shop}
            content={ctx.content}
            rerollCost={ctx.config.rerollCost}
            targetName={selectedUnit?.name ?? null}
            onBuy={onBuy}
            onReroll={() => dispatch({ type: 'reroll' })}
          />
          <section>
            <h2>Party</h2>
            <BoardPanel board={run.board} content={ctx.content} selected={selected} hint={hint} onSlotClick={onSlotClick} />
            <div className="actions">
              <button disabled={!selectedUnit} onClick={() => setMode(mode.kind === 'moveUnit' ? { kind: 'select' } : { kind: 'moveUnit' })}>
                {mode.kind === 'moveUnit' ? 'Cancel move' : 'Move unit'}
              </button>
              <button className="primary" disabled={!!pending} onClick={onFight}>
                Fight round {run.round} ⚔️
              </button>
            </div>
            {error && <p className="error">{error}</p>}
            {selected && selectedUnit && (
              <UnitDetail
                unit={selectedUnit}
                setup={party[selected.row][selected.col] ?? null}
                ctx={ctx}
                movingItem={mode.kind === 'moveItem' ? mode.index : null}
                onMoveItem={(index) => setMode(index === null ? { kind: 'select' } : { kind: 'moveItem', index })}
                onSell={() => {
                  if (dispatch({ type: 'sell', from: selected })) setSelected(null);
                }}
              />
            )}
            <SynergyPanel active={synergies} />
          </section>
        </div>
      )}

      {lastFight && (
        <>
          <h2 className="last-fight">Last fight: round {lastFight.state.history.at(-1)?.round}</h2>
          {lastFight.income && (
            <p className="muted">
              Income: +{lastFight.income.total}g (base {lastFight.income.base}, interest {lastFight.income.interest}, streak{' '}
              {lastFight.income.streak}) · XP: +
              {lastFight.combat.winner === 'player'
                ? ctx.config.progression.xpPerWin
                : lastFight.combat.winner === 'enemy'
                  ? ctx.config.progression.xpPerLoss
                  : ctx.config.progression.xpPerDraw}{' '}
              to every unit
            </p>
          )}
          <CombatReport result={lastFight.combat} />
        </>
      )}
    </>
  );
}

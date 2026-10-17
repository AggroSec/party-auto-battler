import { useMemo, useState } from 'react';
import { CLASSES } from '../data/classes.ts';
import { buildRunContext } from '../data/content.ts';
import {
  applyShopAction,
  createRun,
  fight,
  type FightResult,
  type OwnedUnit,
  type RunError,
  type ShopAction,
  type SlotRef,
} from '../engine/run/index.ts';
import { CombatReport } from './CombatReport.tsx';

const ERRORS: Record<RunError, string> = {
  notShopPhase: 'The run is over.',
  notEnoughGold: 'Not enough gold.',
  noSuchOffer: 'That offer is gone.',
  invalidSlot: 'Invalid slot.',
  slotOccupied: 'That slot is taken.',
  emptySlot: 'Nothing there.',
  boardFull: 'Your party is full (5 units). Sell someone first.',
  emptyBoard: 'Recruit at least one unit before fighting.',
};

const className = (classId: string) => CLASSES[classId as keyof typeof CLASSES]?.name ?? classId;
const sameSlot = (a: SlotRef | null, b: SlotRef) => a?.row === b.row && a.col === b.col;

/**
 * Milestone 2 debug view of the run loop: shop, board, fight, repeat.
 * Deliberately plain. The real shop and board UI arrive in Milestone 4.
 */
export function RunView() {
  const ctx = useMemo(() => buildRunContext(), []);
  const [seed, setSeed] = useState('run-1');
  const [run, setRun] = useState(() => createRun('run-1', ctx));
  const [selected, setSelected] = useState<SlotRef | null>(null);
  const [lastFight, setLastFight] = useState<Extract<FightResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (selected && !sameSlot(selected, slot)) {
      dispatch({ type: 'move', from: selected, to: slot });
      setSelected(null);
    } else {
      setSelected(unit && !sameSlot(selected, slot) ? slot : null);
    }
  };

  const onFight = () => {
    const r = fight(run, ctx);
    if (!r.ok) return setError(ERRORS[r.error]);
    setRun(r.state);
    setLastFight(r);
    setSelected(null);
    setError(null);
  };

  const newRun = () => {
    setRun(createRun(seed, ctx));
    setLastFight(null);
    setSelected(null);
    setError(null);
  };

  const over = run.phase !== 'shop';

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
          <span className="muted">
            {run.winStreak > 1 ? `${run.winStreak}-win streak` : `${run.lossStreak}-loss streak`}
          </span>
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

      {!over && (
        <div className="columns">
          <section>
            <h2>Shop</h2>
            <ul className="shop">
              {run.shop.map((offer, i) => (
                <li key={i}>
                  {offer ? (
                    <>
                      <span>
                        <strong>{offer.name}</strong> the {className(offer.classId)}
                      </span>
                      <button onClick={() => dispatch({ type: 'buy', offer: i })}>Buy ({offer.cost}g)</button>
                    </>
                  ) : (
                    <span className="muted">sold</span>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => dispatch({ type: 'reroll' })}>Reroll ({ctx.config.rerollCost}g)</button>
          </section>

          <section>
            <h2>Party</h2>
            <p className="muted">Click a unit, then another slot to move or swap. Melee units fight at 50% from the back row.</p>
            <div className="board">
              {(['front', 'back'] as const).map((row) => [
                <span key={`${row}-label`} className="board-label muted">
                  {row === 'front' ? 'Front' : 'Back'}
                </span>,
                ...run.board[row].map((unit, col) => (
                  <button
                    key={`${row}${col}`}
                    className={`slot ${row}-${col} ${unit ? '' : 'empty'} ${sameSlot(selected, { row, col }) ? 'selected' : ''}`}
                    onClick={() => onSlotClick({ row, col }, unit)}
                  >
                    {unit ? (
                      <>
                        <strong>{unit.name}</strong>
                        <span className="muted">{className(unit.classId)}</span>
                      </>
                    ) : (
                      <span className="muted">empty</span>
                    )}
                  </button>
                )),
              ])}
            </div>
            <div className="actions">
              <button
                disabled={!selected}
                onClick={() => {
                  if (selected && dispatch({ type: 'sell', from: selected })) setSelected(null);
                }}
              >
                Sell selected (+{ctx.config.sellRefund}g)
              </button>
              <button className="primary" onClick={onFight}>
                Fight round {run.round} ⚔️
              </button>
            </div>
            {error && <p className="error">{error}</p>}
          </section>
        </div>
      )}

      {lastFight && (
        <>
          <h2 className="last-fight">Last fight: round {lastFight.state.history.at(-1)?.round}</h2>
          {lastFight.income && (
            <p className="muted">
              Income: +{lastFight.income.total}g (base {lastFight.income.base}, interest {lastFight.income.interest},
              streak {lastFight.income.streak})
            </p>
          )}
          <CombatReport result={lastFight.combat} />
        </>
      )}
    </>
  );
}

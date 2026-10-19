import { useMemo, useState } from 'react';
import { boardUnits, getSlot, resolveBoard, type SlotRef } from '../../engine/run/index.ts';
import { Board } from './Board.tsx';
import { ChoicePanel } from './ChoicePanel.tsx';
import { DragProvider } from './drag.tsx';
import { dropAction, type DragSource } from './dropRules.ts';
import { ERROR_TEXT } from './errors.ts';
import { Hud } from './Hud.tsx';
import { Inspector } from './Inspector.tsx';
import { SellZone, ShopRow } from './Shop.tsx';
import { SynergyList } from './SynergyList.tsx';
import type { Game } from './useGame.ts';

/** Click-mode for moving things without dragging (keyboard and accessibility fallback). */
type Mode = { kind: 'select' } | { kind: 'moveUnit' } | { kind: 'moveItem'; index: number };

export function ShopScreen({ game }: { game: Game }) {
  const { run, ctx, dispatch, error } = game;
  const [selected, setSelected] = useState<SlotRef | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'select' });
  const [hint, setHint] = useState<string | null>(null);

  const party = useMemo(() => resolveBoard(run.board, ctx.content), [run.board, ctx]);
  const units = useMemo(() => boardUnits(run.board), [run.board]);
  const selectedUnit = selected ? (getSlot(run.board, selected) ?? null) : null;
  const pending = run.pending[0];
  const { progression } = ctx.config;

  const act = (...args: Parameters<typeof dispatch>) => {
    setHint(null);
    return dispatch(...args);
  };

  const onSlotSelect = (slot: SlotRef | null) => {
    if (selected && slot && mode.kind === 'moveUnit') {
      if (act({ type: 'move', from: selected, to: slot })) setSelected(slot);
      return setMode({ kind: 'select' });
    }
    if (selected && slot && mode.kind === 'moveItem') {
      act({ type: 'moveItem', from: selected, item: mode.index, to: slot });
      return setMode({ kind: 'select' });
    }
    if (mode.kind !== 'select' && !slot) return setMode({ kind: 'select' });
    setSelected(slot);
    setMode({ kind: 'select' });
  };

  const onOfferClick = (index: number) => {
    const offer = run.shop[index];
    if (!offer) return;
    if (offer.kind === 'unit') return act({ type: 'buy', offer: index });
    if (!selected) return setHint(ERROR_TEXT.needsTarget);
    act({ type: 'buy', offer: index, to: selected });
  };

  const onDrop = (source: DragSource, target: Parameters<typeof dropAction>[1]) => {
    const action = dropAction(source, target, run);
    if (!action) return;
    const ok = act(action);
    if (!ok) return;
    if (action.type === 'sell' && selected && action.from.row === selected.row && action.from.col === selected.col) setSelected(null);
    if (action.type === 'move' && selected && action.from.row === selected.row && action.from.col === selected.col) setSelected(action.to);
    if (action.type === 'buy' && action.to && source.kind === 'offer' && run.shop[source.index]?.kind === 'unit') setSelected(action.to);
  };

  const refundFor = (source: DragSource): number | null => {
    if (source.kind === 'offer') return null;
    if (source.kind === 'item') return progression.itemSellRefund;
    const u = getSlot(run.board, source.slot);
    return u ? ctx.config.sellRefund + u.items.length * progression.itemSellRefund : null;
  };

  const withPoints = units.filter((u) => u.statPoints > 0);
  const pointsHint =
    withPoints.length > 0
      ? `⭐ ${withPoints.map((u) => u.name).join(', ')} ${withPoints.length === 1 ? 'has' : 'have'} stat points: click to spend them, or fight to use the recommended spread.`
      : null;
  const message = hint ?? (error ? ERROR_TEXT[error] : pointsHint);
  const modeHint =
    mode.kind === 'moveUnit'
      ? 'Click a slot to move the unit there (swaps if occupied).'
      : mode.kind === 'moveItem'
        ? 'Click the unit that should get the item.'
        : null;

  return (
    <DragProvider canDrop={(s, t) => dropAction(s, t, run) !== null} onDrop={onDrop}>
      <div className="screen shop-screen">
        <Hud run={run} ctx={ctx} onMenu={game.toTitle} />
        {pending && (
          <ChoicePanel
            choice={pending}
            unit={units.find((u) => u.uid === pending.uid)}
            remaining={run.pending.length}
            levelUp={game.recentLevelUps.find((l) => l.uid === pending.uid && l.from < pending.level && pending.level <= l.to)}
            content={ctx.content}
            onChoose={(option) => act({ type: 'choose', option })}
          />
        )}
        <ShopRow shop={run.shop} ctx={ctx} gold={run.gold} onOfferClick={onOfferClick} onReroll={() => act({ type: 'reroll' })} />
        <div className="shop-main">
          <section className="party" aria-label="Your party">
            <div className="party-head">
              <h2>Your party</h2>
              <span className="hint">{modeHint ?? 'Drag to reposition. Melee units hit hardest from the front row.'}</span>
            </div>
            <div className="enemy-side-label" aria-hidden>
              ▲ Enemy side
            </div>
            <Board run={run} party={party} ctx={ctx} selected={selected} onSelect={onSlotSelect} />
            <SellZone refundFor={refundFor} />
            <div className="fight-bar">
              <p className={`message${!hint && !error && pointsHint ? ' info' : ''}`} role="status">
                {message}
              </p>
              <button type="button" className="fight" disabled={!!pending || units.length === 0} onClick={game.fight}>
                ⚔️ Fight round {run.round}
              </button>
            </div>
          </section>
          <aside className="side">
            {selected && selectedUnit ? (
              <Inspector
                unit={selectedUnit}
                slot={selected}
                setup={party[selected.row][selected.col] ?? null}
                ctx={ctx}
                movingItem={mode.kind === 'moveItem' ? mode.index : null}
                movingUnit={mode.kind === 'moveUnit'}
                onMoveItem={(index) => setMode(index === null ? { kind: 'select' } : { kind: 'moveItem', index })}
                onAllocate={(points) => act({ type: 'allocate', at: selected, points })}
                onSellItem={(item) => {
                  act({ type: 'sellItem', from: selected, item });
                  setMode({ kind: 'select' });
                }}
                onMoveUnit={() => setMode(mode.kind === 'moveUnit' ? { kind: 'select' } : { kind: 'moveUnit' })}
                onSell={() => {
                  if (act({ type: 'sell', from: selected })) setSelected(null);
                  setMode({ kind: 'select' });
                }}
                onClose={() => onSlotSelect(null)}
              />
            ) : (
              <p className="inspector-empty muted">Click a unit to see its full build.</p>
            )}
            <SynergyList units={units} content={ctx.content} />
          </aside>
        </div>
      </div>
    </DragProvider>
  );
}

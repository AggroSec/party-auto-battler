import { rerollCost, runContext, type RunContext, type RunState, type ShopOffer } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { useDraggable } from './drag.tsx';
import { offerLabel } from './names.ts';
import { Rules } from './Rules.tsx';

const KIND_LABEL = { unit: 'Recruit', item: 'Item', training: 'Training' } as const;

function OfferCard({
  offer,
  index,
  ctx,
  gold,
  onClick,
}: {
  offer: ShopOffer;
  index: number;
  ctx: RunContext;
  gold: number;
  onClick: () => void;
}) {
  const { content } = ctx;
  const { title, detail } = offerLabel(content, offer);
  const cls = offer.kind === 'item' ? null : content.classes[offer.classId];
  const signature = offer.kind === 'item' ? content.items[offer.itemId]?.tertiaryClassId : undefined;
  const style = offer.kind === 'item' ? { color: signature ? '#e0a526' : '#c9a227', glyph: signature ? '🌟' : '🎒' } : classStyle(content, offer.classId);
  const body = (
    <div className={`offer-card ${offer.kind}${signature ? ' signature' : ''}${offer.cost === 0 ? ' free' : ''}`} style={{ '--class-color': style.color } as React.CSSProperties}>
      <div className="offer-top">
        <span className="avatar small" aria-hidden>
          {offer.kind === 'training' ? '📈' : style.glyph}
        </span>
        <span className="offer-kind">{signature ? `${content.tertiaryClasses[signature]?.name ?? ''} only` : KIND_LABEL[offer.kind]}</span>
        <span className={`cost ${gold < offer.cost ? 'short' : ''}`}>{offer.cost}g</span>
      </div>
      <strong className="offer-title">{title}</strong>
      {offer.kind === 'unit' && cls && (
        <span className="offer-stats">
          ❤️{cls.baseStats.hp} ⚔️{cls.baseStats.atk} 🛡️{cls.baseStats.def} 💨{cls.baseStats.spd} · {cls.range}
        </span>
      )}
      <span className="offer-detail">
        {offer.kind === 'unit' && cls ? (
          <>
            {cls.ability.name}: <Rules text={cls.ability.description} />
          </>
        ) : (
          <Rules text={detail} />
        )}
      </span>
      {offer.kind === 'unit' && cls?.passive && (
        <span className="offer-detail offer-passive">
          <span className="kit-tag">Passive</span> {cls.passive.name}: <Rules text={cls.passive.description} />
        </span>
      )}
      {offer.kind === 'unit' && cls && <span className="offer-tags">{cls.tags.join(' · ')}</span>}
    </div>
  );
  const drag = useDraggable({ kind: 'offer', index }, body, onClick);
  return (
    <button
      type="button"
      className={`offer-slot draggable ${drag.dragging ? 'is-dragging' : ''}`}
      {...drag.props}
      aria-label={`${KIND_LABEL[offer.kind]}: ${title}, ${offer.cost} gold`}
    >
      {body}
    </button>
  );
}

export function ShopRow({
  run,
  ctx,
  onOfferClick,
  onReroll,
  onLock,
}: {
  run: RunState;
  ctx: RunContext;
  onOfferClick: (index: number) => void;
  onReroll: () => void;
  onLock: (index: number) => void;
}) {
  const { shop, gold } = run;
  const reroll = rerollCost(run, ctx);
  const { lockCost, maxLocks } = runContext(run.setup, ctx).config;
  const locked = run.locked ?? [];
  return (
    <section className="shop-row" aria-label="Shop">
      <div className="shop-head">
        <h2>Shop</h2>
        <span className="hint">Drag onto your party, or click. Items and training go to the unit you drop them on.</span>
        <button type="button" className="reroll" onClick={onReroll} disabled={gold < reroll}>
          🎲 Reroll ({reroll === 0 ? 'free' : `${reroll}g`})
        </button>
      </div>
      <div className="offers">
        {shop.map((offer, i) =>
          offer ? (
            <div key={i} className={`offer-wrap ${locked.includes(i) ? 'locked' : ''}`}>
              <OfferCard offer={offer} index={i} ctx={ctx} gold={gold} onClick={() => onOfferClick(i)} />
              {maxLocks > 0 && (
                <button
                  type="button"
                  className="lock-offer"
                  onClick={() => onLock(i)}
                  aria-pressed={locked.includes(i)}
                  disabled={!locked.includes(i) && (locked.length >= maxLocks || gold < lockCost)}
                  title={locked.includes(i) ? 'Locked: stays through rerolls and next round. Click to unlock (no refund).' : `Lock this offer (${lockCost === 0 ? 'free' : `${lockCost}g`})`}
                >
                  {locked.includes(i) ? '🔒' : `🔓${lockCost === 0 ? '' : ` ${lockCost}g`}`}
                </button>
              )}
            </div>
          ) : (
            <div key={i} className="offer-slot sold">
              Sold
            </div>
          ),
        )}
      </div>
    </section>
  );
}


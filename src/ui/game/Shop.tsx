import type { RunContext, ShopOffer } from '../../engine/run/index.ts';
import { classStyle } from './classStyle.ts';
import { useDraggable, useDropTarget, useIsDragging } from './drag.tsx';
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
  const style = offer.kind === 'item' ? { color: '#c9a227', glyph: '🎒' } : classStyle(content, offer.classId);
  const body = (
    <div className={`offer-card ${offer.kind}`} style={{ '--class-color': style.color } as React.CSSProperties}>
      <div className="offer-top">
        <span className="avatar small" aria-hidden>
          {offer.kind === 'training' ? '📈' : style.glyph}
        </span>
        <span className="offer-kind">{KIND_LABEL[offer.kind]}</span>
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
  shop,
  ctx,
  gold,
  onOfferClick,
  onReroll,
}: {
  shop: (ShopOffer | null)[];
  ctx: RunContext;
  gold: number;
  onOfferClick: (index: number) => void;
  onReroll: () => void;
}) {
  return (
    <section className="shop-row" aria-label="Shop">
      <div className="shop-head">
        <h2>Shop</h2>
        <span className="hint">Drag onto your party, or click. Items and training go to the unit you drop them on.</span>
        <button type="button" className="reroll" onClick={onReroll} disabled={gold < ctx.config.rerollCost}>
          🎲 Reroll ({ctx.config.rerollCost}g)
        </button>
      </div>
      <div className="offers">
        {shop.map((offer, i) =>
          offer ? (
            <OfferCard key={i} offer={offer} index={i} ctx={ctx} gold={gold} onClick={() => onOfferClick(i)} />
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

/** Drop zone for selling; only visible while dragging a unit or an item. */
export function SellZone({ refundFor }: { refundFor: (source: NonNullable<ReturnType<typeof useIsDragging>>) => number | null }) {
  const source = useIsDragging();
  const drop = useDropTarget({ kind: 'sell' });
  const refund = source ? refundFor(source) : null;
  if (refund === null) return null;
  return (
    <div className={`sell-zone ${drop.over ? 'drop-over' : ''}`} {...drop.props}>
      💰 Drop here to sell (+{refund}g)
    </div>
  );
}


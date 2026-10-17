import type { RunContent, ShopOffer } from '../../engine/run/index.ts';
import { offerLabel } from './names.ts';

const KIND_ICON = { unit: '🧑', item: '🎒', training: '📈' } as const;

export function ShopPanel({
  shop,
  content,
  rerollCost,
  targetName,
  onBuy,
  onReroll,
}: {
  shop: (ShopOffer | null)[];
  content: RunContent;
  rerollCost: number;
  /** Name of the selected unit (target for items/training), if any. */
  targetName: string | null;
  onBuy: (offer: number) => void;
  onReroll: () => void;
}) {
  return (
    <section>
      <h2>Shop</h2>
      <p className="muted">
        Items and training go to the selected unit{targetName ? `: ${targetName}` : ' (select one on your board first)'}.
      </p>
      <ul className="shop">
        {shop.map((offer, i) => {
          if (!offer) {
            return (
              <li key={i}>
                <span className="muted">sold</span>
              </li>
            );
          }
          const { title, detail } = offerLabel(content, offer);
          return (
            <li key={i} className={`offer ${offer.kind}`}>
              <span className="offer-text">
                <strong>
                  {KIND_ICON[offer.kind]} {title}
                </strong>
                {detail && <span className="muted">{detail}</span>}
              </span>
              <button onClick={() => onBuy(i)}>Buy ({offer.cost}g)</button>
            </li>
          );
        })}
      </ul>
      <button onClick={onReroll}>Reroll ({rerollCost}g)</button>
    </section>
  );
}

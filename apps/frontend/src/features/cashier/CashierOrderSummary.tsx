import type { ReactNode } from 'react';
import EmptyState from '../../components/EmptyState';
import { panelCard } from '../../lib/ui';
import type { CartLine } from '../pos/hooks';

interface CashierOrderSummaryProps {
  columnClassName: string;
  panelHeader: ReactNode;
  hasOrder: boolean;
  emptyTitle: string;
  emptyText: string;
  headerLabel: string;
  orderNumber: string;
  metaLines: ReactNode;
  total: number;
  items: CartLine[];
  subtotal: number;
  emptyItemsTitle: string;
  emptyItemsText: string;
}

/**
 * Shared "order detail" box rendered by both the Cobro rápido and Delivery
 * pendientes tabs — same markup App.jsx's legacy `renderCashier` duplicated
 * almost verbatim between `cashierTab === 'quick'` and `=== 'delivery'`.
 */
export default function CashierOrderSummary({
  columnClassName,
  panelHeader,
  hasOrder,
  emptyTitle,
  emptyText,
  headerLabel,
  orderNumber,
  metaLines,
  total,
  items,
  subtotal,
  emptyItemsTitle,
  emptyItemsText,
}: CashierOrderSummaryProps) {
  return (
    <div className={`${panelCard} ${columnClassName}`}>
      {panelHeader}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        {hasOrder ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-sm text-slate-500">{headerLabel}</p>
                <p className="text-lg font-semibold">{orderNumber || 'Sin código'}</p>
                {metaLines}
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">S/ {Number(total || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length ? (
                items.map((item) => (
                  <div
                    key={`${item.productId}-${item.note}-${item.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.item}</p>
                        <p className="mt-1 text-sm text-slate-500">Cantidad: {item.qty}</p>
                        {item.note ? (
                          <p className="mt-1 text-sm text-amber-700">Obs: {item.note}</p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          S/ {Number(item.price || 0).toFixed(2)} c/u
                        </p>
                        <p className="mt-1 font-semibold">
                          S/ {(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title={emptyItemsTitle} text={emptyItemsText} />
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">S/ {Number(subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>S/ {Number(total || 0).toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title={emptyTitle} text={emptyText} />
        )}
      </div>
    </div>
  );
}

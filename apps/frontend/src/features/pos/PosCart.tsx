import type { OrderListItem } from '@restaurante/shared';
import EmptyState from '../../components/EmptyState';
import { panelCard } from '../../lib/ui';
import type { MappedTable } from '../tables/hooks';
import type { CartLine } from './hooks';

interface PosCartProps {
  selectedTable: string;
  onSelectedTableChange: (label: string) => void;
  mappedTables: MappedTable[];
  currentOrderEntity: OrderListItem | null;
  currentOrder: CartLine[];
  total: number;
  onUpdateItemQty: (itemId: string, newQty: number, note?: string) => void;
}

export default function PosCart({
  selectedTable,
  onSelectedTableChange,
  mappedTables,
  currentOrderEntity,
  currentOrder,
  total,
  onUpdateItemQty,
}: PosCartProps) {
  return (
    <div className={`${panelCard} sticky top-6`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Pedido actual</p>
          <h4 className="text-lg font-bold">{selectedTable}</h4>
        </div>

        <select
          value={selectedTable}
          onChange={(e) => onSelectedTableChange(e.target.value)}
          className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {mappedTables.map((table) => (
            <option key={table.id}>{table.label}</option>
          ))}
        </select>
      </div>

      {currentOrderEntity ? (
        <p className="mb-3 text-sm text-emerald-700">Pedido activo: {currentOrderEntity.orderNumber}</p>
      ) : (
        <p className="mb-3 text-sm text-amber-700">No existe pedido para esta mesa.</p>
      )}

      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {currentOrder.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.item}</p>
                <p className="mt-1 text-xs text-slate-500">{row.note || 'Sin observaciones'}</p>
              </div>
              <p className="text-sm font-semibold">x{row.qty}</p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">S/ {row.price.toFixed(2)} c/u</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateItemQty(row.id, Math.max(row.qty - 1, 0), row.note)}
                  className="h-8 w-8 rounded-full border border-slate-200 text-sm font-bold"
                >
                  -
                </button>

                <span className="min-w-8 text-center text-sm font-semibold">{row.qty}</span>

                <button
                  onClick={() => onUpdateItemQty(row.id, row.qty + 1, row.note)}
                  className="h-8 w-8 rounded-full border border-slate-200 text-sm font-bold"
                >
                  +
                </button>

                <button
                  onClick={() => onUpdateItemQty(row.id, 0, row.note)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}

        {!currentOrder.length && <EmptyState title="Sin items" text="Crea un pedido y agrega productos." />}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-x1 font-bold text-slate-900">
          <span>Total</span>
          <span>S/ {Number(total || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

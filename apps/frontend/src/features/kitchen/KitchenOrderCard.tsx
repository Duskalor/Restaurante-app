import type { KitchenItemStatus, KitchenOrder, KitchenOrderItem } from '@restaurante/shared';
import { getKitchenStatusBadgeClass, getKitchenStatusLabel } from './kitchenStatus';

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onUpdateStatus: (itemId: string, kitchenStatus: KitchenItemStatus) => void;
}

function KitchenItemActionButton({
  item,
  onUpdateStatus,
}: {
  item: KitchenOrderItem;
  onUpdateStatus: (itemId: string, kitchenStatus: KitchenItemStatus) => void;
}) {
  if (item.kitchenStatus === 'PENDING') {
    return (
      <button
        onClick={() => onUpdateStatus(item.id, 'PREPARING')}
        className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        En preparación
      </button>
    );
  }

  if (item.kitchenStatus === 'PREPARING') {
    return (
      <button
        onClick={() => onUpdateStatus(item.id, 'READY')}
        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Marcar listo
      </button>
    );
  }

  if (item.kitchenStatus === 'READY') {
    return (
      <button
        onClick={() => onUpdateStatus(item.id, 'SERVED')}
        className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Entregado
      </button>
    );
  }

  return (
    <span className="inline-flex rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
      Entregado
    </span>
  );
}

export default function KitchenOrderCard({ order, onUpdateStatus }: KitchenOrderCardProps) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{order.tableName ? `Mesa: ${order.tableName}` : 'Sin mesa'}</span>
            <span>•</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {order.orderType}
        </div>
      </div>

      <div className="grid grip-cols-1 gap-3 xl:grid-cols-2">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{item.productName}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                    x{item.qty}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {item.notes?.trim() ? item.notes : 'Sin observaciones'}
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getKitchenStatusBadgeClass(item.kitchenStatus)}`}
                  >
                    {getKitchenStatusLabel(item.kitchenStatus)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-start md:justify-end">
                <KitchenItemActionButton item={item} onUpdateStatus={onUpdateStatus} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

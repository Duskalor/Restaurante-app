import type { KitchenItemStatus } from '@restaurante/shared';
import { panelCard } from '../../lib/ui';
import KitchenOrderCard from './KitchenOrderCard';
import { useKitchenOrders, useUpdateKitchenItemStatus } from './hooks';

export default function KitchenView() {
  const kitchenOrdersQuery = useKitchenOrders();
  const updateStatus = useUpdateKitchenItemStatus();

  const kitchenOrders = kitchenOrdersQuery.data ?? [];
  const isLoading = kitchenOrdersQuery.isLoading;

  const handleUpdateStatus = (itemId: string, kitchenStatus: KitchenItemStatus) => {
    updateStatus.mutate({ itemId, kitchenStatus });
  };

  return (
    <div className="space-y-5">
      <div className={panelCard}>
        <h2 className="text-2xl font-bold text-slate-900">Módulo de cocina</h2>
        <p className="mt-1 text-sm text-slate-500">Pedidos enviados desde punto de venta.</p>
      </div>

      {kitchenOrdersQuery.isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {kitchenOrdersQuery.error instanceof Error
            ? kitchenOrdersQuery.error.message
            : 'No se pudo cargar cocina.'}
        </div>
      ) : null}

      {isLoading ? (
        <div className={panelCard}>
          <p className="text-sm text-slate-500">Cargando pedidos...</p>
        </div>
      ) : kitchenOrders.length === 0 ? (
        <div className={panelCard}>
          <p className="text-lg font-semibold text-slate-700">Sin pedidos pendientes</p>
          <p className="mt-1 text-sm text-slate-500">
            Aquí aparecerán los pedidos enviados a cocina.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...kitchenOrders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((order) => (
              <KitchenOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
        </div>
      )}
    </div>
  );
}

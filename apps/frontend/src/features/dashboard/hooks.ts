import { useMemo } from 'react';
import type { OrderChannel, OrderListItem } from '@restaurante/shared';
import { useOrders } from '../pos/hooks';
import { useTables } from '../tables/hooks';

export interface MappedOrder extends OrderListItem {
  customerLabel: string;
  channelLabel: string;
  totalLabel: string;
}

function getChannelLabel(channel: OrderChannel): string {
  if (channel === 'SALON') return 'Salón';
  if (channel === 'DELIVERY') return 'Delivery';
  if (channel === 'PICKUP') return 'Recojo';
  return channel;
}

/**
 * Legacy App.jsx `orderList` projection (customer/channel/total labels) over
 * the `['orders']` query cache, plus the raw `['tables']` rows the dashboard
 * KPI donuts read.
 */
export function useDashboardData() {
  const ordersQuery = useOrders();
  const tablesQuery = useTables();

  const orderList = useMemo<MappedOrder[]>(() => {
    const orders = ordersQuery.data ?? [];
    return orders.map((order) => ({
      ...order,
      customerLabel: order.table
        ? `Mesa ${order.table.number}`
        : order.customer?.fullName || 'Cliente general',
      channelLabel: getChannelLabel(order.channel),
      totalLabel: `S/ ${Number(order.total || 0).toFixed(2)}`,
    }));
  }, [ordersQuery.data]);

  return {
    orders: ordersQuery.data ?? [],
    tables: tablesQuery.data ?? [],
    orderList,
  };
}

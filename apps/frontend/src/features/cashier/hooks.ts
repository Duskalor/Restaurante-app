import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApiMessageResponse,
  Customer,
  OrderListItem,
  PayOrderRequest,
  PayOrderResponse,
  PaymentMethod,
  PaymentWithRelations,
  UpdatePaymentRequest,
  UpdatePaymentResponse,
} from '@restaurante/shared';
import { apiFetch } from '../../lib/api';
import { ordersQueryKey, useOrders, type CartLine } from '../pos/hooks';
import { tablesQueryKey } from '../tables/hooks';

export const paymentsQueryKey = ['payments'] as const;

/**
 * `GET /payments` — kept as a real query (and invalidation target) for future
 * consumers, but the "Pagos registrados" tab below intentionally does NOT read
 * from it: `PaymentWithRelations.order` is the bare `Order` (no `items`/`table`),
 * while receipt printing needs the full `OrderListItem` (items + table + customer).
 * So the payments tab derives its rows from `useOrders()` instead — same as
 * App.jsx's legacy `paymentRows`/`paymentList` did — which keeps one order shape
 * everywhere in this feature and guarantees the printed receipt always has its data.
 */
export function usePayments() {
  return useQuery({
    queryKey: paymentsQueryKey,
    queryFn: () => apiFetch<PaymentWithRelations[]>('/payments'),
  });
}

/** Mirrors App.jsx's legacy `deliveryPendingOrders`: DELIVERY orders with no payments yet. */
export function useDeliveryPendingOrders() {
  const ordersQuery = useOrders();

  const deliveryPendingOrders = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return orders
      .filter((order) => {
        const orderType = String(order.orderType || '').toUpperCase();
        const hasPayments = Array.isArray(order.payments) && order.payments.length > 0;
        return orderType === 'DELIVERY' && order.status !== 'PAID' && !hasPayments;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
  }, [ordersQuery.data]);

  return { deliveryPendingOrders, isLoading: ordersQuery.isLoading };
}

/**
 * Groups an order's raw items by `productId + notes`, mirroring the
 * `currentOrder`/`selectedCashierItems` grouping App.jsx's legacy code duplicated
 * in three places. Same shape as pos/hooks.ts's `useCurrentOrder` (which keeps its
 * own inline copy of this — left untouched to avoid re-risking already-verified
 * POS code for this extraction).
 */
export function groupOrderItems(order: OrderListItem | null): CartLine[] {
  if (!order) return [];

  const rows = Array.isArray(order.items) ? order.items : [];
  const grouped = new Map<string, CartLine>();

  rows.forEach((row) => {
    const productId = row.productId;
    const note = row.notes || '';
    const key = `${productId}-${note}`;
    const qty = Number(row.qty || 0);
    const price = Number(row.unitPrice || 0);

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        id: row.id,
        productId,
        item: row.productNameSnapshot || 'Producto',
        qty,
        note,
        price,
      });
    } else {
      existing.qty += qty;
    }
  });

  return Array.from(grouped.values());
}

export function useOrderItemLines(order: OrderListItem | null) {
  const items = useMemo(() => groupOrderItems(order), [order]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { items, subtotal };
}

/** One row of the "Pagos registrados" tab (App.jsx's legacy `paymentList` item shape). */
export interface CashierPaymentRow {
  id: string;
  orderId: string;
  orderCode: string;
  paidAt: string;
  createdAt: string;
  method: PaymentMethod;
  total: string;
  amount: number;
  customer: Customer | null;
  /**
   * Always `null`: neither `Payment` nor `Order` carry a `receiptType` field on
   * the wire (confirmed — no such field anywhere in the backend or shared
   * package), so the "Boleta" vs "Boleta simple" choice made in the checkout
   * panel is never sent to `/orders/:id/pay` and never comes back here. The
   * legacy UI's badge for this tab always renders its 'BOLETA_SIMPLE' fallback
   * as a result. Pre-existing bug, preserved as-is — see engram discovery note.
   */
  receiptType: string | null;
  order: OrderListItem | undefined;
}

/** Every payment across all orders, flattened — mirrors App.jsx's legacy `paymentRows`. */
export function usePaymentRows() {
  const ordersQuery = useOrders();

  return useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return orders.flatMap((order) => {
      const orderPayments = Array.isArray(order.payments) ? order.payments : [];
      return orderPayments.map((payment) => ({
        ...payment,
        order,
        // The raw `Payment` row has no `.customer` of its own — only the order does.
        customer: order.customer ?? null,
      }));
    });
  }, [ordersQuery.data]);
}

/** Payment rows filtered to `dateFilter` (yyyy-mm-dd, local time) and shaped for display. */
export function usePaymentList(dateFilter: string) {
  const paymentRows = usePaymentRows();
  const ordersQuery = useOrders();

  return useMemo<CashierPaymentRow[]>(() => {
    const orders = ordersQuery.data ?? [];

    return paymentRows
      .filter((payment) => {
        if (!dateFilter) return true;

        const sourceDate = payment.createdAt || payment.paidAt;
        if (!sourceDate) return false;

        const paymentDate = new Date(sourceDate);
        const localDate = new Date(
          paymentDate.getTime() - paymentDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 10);

        return localDate === dateFilter;
      })
      .map((payment) => {
        const order = orders.find((item) => item.id === payment.orderId);

        return {
          id: payment.id,
          orderId: payment.orderId,
          orderCode: order?.orderNumber || payment.order?.orderNumber || 'ORD-SIN-CODIGO',
          paidAt: new Date(payment.createdAt).toLocaleString(),
          createdAt: payment.createdAt,
          method: payment.method,
          total: `S/ ${Number(payment.amount || 0).toFixed(2)}`,
          amount: Number(payment.amount || 0),
          customer: payment.customer || order?.customer || null,
          receiptType: null,
          order,
        };
      });
  }, [paymentRows, ordersQuery.data, dateFilter]);
}

/**
 * `PATCH /orders/:id/pay` — also frees the order's table on the backend
 * (payments.service.ts `payOrder`), so tables must be invalidated alongside orders.
 */
export function usePayOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: PayOrderRequest }) =>
      apiFetch<PayOrderResponse>(`/orders/${orderId}/pay`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: tablesQueryKey });
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
    },
  });
}

/** `DELETE /orders/:id` — also frees the order's table (orders.service.ts `deleteOrder`). */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch<ApiMessageResponse>(`/orders/${orderId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: tablesQueryKey });
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
    },
  });
}

/** `PATCH /payments/:id` — only recalculates order totals, table status is untouched. */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: UpdatePaymentRequest }) =>
      apiFetch<UpdatePaymentResponse>(`/payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
    },
  });
}

/**
 * `DELETE /payments/:id` — reverts the order to CONFIRMED/DRAFT and puts its
 * table back to OCCUPIED (payments.service.ts `deletePayment`), so tables must
 * be invalidated alongside orders.
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) =>
      apiFetch<ApiMessageResponse>(`/payments/${paymentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: tablesQueryKey });
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
    },
  });
}

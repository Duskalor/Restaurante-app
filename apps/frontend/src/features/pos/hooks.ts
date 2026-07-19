import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddOrderItemRequest,
  ApiMessageResponse,
  CategoryWithBranch,
  CreatedOrder,
  CreateOrderRequest,
  OrderListItem,
  OrderItemWithProduct,
  ProductWithRelations,
  UpdateOrderItemRequest,
} from '@restaurante/shared';
import { apiFetch } from '../../lib/api';
import { tablesQueryKey, useMappedTables } from '../tables/hooks';

export const productsQueryKey = ['products'] as const;
export const categoriesQueryKey = ['categories'] as const;
export const ordersQueryKey = ['orders'] as const;

export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: () => apiFetch<ProductWithRelations[]>('/products'),
  });
}

export interface MappedProduct extends ProductWithRelations {
  stockLabel: string;
  categoryLabel: string;
  priceNumber: number;
}

/** Same `{ stockLabel, categoryLabel, priceNumber }` projection App.jsx's legacy `mappedProducts` computes. */
export function useMappedProducts() {
  const query = useProducts();

  const mappedProducts = useMemo<MappedProduct[]>(() => {
    const products = query.data ?? [];
    return products.map((item) => ({
      ...item,
      stockLabel: item.availableForSale ? 'Disponible' : 'No disponible',
      categoryLabel: item.category?.name || 'Sin categoría',
      priceNumber: Number(item.price || 0),
    }));
  }, [query.data]);

  return { ...query, mappedProducts };
}

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => apiFetch<CategoryWithBranch[]>('/categories'),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => apiFetch<OrderListItem[]>('/orders'),
  });
}

export interface CartLine {
  id: string;
  productId: string | null;
  item: string;
  qty: number;
  note: string;
  price: number;
}

/**
 * Mirrors App.jsx's legacy `selectedTableObj` / `currentOrderEntity` / `currentOrder` / `total`
 * derivation chain for whichever table is selected. CashierView (features/cashier) reuses this
 * same hook directly for its "Cobro rápido" tab — both it and PosView read the same `['orders']`
 * / `['tables']` query cache, so they converge on one source of truth after any mutation's
 * invalidation (no more parallel legacy-state copy, per the Phase 3 seam fix).
 */
export function useCurrentOrder(selectedTable: string) {
  const { mappedTables, isLoading: tablesLoading } = useMappedTables();
  const ordersQuery = useOrders();

  const selectedTableObj = useMemo(
    () => mappedTables.find((table) => table.label === selectedTable) || null,
    [mappedTables, selectedTable]
  );

  const currentOrderEntity = useMemo(() => {
    if (!selectedTableObj) return null;
    const orders = ordersQuery.data ?? [];
    return (
      orders.find((order) => order.tableId === selectedTableObj.id && order.status !== 'PAID') ||
      null
    );
  }, [ordersQuery.data, selectedTableObj]);

  const currentOrder = useMemo<CartLine[]>(() => {
    if (!currentOrderEntity) return [];
    const rows = Array.isArray(currentOrderEntity.items) ? currentOrderEntity.items : [];
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
  }, [currentOrderEntity]);

  const total = currentOrder.reduce((sum, line) => sum + line.price * line.qty, 0);

  return {
    mappedTables,
    selectedTableObj,
    currentOrderEntity,
    currentOrder,
    total,
    isLoading: tablesLoading || ordersQuery.isLoading,
  };
}

/**
 * `POST /orders` — creating an order also occupies its table on the backend,
 * so tables are invalidated alongside orders. Shared by the header's
 * "Nuevo pedido" button and TablesView's "Crear pedido para mesa" (both go
 * through the shell's handler via Outlet context).
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderRequest) =>
      apiFetch<CreatedOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: tablesQueryKey });
    },
  });
}

export function useAddOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: AddOrderItemRequest }) =>
      apiFetch<OrderItemWithProduct>(`/orders/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
    },
  });
}

export function usePatchOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateOrderItemRequest }) =>
      apiFetch(`/order-items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
    },
  });
}

export function useDeleteOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      apiFetch<ApiMessageResponse>(`/order-items/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
    },
  });
}

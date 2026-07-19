import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KitchenItemStatus, KitchenOrder } from '@restaurante/shared';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

export const kitchenOrdersQueryKey = ['kitchen', 'orders'] as const;

/** Polls `/kitchen/orders` every 5s while the kitchen view is mounted and a session exists. */
export function useKitchenOrders() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: kitchenOrdersQueryKey,
    queryFn: () => apiFetch<KitchenOrder[]>('/kitchen/orders'),
    enabled: Boolean(token),
    refetchInterval: 5000,
    placeholderData: (previous) => previous,
  });
}

interface UpdateKitchenItemStatusInput {
  itemId: string;
  /**
   * Typed as the full `KitchenItemStatus` union, not the backend's narrower
   * `KitchenAllowedStatus` (PENDING|PREPARING|READY): the legacy "Entregado"
   * button on a READY item sends 'SERVED', which the backend controller
   * actually rejects (400 "Estado de cocina inválido."). That's a pre-existing
   * bug carried over unchanged from App.jsx's original `renderKitchenActionButton`
   * — see engram discovery note, not fixed here to keep this a pure extraction.
   */
  kitchenStatus: KitchenItemStatus;
}

export function useUpdateKitchenItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, kitchenStatus }: UpdateKitchenItemStatusInput) =>
      apiFetch(`/kitchen/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ kitchenStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenOrdersQueryKey });
    },
  });
}

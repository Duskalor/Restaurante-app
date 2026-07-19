import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApiMessageResponse,
  CreateCustomerRequest,
  Customer,
  DniLookupResponse,
} from '@restaurante/shared';
import { apiFetch } from '../../lib/api';

export const customersQueryKey = ['customers'] as const;

export function useCustomers() {
  return useQuery({
    queryKey: customersQueryKey,
    queryFn: () => apiFetch<Customer[]>('/customers'),
  });
}

/**
 * Imperative DNI lookup against APIPeru (proxied by the backend). Modeled as a
 * mutation rather than a query since it's triggered by a "Buscar DNI" button
 * click, not rendered from cache — mirrors App.jsx's legacy `handleLookupDni`.
 */
export function useLookupDni() {
  return useMutation({
    mutationFn: (dni: string) => apiFetch<DniLookupResponse>(`/clients/lookup/dni/${dni}`),
  });
}

export function useCreateCustomer(onSettledExtra?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerRequest) =>
      apiFetch<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
      onSettledExtra?.();
    },
  });
}

export function useDeleteCustomer(onSettledExtra?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) =>
      apiFetch<ApiMessageResponse>(`/customers/${customerId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
      onSettledExtra?.();
    },
  });
}

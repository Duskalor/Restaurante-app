import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApiMessageResponse,
  CreateTableRequest,
  TableStatus,
  TableWithRelations,
} from '@restaurante/shared';
import { apiFetch } from '../../lib/api';

export const tablesQueryKey = ['tables'] as const;

export function useTables() {
  return useQuery({
    queryKey: tablesQueryKey,
    queryFn: () => apiFetch<TableWithRelations[]>('/tables'),
  });
}

export interface MappedTable extends TableWithRelations {
  label: string;
  statusLabel: string;
}

function getTableStatusLabel(status: TableStatus): string {
  switch (status) {
    case 'FREE':
      return 'Libre';
    case 'OCCUPIED':
      return 'Ocupada';
    case 'RESERVED':
      return 'Reservada';
    case 'CLEANING':
      return 'Limpieza';
    default:
      return 'Inactiva';
  }
}

/** Same `{ label, statusLabel }` projection App.jsx's legacy `mappedTables` computes. */
export function useMappedTables() {
  const query = useTables();

  const mappedTables = useMemo<MappedTable[]>(() => {
    const tables = query.data ?? [];
    return tables.map((table) => ({
      ...table,
      label: `Mesa ${table.number}`,
      statusLabel: getTableStatusLabel(table.status),
    }));
  }, [query.data]);

  return { ...query, mappedTables };
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTableRequest) =>
      apiFetch<TableWithRelations>('/tables', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tableId: string) =>
      apiFetch<ApiMessageResponse>(`/tables/${tableId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey });
    },
  });
}

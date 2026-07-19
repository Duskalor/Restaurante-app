import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import type { TableStatus } from '@restaurante/shared';
import Field from '../../components/Field';
import { inputClass, panelCard } from '../../lib/ui';
import { usePosStore } from '../../stores/pos';
import { useAuthStore } from '../../stores/auth';
import type { ShellOutletContext } from '../../App';
import TableCard from './TableCard';
import { useCreateTable, useDeleteTable, useMappedTables } from './hooks';

const emptyTableForm = {
  number: '',
  name: '',
  capacity: '4',
  status: 'FREE' as TableStatus,
};

export default function TablesView() {
  const navigate = useNavigate();
  // The shell (App.tsx) owns order creation — same handler as the header's
  // "Nuevo pedido" button — and shares it with this route via Outlet context.
  const { onCreateOrder, isCreatingOrder } = useOutletContext<ShellOutletContext>();
  const authUser = useAuthStore((state) => state.user);
  const selectedTable = usePosStore((state) => state.selectedTable);
  const setSelectedTable = usePosStore((state) => state.setSelectedTable);

  const { mappedTables } = useMappedTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const [showTableForm, setShowTableForm] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTableForm);

  const selectedTableObj = mappedTables.find((table) => table.label === selectedTable) || null;

  const handleCreateTable = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser?.branchId) return;

    createTable.mutate(
      {
        branchId: authUser.branchId,
        number: Number(tableForm.number),
        name: tableForm.name || `Mesa ${tableForm.number}`,
        capacity: Number(tableForm.capacity),
        status: tableForm.status,
      },
      {
        onSuccess: () => {
          setTableForm(emptyTableForm);
          setShowTableForm(false);
        },
      }
    );
  };

  const handleDeleteTable = (tableId: string) => {
    const ok = window.confirm('¿Seguro que deseas eliminar esta mesa?');
    if (!ok) return;

    deleteTable.mutate(tableId, {
      onSuccess: () => {
        setSelectedTable('');
      },
      onError: (error) => {
        alert(error instanceof Error ? error.message : 'Error al eliminar la mesa');
      },
    });
  };

  const handleSelectTable = (label: string) => {
    setSelectedTable(label);
    navigate('/pos');
  };

  return (
    <div className="space-y-6">
      <div className={panelCard}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Mapa de mesas</h3>
            <p className="mt-1 text-sm text-slate-500">
              Crea mesas y selecciona una para abrir pedido.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setShowTableForm((v) => !v)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showTableForm ? 'Ocultar formulario' : 'Nueva mesa'}
            </button>

            <button
              onClick={onCreateOrder}
              disabled={isCreatingOrder || !selectedTableObj}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Crear pedido para mesa
            </button>
          </div>
        </div>

        {showTableForm && (
          <form
            onSubmit={handleCreateTable}
            className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4"
          >
            <Field label="Número de mesa">
              <input
                className={inputClass}
                value={tableForm.number}
                onChange={(e) => setTableForm((p) => ({ ...p, number: e.target.value }))}
                required
              />
            </Field>

            <Field label="Nombre">
              <input
                className={inputClass}
                value={tableForm.name}
                onChange={(e) => setTableForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Mesa terraza"
              />
            </Field>

            <Field label="Capacidad">
              <input
                className={inputClass}
                value={tableForm.capacity}
                onChange={(e) => setTableForm((p) => ({ ...p, capacity: e.target.value }))}
                required
              />
            </Field>

            <Field label="Estado inicial">
              <select
                className={inputClass}
                value={tableForm.status}
                onChange={(e) =>
                  setTableForm((p) => ({ ...p, status: e.target.value as TableStatus }))
                }
              >
                <option value="FREE">Libre</option>
                <option value="RESERVED">Reservada</option>
                <option value="CLEANING">Limpieza</option>
                <option value="DISABLED">Inactiva</option>
              </select>
            </Field>

            <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-4">
              <button
                type="button"
                onClick={() => {
                  setTableForm(emptyTableForm);
                  setShowTableForm(false);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={createTable.isPending}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Guardar mesa
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mappedTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              isSelected={selectedTable === table.label}
              onSelect={() => handleSelectTable(table.label)}
              onDelete={() => handleDeleteTable(table.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

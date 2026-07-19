import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import { inputClass, panelCard } from '../../lib/ui';
import { useCreateCustomer, useCustomers, useDeleteCustomer, useLookupDni } from './hooks';

const emptyCustomerForm = {
  documentNumber: '',
  firstName: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
};

export default function CustomersView() {
  const customersQuery = useCustomers();
  const lookupDni = useLookupDni();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const customersData = useMemo(() => {
    const customers = customersQuery.data ?? [];
    return customers.map((customer) => ({
      id: customer.id,
      name: customer.fullName || 'Cliente',
      documentNumber: customer.documentNumber || '-',
    }));
  }, [customersQuery.data]);

  const showNotice = (tone: 'error' | 'info', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const handleLookupDni = () => {
    const dni = customerForm.documentNumber.trim();
    if (!/^\d{8}$/.test(dni)) {
      showNotice('error', 'El DNI debe tener 8 dígitos.');
      return;
    }

    lookupDni.mutate(dni, {
      onSuccess: (data) => {
        setCustomerForm((prev) => ({
          ...prev,
          documentNumber: data.documentNumber || prev.documentNumber,
          firstName: data.firstName || '',
          lastNamePaternal: data.lastNamePaternal || '',
          lastNameMaternal: data.lastNameMaternal || '',
        }));
        showNotice('info', 'DNI consultado correctamente.');
      },
      onError: (error) =>
        showNotice('error', error instanceof Error ? error.message : 'No se pudo consultar el DNI.'),
    });
  };

  const handleCreateCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createCustomer.mutate(customerForm, {
      onSuccess: () => {
        setCustomerForm(emptyCustomerForm);
        showNotice('info', 'Cliente guardado correctamente.');
      },
      onError: (error) =>
        showNotice('error', error instanceof Error ? error.message : 'No se pudo guardar el cliente.'),
    });
  };

  const handleDeleteCustomer = (customer: { id: string; name: string }) => {
    const confirmed = window.confirm(`¿Eliminar a ${customer.name}?`);
    if (!confirmed) return;

    deleteCustomer.mutate(customer.id, {
      onSuccess: () => showNotice('info', 'Cliente eliminado correctamente.'),
      onError: (error) =>
        showNotice('error', error instanceof Error ? error.message : 'No se pudo eliminar el cliente.'),
    });
  };

  return (
    <div className="space-y-6">
      {notice ? (
        <div
          className={`rounded-3xl border px-5 py-4 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className={panelCard}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Clientes</h3>
            <p className="text-sm text-slate-500">
              Registro básico de clientes para futuras ventas.
            </p>
          </div>

          <button
            onClick={() => setShowCustomerForm((v) => !v)}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            {showCustomerForm ? 'Ocultar formulario' : 'Nuevo cliente'}
          </button>
        </div>

        {showCustomerForm && (
          <form
            onSubmit={handleCreateCustomer}
            className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4"
          >
            <Field label="DNI">
              <input
                className={inputClass}
                value={customerForm.documentNumber}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    documentNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                  }))
                }
                placeholder="76148349"
                required
              />
            </Field>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleLookupDni}
                disabled={lookupDni.isPending}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {lookupDni.isPending ? 'Buscando DNI...' : 'Buscar DNI'}
              </button>
            </div>

            <Field label="Nombres">
              <input
                className={inputClass}
                value={customerForm.firstName}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    firstName: e.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field label="Apellido paterno">
              <input
                className={inputClass}
                value={customerForm.lastNamePaternal}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    lastNamePaternal: e.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field label="Apellido materno">
              <input
                className={inputClass}
                value={customerForm.lastNameMaternal}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    lastNameMaternal: e.target.value,
                  }))
                }
                required
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomerForm(emptyCustomerForm)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
              >
                Limpiar
              </button>

              <button
                type="submit"
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              >
                Guardar cliente
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {customersData.length ? (
            customersData.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="mt-1 text-sm text-slate-500">DNI: {customer.documentNumber}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin clientes registrados"
              text="Todavía no hay clientes registrados."
            />
          )}
        </div>
      </div>
    </div>
  );
}

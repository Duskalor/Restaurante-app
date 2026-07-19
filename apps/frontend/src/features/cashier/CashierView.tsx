import { useMemo, useState } from 'react';
import type { PaymentMethod } from '@restaurante/shared';
import { useAuthStore } from '../../stores/auth';
import { usePosStore } from '../../stores/pos';
import { useCreateCustomer, useCustomers, useLookupDni } from '../customers/hooks';
import { useCurrentOrder, useOrders } from '../pos/hooks';
import { useBusinessSettings } from '../settings/hooks';
import CashierCheckoutPanel from './CashierCheckoutPanel';
import type { CashierCustomerForm } from './CashierCheckoutPanel';
import CashierOrderSummary from './CashierOrderSummary';
import CashierPaymentsTab from './CashierPaymentsTab';
import {
  useDeleteOrder,
  useDeletePayment,
  useDeliveryPendingOrders,
  useOrderItemLines,
  usePayOrder,
  usePaymentList,
  useUpdatePayment,
  type CashierPaymentRow,
} from './hooks';
import { printReceipt, type ReceiptBusinessConfig } from './receipt';

const CASHIER_TABS = [
  ['quick', 'Cobro rápido'],
  ['delivery', 'Delivery pendientes'],
  ['payments', 'Pagos registrados'],
] as const;

const emptyCashierCustomerForm: CashierCustomerForm = {
  documentNumber: '',
  firstName: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
};

function getLocalDateString(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function CashierView() {
  const authUser = useAuthStore((state) => state.user);
  const selectedTable = usePosStore((state) => state.selectedTable);
  const setSelectedTable = usePosStore((state) => state.setSelectedTable);

  // Receipt letterhead now comes straight from the `['business-settings', branchId]`
  // query cache (shared with SettingsView) instead of a prop threaded from App.
  const branchId = authUser?.branchId || authUser?.branch?.id || null;
  const businessSettingsQuery = useBusinessSettings(branchId);
  const businessConfig: ReceiptBusinessConfig = {
    businessName: businessSettingsQuery.data?.businessName || '',
    ruc: businessSettingsQuery.data?.ruc || '',
    address: businessSettingsQuery.data?.address || '',
    phone: businessSettingsQuery.data?.phone || '',
    logoUrl: businessSettingsQuery.data?.logoUrl || '',
  };

  const [cashierTab, setCashierTab] = useState<(typeof CASHIER_TABS)[number][0]>('quick');
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState('');
  const [paymentDateFilter, setPaymentDateFilter] = useState(getLocalDateString());
  const [receiptType, setReceiptType] = useState('BOLETA_SIMPLE');
  const [cashierCustomerForm, setCashierCustomerForm] = useState(emptyCashierCustomerForm);
  const [selectedCustomerIdForPayment, setSelectedCustomerIdForPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Yape');
  // Wired to the "Editar" button below exactly as App.jsx's legacy code was: it captures the
  // payment into local state but there was never an edit form rendered anywhere, and
  // handleSavePaymentEdit was never called from any element. Pre-existing dead UI, preserved
  // as-is — see engram discovery note instead of adding the missing form.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- read only by the (dead) handleSavePaymentEdit flow described above
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentEditForm, setPaymentEditForm] = useState({ method: 'YAPE', amount: '' });

  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const showNotice = (tone: 'error' | 'info', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const ordersQuery = useOrders();
  const { mappedTables, currentOrderEntity } = useCurrentOrder(selectedTable);
  const occupiedTables = useMemo(
    () => mappedTables.filter((table) => table.status === 'OCCUPIED'),
    [mappedTables]
  );

  const { deliveryPendingOrders } = useDeliveryPendingOrders();

  // Derived instead of effect-synced (the legacy version reset the id state in a
  // useEffect): an id that no longer matches a pending order falls back to the
  // first one, which is exactly what the sync effect converged to.
  const selectedDeliveryOrder = useMemo(() => {
    if (!selectedDeliveryOrderId) return deliveryPendingOrders[0] ?? null;
    return (
      deliveryPendingOrders.find((order) => order.id === selectedDeliveryOrderId) ??
      deliveryPendingOrders[0] ??
      null
    );
  }, [deliveryPendingOrders, selectedDeliveryOrderId]);

  const selectedCashierOrder = cashierTab === 'delivery' ? selectedDeliveryOrder : currentOrderEntity;
  const { items: selectedCashierItems, subtotal: selectedCashierSubtotal } =
    useOrderItemLines(selectedCashierOrder);
  const selectedCashierTotal = Number(selectedCashierOrder?.total || 0) || selectedCashierSubtotal;

  const customersQuery = useCustomers();
  const lookupDni = useLookupDni();
  const createCustomer = useCreateCustomer();

  const payOrder = usePayOrder();
  const deleteOrder = useDeleteOrder();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const paymentList = usePaymentList(paymentDateFilter);

  const resetCustomerFormAfterPayment = () => {
    setCashierCustomerForm(emptyCashierCustomerForm);
    setSelectedCustomerIdForPayment(null);
  };

  const handleLookupCashierDni = () => {
    const dni = cashierCustomerForm.documentNumber.trim();
    if (!/^\d{8}$/.test(dni)) {
      showNotice('error', 'El DNI debe tener 8 dígitos.');
      return;
    }

    lookupDni.mutate(dni, {
      onSuccess: (data) => {
        setCashierCustomerForm({
          documentNumber: data.documentNumber || dni,
          firstName: data.firstName || '',
          lastNamePaternal: data.lastNamePaternal || '',
          lastNameMaternal: data.lastNameMaternal || '',
        });
        showNotice('info', 'DNI consultado correctamente en caja.');
      },
      onError: (error) =>
        showNotice('error', error instanceof Error ? error.message : 'No se pudo consultar el DNI.'),
    });
  };

  const handleCreateCashierCustomer = async (): Promise<string | null> => {
    if (!/^\d{8}$/.test(cashierCustomerForm.documentNumber)) {
      showNotice('error', 'DNI inválido.');
      return null;
    }

    try {
      const customer = await createCustomer.mutateAsync(cashierCustomerForm);
      return customer.id;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Ya existe un cliente con ese DNI')) {
        const existing = (customersQuery.data ?? []).find(
          (item) => item.documentNumber === cashierCustomerForm.documentNumber
        );
        return existing?.id || null;
      }

      showNotice('error', error instanceof Error ? error.message : 'No se pudo crear el cliente.');
      return null;
    }
  };

  const handlePayCurrentOrder = async () => {
    const orderToPay = selectedCashierOrder;
    if (!orderToPay || !authUser) {
      showNotice('info', 'No hay pedido activo para cobrar.');
      return;
    }

    let customerIdToSend = selectedCustomerIdForPayment;

    if (receiptType === 'BOLETA' && !customerIdToSend) {
      customerIdToSend = await handleCreateCashierCustomer();
    }

    if (receiptType === 'BOLETA' && !customerIdToSend) {
      return;
    }

    payOrder.mutate(
      {
        orderId: orderToPay.id,
        input: {
          method:
            paymentMethod === 'Yape' ? 'YAPE' : paymentMethod === 'Tarjeta' ? 'CARD' : 'CASH',
          amount: Number(orderToPay.total || selectedCashierTotal || 0),
          createdById: authUser.id,
          customerId: receiptType === 'BOLETA' ? customerIdToSend : null,
        },
      },
      {
        onSuccess: () => {
          resetCustomerFormAfterPayment();
          showNotice('info', 'Pedido cobrado correctamente.');
        },
        onError: (error) =>
          showNotice('error', error instanceof Error ? error.message : 'Error al cobrar pedido'),
      }
    );
  };

  const handleDeleteCurrentOrder = () => {
    const orderToDelete = selectedCashierOrder;
    if (!orderToDelete) {
      showNotice('info', 'No hay pedido activo para eliminar.');
      return;
    }

    const confirmed = window.confirm(`¿Eliminar el pedido ${orderToDelete.orderNumber}?`);
    if (!confirmed) return;

    deleteOrder.mutate(orderToDelete.id, {
      onSuccess: () => showNotice('info', 'Pedido eliminado correctamente.'),
      onError: (error) => showNotice('error', error instanceof Error ? error.message : 'Error al eliminar pedido'),
    });
  };

  const handleStartEditPayment = (payment: CashierPaymentRow) => {
    setEditingPaymentId(payment.id);
    setPaymentEditForm({ method: payment.method || 'YAPE', amount: String(payment.amount ?? '') });
  };

  // Never invoked from the UI (see the dead "Editar" note above) — kept for parity.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dead-but-preserved legacy flow, documented above
  const handleSavePaymentEdit = (paymentId: string) => {
    updatePayment.mutate(
      {
        paymentId,
        input: {
          method: paymentEditForm.method as PaymentMethod,
          amount: Number(paymentEditForm.amount),
        },
      },
      {
        onSuccess: () => {
          setEditingPaymentId(null);
          showNotice('info', 'Pago actualizado correctamente.');
        },
        onError: (error) => showNotice('error', error instanceof Error ? error.message : 'Error al actualizar pago'),
      }
    );
  };

  const handleDeletePayment = (payment: CashierPaymentRow) => {
    const confirmed = window.confirm(`¿Eliminar el pago ${payment.orderCode || payment.id}?`);
    if (!confirmed) return;

    deletePayment.mutate(payment.id, {
      onSuccess: () => showNotice('info', 'Pago eliminado correctamente.'),
      onError: (error) => showNotice('error', error instanceof Error ? error.message : 'Error al eliminar pago'),
    });
  };

  const handlePrintReceiptClick = (payment: CashierPaymentRow) => {
    const errorMessage = printReceipt(payment, ordersQuery.data ?? [], businessConfig, selectedTable);
    if (errorMessage) showNotice('error', errorMessage);
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

      <div className="flex flex-wrap gap-2">
        {CASHIER_TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCashierTab(value)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              cashierTab === value
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {cashierTab === 'quick' ? (
        <div className="grid gap-6 xl:grid-cols-12">
          <CashierOrderSummary
            columnClassName="xl:col-span-7"
            panelHeader={<h3 className="text-xl font-semibold">Detalle del pedido</h3>}
            hasOrder={Boolean(currentOrderEntity)}
            emptyTitle="Sin pedido activo"
            emptyText="Selecciona una mesa con pedido para revisar y cobrar."
            headerLabel="Pedido actual"
            orderNumber={currentOrderEntity?.orderNumber || ''}
            metaLines={
              <p className="mt-1 text-sm text-slate-500">Mesa: {selectedTable || 'Sin mesa'}</p>
            }
            total={selectedCashierTotal}
            items={selectedCashierItems}
            subtotal={selectedCashierSubtotal}
            emptyItemsTitle="Sin productos"
            emptyItemsText="La mesa seleccionada no tiene items cargados."
          />

          <CashierCheckoutPanel
            columnClassName="xl:col-span-5"
            title="Cobro rápido"
            topSection={
              <>
                <p className="text-sm text-slate-500">Mesa seleccionada</p>

                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {(occupiedTables.length ? occupiedTables : mappedTables).map((table) => (
                    <option key={table.id} value={table.label}>
                      {table.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-sm text-slate-500">
                  {currentOrderEntity ? currentOrderEntity.orderNumber : 'Sin pedido activo'}
                </p>

                <p className="mt-3 text-2xl font-bold">
                  S/ {Number(currentOrderEntity?.total || 0).toFixed(2)}
                </p>
              </>
            }
            receiptType={receiptType}
            onReceiptTypeChange={(value) => {
              setReceiptType(value);
              if (value !== 'BOLETA') {
                setCashierCustomerForm(emptyCashierCustomerForm);
                setSelectedCustomerIdForPayment(null);
              }
            }}
            cashierCustomerForm={cashierCustomerForm}
            onCashierCustomerFormChange={setCashierCustomerForm}
            onLookupDni={handleLookupCashierDni}
            isSearchingDni={lookupDni.isPending}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onPay={handlePayCurrentOrder}
            onDelete={handleDeleteCurrentOrder}
            payDisabled={!currentOrderEntity}
            deleteDisabled={!currentOrderEntity}
            payLabel="Cobrar pedido actual"
            deleteLabel="Eliminar pedido actual"
          />
        </div>
      ) : cashierTab === 'delivery' ? (
        <div className="grid gap-6 xl:grid-cols-12">
          <CashierOrderSummary
            columnClassName="xl:col-span-7"
            panelHeader={
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Delivery pendientes</h3>
                  <p className="text-sm text-slate-500">
                    Pedidos delivery o WhatsApp listos para cobrar
                  </p>
                </div>

                <select
                  value={selectedDeliveryOrder?.id ?? ''}
                  onChange={(e) => setSelectedDeliveryOrderId(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {deliveryPendingOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>
            }
            hasOrder={Boolean(selectedDeliveryOrder)}
            emptyTitle="Sin delivery pendiente"
            emptyText="No hay pedidos delivery pendientes por cobrar."
            headerLabel="Pedido delivery"
            orderNumber={selectedDeliveryOrder?.orderNumber || ''}
            metaLines={
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Canal: {selectedDeliveryOrder?.channel || 'DELIVERY'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cliente: {selectedDeliveryOrder?.customer?.fullName || 'Cliente no registrado'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Nota: {selectedDeliveryOrder?.notes || 'Sin referencia'}
                </p>
              </>
            }
            total={selectedCashierTotal}
            items={selectedCashierItems}
            subtotal={selectedCashierSubtotal}
            emptyItemsTitle="Sin productos"
            emptyItemsText="Este pedido delivery no tiene items cargados."
          />

          <CashierCheckoutPanel
            columnClassName="xl:col-span-5"
            title="Cobro delivery"
            topSection={
              <>
                <p className="text-sm text-slate-500">Pedido seleccionado</p>
                <p className="mt-2 text-lg font-semibold">
                  {selectedDeliveryOrder?.orderNumber || 'Sin pedido'}
                </p>

                <p className="mt-2 text-sm text-slate-500">Total a cobrar</p>
                <p className="mt-1 text-2xl font-bold">S/ {Number(selectedCashierTotal || 0).toFixed(2)}</p>
              </>
            }
            receiptType={receiptType}
            onReceiptTypeChange={(value) => {
              setReceiptType(value);
              if (value !== 'BOLETA') {
                setCashierCustomerForm(emptyCashierCustomerForm);
                setSelectedCustomerIdForPayment(null);
              }
            }}
            cashierCustomerForm={cashierCustomerForm}
            onCashierCustomerFormChange={setCashierCustomerForm}
            onLookupDni={handleLookupCashierDni}
            isSearchingDni={lookupDni.isPending}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onPay={handlePayCurrentOrder}
            onDelete={handleDeleteCurrentOrder}
            payDisabled={!selectedDeliveryOrder}
            deleteDisabled={!selectedDeliveryOrder}
            payLabel="Cobrar delivery"
            deleteLabel="Eliminar pedido delivery"
          />
        </div>
      ) : (
        <CashierPaymentsTab
          paymentDateFilter={paymentDateFilter}
          onPaymentDateFilterChange={setPaymentDateFilter}
          paymentList={paymentList}
          onPrint={handlePrintReceiptClick}
          onStartEdit={handleStartEditPayment}
          onDelete={handleDeletePayment}
        />
      )}
    </div>
  );
}

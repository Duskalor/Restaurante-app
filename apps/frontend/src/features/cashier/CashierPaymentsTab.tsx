import EmptyState from '../../components/EmptyState';
import { panelCard } from '../../lib/ui';
import type { CashierPaymentRow } from './hooks';

interface CashierPaymentsTabProps {
  paymentDateFilter: string;
  onPaymentDateFilterChange: (value: string) => void;
  paymentList: CashierPaymentRow[];
  onPrint: (payment: CashierPaymentRow) => void;
  onStartEdit: (payment: CashierPaymentRow) => void;
  onDelete: (payment: CashierPaymentRow) => void;
}

export default function CashierPaymentsTab({
  paymentDateFilter,
  onPaymentDateFilterChange,
  paymentList,
  onPrint,
  onStartEdit,
  onDelete,
}: CashierPaymentsTabProps) {
  return (
    <div className={panelCard}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-semibold">Pagos registrados</h3>

        <input
          type="date"
          value={paymentDateFilter}
          onChange={(e) => onPaymentDateFilterChange(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </div>

      <div className="mt-4 space-y-3">
        {paymentList.length ? (
          paymentList.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{payment.orderCode}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {payment.method} · {payment.paidAt}
                  </p>
                </div>

                <div className="text-right">
                  <p className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                    {payment.receiptType || 'BOLETA_SIMPLE'}
                  </p>
                  <p className="mt-3 text-2xl font-bold">{payment.total}</p>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => onPrint(payment)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => onStartEdit(payment)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(payment)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="Sin pagos" text="Todavía no hay pagos registrados." />
        )}
      </div>
    </div>
  );
}

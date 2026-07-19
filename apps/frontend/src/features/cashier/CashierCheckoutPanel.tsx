import type { ReactNode } from 'react';
import { inputClass, panelCard } from '../../lib/ui';

export interface CashierCustomerForm {
  documentNumber: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
}

interface CashierCheckoutPanelProps {
  columnClassName: string;
  title: string;
  topSection: ReactNode;
  receiptType: string;
  onReceiptTypeChange: (value: string) => void;
  cashierCustomerForm: CashierCustomerForm;
  onCashierCustomerFormChange: (updater: (prev: CashierCustomerForm) => CashierCustomerForm) => void;
  onLookupDni: () => void;
  isSearchingDni: boolean;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  onPay: () => void;
  onDelete: () => void;
  payDisabled: boolean;
  deleteDisabled: boolean;
  payLabel: string;
  deleteLabel: string;
}

/**
 * Shared "comprobante + método de pago + acciones" block rendered by both the
 * Cobro rápido and Delivery pendientes tabs — App.jsx's legacy `renderCashier`
 * duplicated this exact markup twice, driven by the same top-level state
 * (`receiptType`, `cashierCustomerForm`, `paymentMethod`) either way.
 */
export default function CashierCheckoutPanel({
  columnClassName,
  title,
  topSection,
  receiptType,
  onReceiptTypeChange,
  cashierCustomerForm,
  onCashierCustomerFormChange,
  onLookupDni,
  isSearchingDni,
  paymentMethod,
  onPaymentMethodChange,
  onPay,
  onDelete,
  payDisabled,
  deleteDisabled,
  payLabel,
  deleteLabel,
}: CashierCheckoutPanelProps) {
  return (
    <div className={`${panelCard} ${columnClassName}`}>
      <h3 className="text-xl font-semibold">{title}</h3>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {topSection}

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Comprobante</p>

            <div className="flex flex-wrap gap-2">
              {[
                ['BOLETA', 'Boleta'],
                ['BOLETA_SIMPLE', 'Boleta simple'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    onReceiptTypeChange(value);
                    if (value !== 'BOLETA') {
                      onCashierCustomerFormChange(() => ({
                        documentNumber: '',
                        firstName: '',
                        lastNamePaternal: '',
                        lastNameMaternal: '',
                      }));
                    }
                  }}
                  className={`rounded-2xl px-3 py-2 text-xs font-medium ${
                    receiptType === value
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {receiptType === 'BOLETA' && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input
                  className={inputClass}
                  placeholder="DNI"
                  value={cashierCustomerForm.documentNumber}
                  onChange={(e) =>
                    onCashierCustomerFormChange((prev) => ({
                      ...prev,
                      documentNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={onLookupDni}
                  disabled={isSearchingDni}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                >
                  {isSearchingDni ? 'Buscando...' : 'Buscar DNI'}
                </button>

                <input
                  className={inputClass}
                  placeholder="Nombres"
                  value={cashierCustomerForm.firstName}
                  onChange={(e) =>
                    onCashierCustomerFormChange((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />

                <input
                  className={inputClass}
                  placeholder="Apellido paterno"
                  value={cashierCustomerForm.lastNamePaternal}
                  onChange={(e) =>
                    onCashierCustomerFormChange((prev) => ({
                      ...prev,
                      lastNamePaternal: e.target.value,
                    }))
                  }
                />

                <input
                  className={inputClass}
                  placeholder="Apellido materno"
                  value={cashierCustomerForm.lastNameMaternal}
                  onChange={(e) =>
                    onCashierCustomerFormChange((prev) => ({
                      ...prev,
                      lastNameMaternal: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Seleccionar método de pago</p>

            <select
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="Yape">Yape</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>

          <button
            onClick={onPay}
            disabled={payDisabled}
            className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {payLabel}
          </button>

          <button
            onClick={onDelete}
            disabled={deleteDisabled}
            className="mt-3 w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60"
          >
            {deleteLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

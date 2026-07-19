import EmptyState from '../../components/EmptyState';
import { panelCard } from '../../lib/ui';
import { useReportMetrics } from './hooks';

/** Legacy App.jsx `renderReports`, markup preserved verbatim. */
export default function ReportsView() {
  const reportMetrics = useReportMetrics();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ventas brutas del día</p>
          <h3 className="mt-2 text-3xl font-semibold">
            S/ {reportMetrics.salesToday.toFixed(2)}
          </h3>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ventas brutas de la semana</p>
          <h3 className="mt-2 text-3xl font-semibold">
            S/ {reportMetrics.salesWeek.toFixed(2)}
          </h3>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ventas brutas del mes</p>
          <h3 className="mt-2 text-3xl font-semibold">
            S/ {reportMetrics.salesMonth.toFixed(2)}
          </h3>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos del día</p>
          <h3 className="mt-2 text-3xl font-semibold">{reportMetrics.ordersToday}</h3>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos de la semana</p>
          <h3 className="mt-2 text-3xl font-semibold">{reportMetrics.ordersWeek}</h3>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos del mes</p>
          <h3 className="mt-2 text-3xl font-semibold">{reportMetrics.ordersMonth}</h3>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ticket promedio del día</p>
          <h3 className="mt-2 text-3xl font-semibold">
            S/ {reportMetrics.ticketToday.toFixed(2)}
          </h3>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ticket promedio de la semana</p>
          <h3 className="mt-2 text-3xl font-semibold">
            S/ {reportMetrics.ticketWeek.toFixed(2)}
          </h3>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ticket promedio del mes</p>
          <h3 className="mt-2 text-3xl font-semibold">
            S/ {reportMetrics.ticketMonth.toFixed(2)}
          </h3>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className={panelCard}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Métodos de pago</h3>
            <p className="text-sm text-slate-500">
              Distribución acumulada de cobros registrados.
            </p>
          </div>

          {reportMetrics.paymentByMethod.length ? (
            <div className="space-y-3">
              {reportMetrics.paymentByMethod.map((item) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <span className="font-medium text-slate-700">{item.method}</span>
                  <span className="font-semibold">
                    S/ {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin pagos"
              text="Todavía no hay pagos registrados para mostrar."
            />
          )}
        </div>

        <div className={panelCard}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Productos más vendidos</h3>
            <p className="text-sm text-slate-500">
              Ranking por cantidad vendida e ingreso generado.
            </p>
          </div>

          {reportMetrics.topProducts.length ? (
            <div className="space-y-3">
              {reportMetrics.topProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-700">{product.name}</p>
                    <p className="text-sm text-slate-500">
                      {product.qty} vendidos
                    </p>
                  </div>
                  <span className="font-semibold">
                    S/ {product.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin productos"
              text="Todavía no hay productos vendidos para mostrar."
            />
          )}
        </div>
      </div>
    </div>
  );
}

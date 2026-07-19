import { useNavigate } from 'react-router';
import EmptyState from '../../components/EmptyState';
import { badgeClass, panelCard } from '../../lib/ui';
import { useReportMetrics } from '../reports/hooks';
import { useDashboardData } from './hooks';

/** Legacy App.jsx `renderDashboard`, markup (including the inline SVG sales chart) preserved verbatim. */
export default function DashboardView() {
  const navigate = useNavigate();
  const { orders, tables, orderList } = useDashboardData();
  const reportMetrics = useReportMetrics();

  const activeOrders = orders.filter((order) => order.status !== 'PAID').length;

  const tableTotal = tables.length;
  const occupiedTables = tables.filter((table) =>
    ['OCCUPIED', 'Ocupada', 'OCUPADA'].includes(table.status)
  ).length;
  const freeTables = tables.filter((table) =>
    ['FREE', 'Libre', 'LIBRE'].includes(table.status)
  ).length;
  const reservedTables = tables.filter((table) =>
    ['RESERVED', 'Reservada', 'RESERVADA'].includes(table.status)
  ).length;

  const salonOrders = orderList.filter((order) =>
    String(order.channelLabel || order.channel || '').toLowerCase().includes('sal')
  ).length;
  const deliveryOrders = orderList.filter((order) =>
    String(order.channelLabel || order.channel || '').toLowerCase().includes('delivery')
  ).length;
  const whatsappOrders = orderList.filter((order) =>
    String(order.channelLabel || order.channel || '').toLowerCase().includes('whatsapp')
  ).length;

  const chartPoints = [0, 4, 8, 13, 19, 28, 36, 48, 58, 65, 72, 79, 84, 90, 96, 100];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ventas del día</p>
          <p className="mt-2 text-2xl font-bold">
            S/ {Number(reportMetrics.salesToday || 0).toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Ingresos registrados hoy</p>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos del día</p>
          <p className="mt-2 text-2xl font-bold">{reportMetrics.ordersToday || 0}</p>
          <p className="mt-2 text-xs text-slate-400">Pedidos cobrados hoy</p>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ticket promedio</p>
          <p className="mt-2 text-2xl font-bold">
            S/ {Number(reportMetrics.ticketToday || 0).toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Promedio por pedido</p>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos activos</p>
          <p className="mt-2 text-2xl font-bold">{activeOrders}</p>
          <p className="mt-2 text-xs text-slate-400">En proceso</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className={`${panelCard} xl:col-span-5`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Ventas</h3>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              Hoy
            </span>
          </div>

          <div className="mt-6 h-56">
            <svg viewBox="0 0 520 220" className="h-full w-full">
              {[40, 80, 120, 160].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              <polyline
                fill="none"
                stroke="#0f172a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartPoints
                  .map((value, index) => {
                    const x = (index / (chartPoints.length - 1)) * 520;
                    const y = 190 - value * 1.45;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              <circle cx="330" cy="74" r="6" fill="#0f172a" />
            </svg>
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>00:00</span>
            <span>08:00</span>
            <span>16:00</span>
            <span>24:00</span>
          </div>
        </div>

        <div className={`${panelCard} xl:col-span-4`}>
          <h3 className="text-xl font-semibold">Estado de mesas</h3>

          <div className="mt-6 flex flex-col items-center justify-center gap-5">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0f172a 0 ${tableTotal ? (occupiedTables / tableTotal) * 100 : 0}%, #64748b 0 ${tableTotal ? ((occupiedTables + freeTables) / tableTotal) * 100 : 0}%, #cbd5e1 0 100%)`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center">
                <div>
                  <p className="text-2xl font-bold">{tableTotal}</p>
                  <p className="text-xs text-slate-400">Mesas</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid w-full grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-lg font-bold text-slate-900">{freeTables}</p>
                <p className="mt-1 text-xs text-slate-500">Disponibles</p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-lg font-bold text-slate-900">{occupiedTables}</p>
                <p className="mt-1 text-xs text-slate-500">Ocupadas</p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-lg font-bold text-slate-900">{reservedTables}</p>
                <p className="mt-1 text-xs text-slate-500">Reservadas</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${panelCard} xl:col-span-3`}>
          <h3 className="text-xl font-semibold">Canales de venta</h3>

          <div className="mt-6 flex items-center gap-6">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0f172a 0 ${orderList.length ? (salonOrders / orderList.length) * 100 : 0}%, #64748b 0 ${orderList.length ? ((salonOrders + deliveryOrders) / orderList.length) * 100 : 0}%, #cbd5e1 0 100%)`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center">
                <div>
                  <p className="text-2xl font-bold">{orderList.length}</p>
                  <p className="text-xs text-slate-400">Pedidos</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{salonOrders}</span> salón
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{deliveryOrders}</span> delivery
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{whatsappOrders}</span> WhatsApp
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className={`${panelCard} xl:col-span-8`}>
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Pedidos recientes</h3>
              <p className="mt-1 text-sm text-slate-500">
                Últimos movimientos del restaurante
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/cashier')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[12px] uppercase tracking-[0.18em] text-slate-400">
                  <th className="py-3 pr-4 font-semibold">Pedido</th>
                  <th className="py-3 pr-4 font-semibold">Cliente</th>
                  <th className="py-3 pr-4 font-semibold">Canal</th>
                  <th className="py-3 pr-4 font-semibold">Estado</th>
                  <th className="py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody>
                {orderList.length ? (
                  orderList.slice(0, 6).map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-900">
                          {order.orderNumber}
                        </p>
                      </td>

                      <td className="py-4 pr-4">
                        <p className="font-medium text-slate-700">
                          {order.customerLabel ||
                            order.customer?.fullName ||
                            'Sin referencia'}
                        </p>
                      </td>

                      <td className="py-4 pr-4">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {order.channelLabel || order.channel || '-'}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(
                            order.status === 'PAID'
                              ? 'Pagado'
                              : order.status === 'CONFIRMED'
                              ? 'Confirmado'
                              : 'Pendiente'
                          )}`}
                        >
                          {order.status === 'PAID'
                            ? 'Pagado'
                            : order.status === 'CONFIRMED'
                            ? 'Confirmado'
                            : 'Pendiente'}
                        </span>
                      </td>

                      <td className="py-4 text-right font-semibold text-slate-900">
                        S/ {Number(order.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10">
                      <EmptyState
                        title="Sin pedidos registrados"
                        text="Todavía no hay pedidos para mostrar."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Pedidos registrados</p>
              <p className="mt-1 text-lg font-bold">{orderList.length}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Comensales atendidos</p>
              {/* Legacy summed `order.guests || order.people`, neither of which exists on the
                  wire order shape, so this always displayed 0 — preserved as-is (see engram note). */}
              <p className="mt-1 text-lg font-bold">0</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Tiempo promedio de atención</p>
              <p className="mt-1 text-lg font-bold">18 min</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Ventas por hora pico</p>
              <p className="mt-1 text-lg font-bold">12:00 - 14:00</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className={panelCard}>
            <div>
              <h3 className="text-xl font-semibold">Métodos de pago</h3>
              <p className="mt-1 text-sm text-slate-500">
                Distribución de ingresos
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {reportMetrics.paymentByMethod.length ? (
                reportMetrics.paymentByMethod.slice(0, 4).map((item) => {
                  const maxTotal = reportMetrics.paymentByMethod[0]?.total || 1;
                  const percentage = Math.max(
                    10,
                    Math.round((Number(item.total || 0) / maxTotal) * 100)
                  );

                  return (
                    <div key={item.method}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.method}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          S/ {Number(item.total || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="Sin pagos"
                  text="Todavía no hay pagos para mostrar."
                />
              )}
            </div>
          </div>

          <div className={panelCard}>
            <div>
              <h3 className="text-xl font-semibold">Productos más vendidos</h3>
              <p className="mt-1 text-sm text-slate-500">Ranking del día</p>
            </div>

            <div className="mt-5 space-y-3">
              {reportMetrics.topProducts.length ? (
                reportMetrics.topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Producto vendido
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-500">
                      {product.qty} vendidos
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Sin productos"
                  text="Todavía no hay productos vendidos."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

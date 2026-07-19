import type { OrderListItem, Payment } from '@restaurante/shared';

// Pure port of App.jsx's legacy `reportMetrics` useMemo (plus its date helpers).
// Keeping the whole computation in a plain function (a) makes it testable and
// (b) resolves the react-hooks purity warning the legacy code had: `Date.now()`
// / `new Date()` no longer appear inside a component render — callers get a
// fresh `now` per recomputation via the default parameter, exactly like the
// legacy memo recomputed dates whenever orders/payments changed.

export interface PaymentMethodTotal {
  method: string;
  total: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  total: number;
}

export interface ReportMetrics {
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  ticketToday: number;
  ticketWeek: number;
  ticketMonth: number;
  paymentByMethod: PaymentMethodTotal[];
  topProducts: TopProduct[];
}

function getStartOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfWeek(now: Date): Date {
  const day = now.getDay(); // 0 domingo, 1 lunes...
  const diff = day === 0 ? 6 : day - 1; // semana desde lunes
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
}

function getStartOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function normalizeAmount(value: unknown): number {
  return Number(value || 0);
}

function normalizeMethodLabel(method: string): string {
  if (method === 'YAPE') return 'Yape';
  if (method === 'CASH') return 'Efectivo';
  if (method === 'CARD') return 'Tarjeta';
  return method || '-';
}

const PAID_LIKE_STATUSES: string[] = ['PAID', 'COMPLETED'];

export function computeReportMetrics(
  orderList: OrderListItem[],
  paymentRows: Payment[],
  now: Date = new Date()
): ReportMetrics {
  const todayStart = getStartOfToday(now);
  const weekStart = getStartOfWeek(now);
  const monthStart = getStartOfMonth(now);

  // Legacy also matched status 'COMPLETED', which is not part of the wire
  // OrderStatus union — kept via a plain string list for exact parity.
  const paidOrders = orderList.filter(
    (order) => PAID_LIKE_STATUSES.includes(order.status) || Number(order.total || 0) > 0
  );

  const paymentsSource = paymentRows.map((payment) => ({
    ...payment,
    parsedAmount: normalizeAmount(payment.amount),
    parsedDate: new Date(payment.createdAt || payment.paidAt || now.getTime()),
  }));

  const paymentsToday = paymentsSource.filter((payment) => payment.parsedDate >= todayStart);
  const paymentsWeek = paymentsSource.filter((payment) => payment.parsedDate >= weekStart);
  const paymentsMonth = paymentsSource.filter((payment) => payment.parsedDate >= monthStart);

  const salesToday = paymentsToday.reduce((sum, payment) => sum + payment.parsedAmount, 0);
  const salesWeek = paymentsWeek.reduce((sum, payment) => sum + payment.parsedAmount, 0);
  const salesMonth = paymentsMonth.reduce((sum, payment) => sum + payment.parsedAmount, 0);

  const ordersToday = paidOrders.filter((order) => {
    const date = new Date(order.updatedAt || order.createdAt || now.getTime());
    return date >= todayStart;
  });

  const ordersWeek = paidOrders.filter((order) => {
    const date = new Date(order.updatedAt || order.createdAt || now.getTime());
    return date >= weekStart;
  });

  const ordersMonth = paidOrders.filter((order) => {
    const date = new Date(order.updatedAt || order.createdAt || now.getTime());
    return date >= monthStart;
  });

  const ticketToday = ordersToday.length ? salesToday / ordersToday.length : 0;
  const ticketWeek = ordersWeek.length ? salesWeek / ordersWeek.length : 0;
  const ticketMonth = ordersMonth.length ? salesMonth / ordersMonth.length : 0;

  const paymentByMethodMap = paymentsSource.reduce<Record<string, number>>((acc, payment) => {
    const key = normalizeMethodLabel(payment.method);
    acc[key] = (acc[key] || 0) + payment.parsedAmount;
    return acc;
  }, {});

  const paymentByMethod = Object.entries(paymentByMethodMap)
    .map(([method, total]) => ({ method, total }))
    .sort((a, b) => b.total - a.total);

  const productMap: Record<string, TopProduct> = {};

  orderList.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach((item) => {
      // Legacy fell back through `item.product?.name`, `item.menuItem?.name`,
      // `item.inventoryItem?.name` and `item.name` — none of which exist on the
      // wire OrderItem shape, so only the snapshot fallback was ever reachable.
      const name = item.productNameSnapshot || 'Producto';

      const qty = Number(item.qty || 0);
      const total = Number(item.total || item.subtotal || 0);

      if (!productMap[name]) {
        productMap[name] = { name, qty: 0, total: 0 };
      }

      productMap[name].qty += qty;
      productMap[name].total += total;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => {
      if (b.qty !== a.qty) return b.qty - a.qty;
      return b.total - a.total;
    })
    .slice(0, 10);

  return {
    salesToday,
    salesWeek,
    salesMonth,
    ordersToday: ordersToday.length,
    ordersWeek: ordersWeek.length,
    ordersMonth: ordersMonth.length,
    ticketToday,
    ticketWeek,
    ticketMonth,
    paymentByMethod,
    topProducts,
  };
}

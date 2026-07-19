import { useMemo } from 'react';
import { usePaymentRows } from '../cashier/hooks';
import { useOrders } from '../pos/hooks';
import { computeReportMetrics, type ReportMetrics } from './metrics';

/**
 * Legacy App.jsx `reportMetrics` over the `['orders']` query cache. The date
 * baseline is resolved inside `computeReportMetrics` (fresh per recomputation),
 * so no impure Date call happens directly in render — same recompute cadence
 * as the legacy memo (whenever orders/payments change).
 */
export function useReportMetrics(): ReportMetrics {
  const ordersQuery = useOrders();
  const paymentRows = usePaymentRows();

  return useMemo(
    () => computeReportMetrics(ordersQuery.data ?? [], paymentRows),
    [ordersQuery.data, paymentRows]
  );
}

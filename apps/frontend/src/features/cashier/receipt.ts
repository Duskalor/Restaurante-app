import type { OrderListItem } from '@restaurante/shared';
import type { CashierPaymentRow } from './hooks';

export interface ReceiptBusinessConfig {
  businessName: string;
  ruc: string;
  address: string;
  phone: string;
  logoUrl: string;
}

/**
 * Opens a print-ready receipt window for `payment`. Ported verbatim from App.jsx's
 * legacy `handlePrintReceipt`, with one adjustment: the original's `tableLabel`/
 * `customerName` fallback chains read `payment.table`, `payment.tableName`,
 * `payment.tableLabel`, `order.table?.label`, `order.tableName`, `order.tableLabel`,
 * `order.customerLabel` and `payment.payment_code` — none of which exist on any
 * wire type (`Table` has no `label`, `Order`/`Payment` carry none of the others).
 * Those branches were always unreachable dead code, not behavior; this version
 * keeps only the reachable fallbacks, which is byte-for-byte the same computed
 * output for every real payment. `receiptType` staying `null` (see hooks.ts) is
 * the one bug that IS observable, and it is preserved: the badge always shows
 * "BOLETA_SIMPLE" here too — this function doesn't touch that field at all.
 */
export function printReceipt(
  payment: CashierPaymentRow,
  orders: OrderListItem[],
  businessConfig: ReceiptBusinessConfig,
  selectedTable: string
): string | null {
  const order = orders.find((item) => item.id === payment.orderId) || payment.order || null;

  if (!order) {
    return 'No se encontró la orden para imprimir.';
  }

  const restaurantName = businessConfig.businessName || 'SmartMesa Restaurante';
  const restaurantRuc = businessConfig.ruc || '';
  const restaurantAddress = businessConfig.address || '';
  const restaurantPhone = businessConfig.phone || '';
  const restaurantLogo = businessConfig.logoUrl || '';

  const tableLabel =
    order.table?.name ||
    (order.table?.number ? `Mesa ${order.table.number}` : '') ||
    selectedTable ||
    'Sin mesa';

  const customerName = order.customer?.fullName || payment.customer?.fullName || '';

  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items.length
    ? items
        .map((item) => {
          const productName = item.productNameSnapshot || 'Producto';
          const qty = Number(item.qty || 1);
          const lineTotal = Number(item.total ?? item.subtotal ?? Number(item.unitPrice || 0) * qty);

          return `
            <tr>
              <td style="padding:4px 0; font-size:12px;">
                ${productName} x${qty}
              </td>
              <td style="padding:4px 0; font-size:12px; text-align:right;">
                S/ ${lineTotal.toFixed(2)}
              </td>
            </tr>
          `;
        })
        .join('')
    : `
      <tr>
        <td style="padding:4px 0; font-size:12px;">Producto</td>
        <td style="padding:4px 0; font-size:12px; text-align:right;">
          S/ ${Number(payment.amount || order.total || 0).toFixed(2)}
        </td>
      </tr>
    `;

  const paymentLabel =
    payment.method === 'YAPE'
      ? 'Yape'
      : payment.method === 'CARD'
      ? 'Tarjeta'
      : payment.method === 'CASH'
      ? 'Efectivo'
      : payment.method || 'Efectivo';

  const printDate = new Date(
    payment.createdAt || order.updatedAt || order.createdAt || Date.now()
  ).toLocaleString();

  const receiptHtml = `
    <html>
      <head>
        <title>Comprobante ${order.orderNumber || payment.orderCode || ''}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #000;
          }
          .ticket {
            width: 320px;
            margin: 0 auto;
          }
          .center {
            text-align: center;
          }
          .logo {
            text-align: center;
            margin-bottom: 10px;
          }
          .logo img {
            max-width: 90px;
            max-height: 90px;
            object-fit: contain;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 6px;
          }
          .subtext {
            font-size: 12px;
            margin: 2px 0;
          }
          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .total {
            font-size: 20px;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
            }
            .ticket {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          ${
            restaurantLogo
              ? `
            <div class="logo">
              <img src="${restaurantLogo}" alt="Logo negocio" />
            </div>
          `
              : ''
          }

          <div class="center title">${restaurantName}</div>

          ${
            restaurantRuc
              ? `<div class="center subtext">RUC: ${restaurantRuc}</div>`
              : ''
          }

          ${
            restaurantAddress
              ? `<div class="center subtext">${restaurantAddress}</div>`
              : ''
          }

          ${
            restaurantPhone
              ? `<div class="center subtext">Tel: ${restaurantPhone}</div>`
              : ''
          }

          <div class="line"></div>

          <div class="row">
            <strong>${order.orderNumber || payment.orderCode || 'ORDEN'}</strong>
            <span>${printDate}</span>
          </div>

          <div class="row">
            <span>Mesa:</span>
            <span>${tableLabel}</span>
          </div>

          ${
            customerName
              ? `
            <div class="row">
              <span>Cliente:</span>
              <span>${customerName}</span>
            </div>
          `
              : ''
          }

          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <th style="text-align:left; font-size:12px; padding-bottom:6px;">Detalle</th>
                <th style="text-align:right; font-size:12px; padding-bottom:6px;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="line"></div>

          <div class="row">
            <span>Método de pago:</span>
            <span>${paymentLabel}</span>
          </div>

          <div class="row total">
            <span>Total:</span>
            <span>S/ ${Number(payment.amount || order.total || 0).toFixed(2)}</span>
          </div>

          <div class="line"></div>

          <div class="center" style="margin-top:18px; font-size:15px;">
            Gracias por su compra
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    return 'No se pudo abrir la ventana de impresión.';
  }

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);

  return null;
}

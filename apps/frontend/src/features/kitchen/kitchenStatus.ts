import type { KitchenItemStatus } from '@restaurante/shared';

export function getKitchenStatusLabel(status: KitchenItemStatus | string): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'PREPARING':
      return 'En preparación';
    case 'READY':
      return 'Listo';
    case 'SERVED':
      return 'Entregado';
    default:
      return status || 'Sin estado';
  }
}

export function getKitchenStatusBadgeClass(status: KitchenItemStatus | string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'PREPARING':
      return 'bg-slate-900 text-white border border-slate-900';
    case 'READY':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'SERVED':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

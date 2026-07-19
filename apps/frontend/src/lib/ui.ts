// Shared Tailwind class fragments reused across the App shell and feature views.
// Kept as plain string constants (no `cn()` helper is installed in this project yet).

export const panelCard =
  'rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]';

export const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none';

const BADGE_CLASS_BY_STATUS: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
  Pagado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Libre: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Ocupada: 'bg-rose-100 text-rose-800 border-rose-200',
  Reservada: 'bg-violet-100 text-violet-800 border-violet-200',
  Limpieza: 'bg-sky-100 text-sky-800 border-sky-200',
  Disponible: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'No disponible': 'bg-slate-100 text-slate-800 border-slate-200',
  Yape: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  Efectivo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Tarjeta: 'bg-slate-100 text-slate-800 border-slate-200',
  ADMIN: 'bg-slate-100 text-slate-800 border-slate-200',
  CAJA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  MOZO: 'bg-blue-100 text-blue-800 border-blue-200',
  SUPERVISOR: 'bg-violet-100 text-violet-800 border-violet-200',
};

export function badgeClass(status: string): string {
  return BADGE_CLASS_BY_STATUS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

import { badgeClass } from '../../lib/ui';
import type { MappedTable } from './hooks';

interface TableCardProps {
  table: MappedTable;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function TableCard({ table, isSelected, onSelect, onDelete }: TableCardProps) {
  const isOccupied = String(table.statusLabel || '').toLowerCase() === 'ocupada';

  return (
    <button
      onClick={onSelect}
      className={`rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isSelected
          ? 'border-slate-900 bg-slate-50 shadow-md'
          : isOccupied
          ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xl font-bold text-slate-900">{table.label}</h4>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            Mesa disponible para atención
          </p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(table.statusLabel)}`}>
          {table.statusLabel}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Capacidad
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{table.capacity} personas</p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Área</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {table.diningArea?.name || 'General'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Toca para abrir punto de venta</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            Eliminar
          </button>

          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            Abrir
          </span>
        </div>
      </div>
    </button>
  );
}

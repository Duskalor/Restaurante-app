import type { ReactNode } from 'react';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  note: ReactNode;
}

export default function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}

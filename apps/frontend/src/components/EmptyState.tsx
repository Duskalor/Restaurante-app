import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: ReactNode;
  text: ReactNode;
}

export default function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

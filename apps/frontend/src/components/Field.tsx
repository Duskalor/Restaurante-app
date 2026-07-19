import type { ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
}

export default function Field({ label, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

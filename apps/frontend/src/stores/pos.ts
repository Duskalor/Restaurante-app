import { create } from 'zustand';

/**
 * Cross-feature UI state for "which table is currently selected".
 *
 * Tables view sets it (tapping a table), POS view reads/writes it (the mesa
 * picker inside the cart panel), Cashier reads it for "Cobro rápido", and the
 * App shell's header reads it for "Nuevo pedido" (`selectedTableObj`,
 * `currentOrderEntity`). A zustand store keeps them in sync without
 * prop-drilling across sibling routes.
 */
interface PosStore {
  selectedTable: string;
  setSelectedTable: (table: string) => void;
}

export const usePosStore = create<PosStore>((set) => ({
  selectedTable: 'Mesa 1',
  setSelectedTable: (table) => set({ selectedTable: table }),
}));

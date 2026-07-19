import type { ReactNode } from 'react';

/** Sidebar entry for the authenticated shell (App.tsx). */
export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

// Icons and labels ported verbatim from the legacy App.jsx `allNav`.
export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    key: 'pos',
    label: 'Punto de venta',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" /></svg>,
  },
  {
    key: 'tables',
    label: 'Mesas',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8a1 1 0 00-1-1h-4v3zM4 8h5v3H4V8z" clipRule="evenodd" /></svg>,
  },
  {
    key: 'kitchen',
    label: 'Cocina',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.79-.61 1.731-.82 2.66l-.044.197c-.046.196-.105.58-.134.95-.024.31-.053.73-.053 1.202v.032c0 .326.046.586.09.76.044.174.072.247.114.364.043.117.127.326.295.542.167.215.42.443.81.443.391 0 .643-.228.81-.443.168-.216.252-.425.295-.542.042-.117.07-.19.114-.364.044-.174.09-.434.09-.76v-.032c0-.472-.029-.892-.053-1.202-.029-.37-.088-.754-.134-.95l-.044-.197c-.21-.93-.486-1.87-.82-2.66-.167-.403-.356-.786-.57-1.116-.208-.322-.477-.65-.822-.88zM6 10a4 4 0 008 0c0-.82-.218-1.584-.59-2.245-.25-.434-.555-.838-.888-1.2A2.99 2.99 0 0113 7.5c0 1.22-.767 2.257-1.83 2.76A1.996 1.996 0 0110 11a2 2 0 01-1.17-.38A2.992 2.992 0 018.83 7.5c0-.66.21-1.27.56-1.76a7.48 7.48 0 00-1.07 1.246A3.992 3.992 0 006 10z" clipRule="evenodd" /></svg>,
  },
  {
    key: 'cashier',
    label: 'Caja',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
  },
  {
    key: 'inventory',
    label: 'Inventario',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
  },
  {
    key: 'customers',
    label: 'Clientes',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>,
  },
  {
    key: 'reports',
    label: 'Reportes',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
  },
  {
    key: 'settings',
    label: 'Configuración',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
  },
];

/** Kitchen users only see the kitchen module — same single entry (no icon) as legacy `nav`. */
export const KITCHEN_NAV_ITEMS: NavItem[] = [{ key: 'kitchen', label: 'Cocina', icon: null }];

export const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Vista general del negocio',
  pos: 'Punto de venta y registro de pedidos',
  tables: 'Gestión de mesas y consumo',
  kitchen: 'Comandas y estado de preparación',
  cashier: 'Caja, cobros y comprobantes',
  inventory: 'Control de productos e insumos',
  customers: 'Clientes y operación comercial',
  reports: 'Indicadores y desempeño',
  settings: 'Configuración del sistema',
};

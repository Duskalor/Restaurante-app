import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import './index.css';
import { LoginRoute, RequireAuth } from './features/auth/guards';
import CashierView from './features/cashier/CashierView';
import CustomersView from './features/customers/CustomersView';
import DashboardView from './features/dashboard/DashboardView';
import InventoryView from './features/inventory/InventoryView';
import KitchenView from './features/kitchen/KitchenView';
import PosView from './features/pos/PosView';
import ReportsView from './features/reports/ReportsView';
import SettingsView from './features/settings/SettingsView';
import TablesView from './features/tables/TablesView';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/login', Component: LoginRoute },
  {
    Component: RequireAuth,
    children: [
      { path: '/dashboard', Component: DashboardView },
      { path: '/pos', Component: PosView },
      { path: '/tables', Component: TablesView },
      { path: '/kitchen', Component: KitchenView },
      { path: '/cashier', Component: CashierView },
      { path: '/inventory', Component: InventoryView },
      { path: '/customers', Component: CustomersView },
      { path: '/reports', Component: ReportsView },
      { path: '/settings', Component: SettingsView },
    ],
  },
  // Unknown paths (including the legacy /saas URL — super admins get the SaaS
  // panel from the App shell at any authenticated route) land on the dashboard.
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);

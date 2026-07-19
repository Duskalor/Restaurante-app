import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import SaaSPanel from './features/saas/SaaSPanel';
import { kitchenOrdersQueryKey } from './features/kitchen/hooks';
import { useCreateOrder, useCurrentOrder } from './features/pos/hooks';
import { KITCHEN_NAV_ITEMS, NAV_ITEMS, SECTION_TITLES } from './lib/nav';
import { useAuthStore } from './stores/auth';
import { usePosStore } from './stores/pos';

const VIEW_KEYS = [
  'dashboard',
  'pos',
  'tables',
  'kitchen',
  'cashier',
  'inventory',
  'customers',
  'reports',
  'settings',
];

/** Shared with routed views (TablesView) via `<Outlet context>` / `useOutletContext`. */
export interface ShellOutletContext {
  /** The header's "Nuevo pedido" action — creates an order for the selected table. */
  onCreateOrder: () => void;
  isCreatingOrder: boolean;
}

/**
 * Thin authenticated shell: sidebar + header + notification banners around an
 * `<Outlet/>`. All domain UI lives in `features/*` views mounted by main.tsx's
 * routes; the only business action left here is order creation, because the
 * persistent header owns the "Nuevo pedido" button.
 */
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pathView = location.pathname.replace(/^\//, '');
  const activeView = VIEW_KEYS.includes(pathView) ? pathView : 'dashboard';

  const selectedTable = usePosStore((state) => state.selectedTable);
  const setSelectedTable = usePosStore((state) => state.setSelectedTable);
  const token = useAuthStore((state) => state.token) ?? '';
  const authUser = useAuthStore((state) => state.user);
  const storeLogout = useAuthStore((state) => state.logout);
  const isKitchenUser = (authUser?.role?.name || '') === 'COCINA';

  const [connectionError, setConnectionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { mappedTables, selectedTableObj, currentOrderEntity, isLoading } =
    useCurrentOrder(selectedTable);
  const createOrder = useCreateOrder();

  // Legacy `loadProtectedData` auto-selected the first table whenever the
  // current selection didn't match any loaded table — now driven by the
  // `['tables']` query cache instead of the manual fetch.
  useEffect(() => {
    if (
      mappedTables.length &&
      !mappedTables.some((table) => table.label === selectedTable)
    ) {
      setSelectedTable(mappedTables[0].label);
    }
  }, [mappedTables, selectedTable, setSelectedTable]);

  const setMessage = (text: string) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(''), 2500);
  };

  const handleCreateOrder = () => {
    if (!selectedTableObj || !authUser) return;

    if (currentOrderEntity) {
      setActionMessage('Esta mesa ya tiene un pedido activo.');
      return;
    }

    createOrder.mutate(
      {
        branchId: authUser.branchId,
        tableId: selectedTableObj.id,
        waiterId: authUser.id,
        orderType: 'DINE_IN',
        channel: 'SALON',
        guestsCount: selectedTableObj.capacity,
        notes: `Pedido creado desde interfaz para ${selectedTableObj.label}`,
      },
      {
        onSuccess: () => {
          navigate('/pos');
          setMessage('Pedido creado correctamente.');
        },
        onError: (error) => {
          setConnectionError(
            error instanceof Error && error.message ? error.message : 'Error al crear pedido'
          );
        },
      }
    );
  };

  const handleLogout = () => {
    storeLogout();
    queryClient.setQueryData(kitchenOrdersQueryKey, []);
    setConnectionError('');
  };

  if (authUser?.isSuperAdmin) {
    return <SaaSPanel token={token} onLogout={handleLogout} />;
  }

  // Kitchen-role forcing (legacy `getSafeActiveView`): kitchen users only ever
  // see the kitchen module, whatever URL they land on.
  if (isKitchenUser && activeView !== 'kitchen') {
    return <Navigate to="/kitchen" replace />;
  }

  const nav = isKitchenUser ? KITCHEN_NAV_ITEMS : NAV_ITEMS;

  const outletContext: ShellOutletContext = {
    onCreateOrder: handleCreateOrder,
    isCreatingOrder: createOrder.isPending,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0)] text-slate-900">
      <div className="flex min-h-screen">
        {/* CAPA OSCURA DE FONDO EN MÓVIL (Se muestra cuando el menú está abierto) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ASIDE RESPONSIVO CORREGIDO */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/50 bg-slate-950 text-white transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 ${
            mobileMenuOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'
          } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
        >
          {/* Cabecera del Sidebar */}
          <div className={`border-b border-slate-800 p-6 flex items-center justify-between ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="overflow-hidden">
              <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase">
                SmartMesa
              </div>
              {(!isSidebarCollapsed || mobileMenuOpen) && (
                <h1 className="mt-4 text-3xl font-bold">SmartMesa</h1>
              )}
            </div>

            {/* Botón para colapsar en PC / Cerrar en Móvil */}
            <button
              onClick={() => {
                if (mobileMenuOpen) {
                  setMobileMenuOpen(false);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-slate-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
            <div className="space-y-2">
              {nav.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(`/${item.key}`);
                    setMobileMenuOpen(false); // Cierra automáticamente el menú al seleccionar una opción
                  }}
                  className={`w-full flex items-center rounded-2xl py-3 text-sm font-medium transition-all ${
                    activeView === item.key
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900'
                  } ${isSidebarCollapsed ? 'lg:justify-center lg:px-0' : 'px-4 justify-start'}`}
                >
                  <div className={`flex items-center justify-center shrink-0 ${isSidebarCollapsed ? 'lg:mr-0' : 'mr-3'} w-7 h-7 rounded-md ${
                    activeView === item.key ? 'bg-slate-200 text-slate-900' : 'bg-white/10 text-white'
                  }`}>
                    {item.icon}
                  </div>

                  {(!isSidebarCollapsed || mobileMenuOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Pie del Sidebar */}
          <div className="border-t border-slate-800 p-4">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg overflow-hidden">
              <p className="text-sm font-semibold truncate">Sesión activa</p>
              <p className="mt-1 text-xs text-slate-400 truncate">
                {authUser?.firstName} · {authUser?.role?.name}
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 flex items-center justify-center gap-2"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-white/60 bg-white/70 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* IZQUIERDA: BOTÓN MÓVIL Y TÍTULO */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition lg:hidden"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Software de Restaurante</h2>
                  <p className="text-xs text-slate-500 sm:text-sm">{SECTION_TITLES[activeView]}</p>
                </div>
              </div>

              {/* DERECHA: BÚSQUEDA Y BOTONES (En 1 sola línea en PC) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none sm:w-64 lg:w-80"
                  placeholder="Buscar pedido, cliente o mesa"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateOrder}
                    disabled={createOrder.isPending}
                    className="flex-1 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 sm:flex-none"
                  >
                    Nuevo pedido
                  </button>
                  <button className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 sm:flex-none">
                    Imprimir comanda
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-8">
            {connectionError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {connectionError}
              </div>
            ) : null}

            {actionMessage ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
                Cargando datos del backend...
              </div>
            ) : null}

            <Outlet context={outletContext} />
          </div>
        </main>
      </div>
    </div>
  );
}

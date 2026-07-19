import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { SaasRestaurant } from '@restaurante/shared';
import Field from '../../components/Field';
import { ApiError, apiFetch } from '../../lib/api';

interface SaaSPanelProps {
  token: string;
  onLogout: () => void;
}

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const getLatestSubscription = (restaurant: SaasRestaurant | null) => {
  if (!restaurant?.subscriptions?.length) return null;
  return restaurant.subscriptions[0];
};

// Module-scope on purpose: the day-diff against Date.now() is inherently
// time-dependent (legacy behavior) and must stay out of component render
// for the react-hooks purity rule.
const getDaysRemaining = (restaurant: SaasRestaurant | null) => {
  const subscription = getLatestSubscription(restaurant);
  const endValue = subscription?.endsAt || restaurant?.expiresAt;
  if (!endValue) return null;
  const endDate = new Date(endValue);
  if (Number.isNaN(endDate.getTime())) return null;
  const diff = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getRemainingLabel = (restaurant: SaasRestaurant | null) => {
  const days = getDaysRemaining(restaurant);
  if (days == null) return 'Sin fecha';
  if (days < 0) return `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
};

export default function SaaSPanel({ token, onLogout }: SaaSPanelProps) {
  const [restaurants, setRestaurants] = useState<SaasRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<SaasRestaurant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<SaasRestaurant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaasRestaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    subdomain: '',
    ruc: '',
    phone: '',
    address: '',
    planType: 'TRIMESTRAL',
    amount: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    branchName: 'Sucursal Principal',
    branchCode: '',
  });

  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedRestaurantToRenew, setSelectedRestaurantToRenew] =
    useState<SaasRestaurant | null>(null);
  const [renewForm, setRenewForm] = useState<{ plan: string; amount: string | number }>({
    plan: 'TRIMESTRAL',
    amount: 150,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<SaasRestaurant[]>('/saas/restaurants');
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Error al cargar restaurantes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // Legacy imperative load-on-mount kept as-is (this panel is intentionally
      // NOT migrated to React Query yet — mechanical apiFetch swap only).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRestaurants();
    }
  }, [token]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const autoFillFromName = (value: string) => {
    const clean = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '');

    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || clean,
      subdomain: prev.subdomain || clean,
      branchCode: prev.branchCode || `${clean}-main`,
    }));
  };

  const resetCreateForm = () => {
    setForm({
      name: '',
      slug: '',
      subdomain: '',
      ruc: '',
      phone: '',
      address: '',
      planType: 'TRIMESTRAL',
      amount: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      branchName: 'Sucursal Principal',
      branchCode: '',
    });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        subdomain: form.subdomain,
        ruc: form.ruc || null,
        phone: form.phone || null,
        address: form.address || null,
        logoUrl: null,
        planType: form.planType,
        amount: form.amount ? Number(form.amount) : null,
        startsAt: new Date().toISOString(),
        endsAt:
          form.planType === 'ANUAL'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        branchName: form.branchName,
        branchCode: form.branchCode,
      };

      await apiFetch('/saas/restaurants', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess('Restaurante creado correctamente.');
      resetCreateForm();
      await fetchRestaurants();
    } catch (err) {
      setError(errorMessage(err, 'Error al crear restaurante'));
    } finally {
      setSaving(false);
    }
  };

  const getMainAdmin = (restaurant: SaasRestaurant | null) => {
    if (!restaurant?.users?.length) return null;
    return restaurant.users[0];
  };

  const getMainBranch = (restaurant: SaasRestaurant | null) => {
    if (!restaurant?.branches?.length) return null;
    return restaurant.branches[0];
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('es-PE');
  };

  const formatCurrency = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    return `S/ ${num.toFixed(2)}`;
  };

  const getRestaurantDomain = (restaurant: SaasRestaurant | null) => {
    const subdomain = String(restaurant?.subdomain || '').trim();
    if (!subdomain) return '-';
    return subdomain.includes('.') ? subdomain : `${subdomain}.smartmesa.com`;
  };

  const getRestaurantStatus = (restaurant: SaasRestaurant | null) => {
    const raw = String(restaurant?.status || 'ACTIVE').toUpperCase();
    if (raw === 'SUSPENDED') return 'SUSPENDIDO';
    if (raw === 'INACTIVE') return 'INACTIVO';
    if (raw === 'DELETED') return 'ELIMINADO';
    return 'ACTIVO';
  };

  const getStatusTone = (restaurant: SaasRestaurant | null) => {
    const status = getRestaurantStatus(restaurant);
    if (status === 'SUSPENDIDO') return 'bg-slate-200 text-slate-700';
    if (status === 'INACTIVO') return 'bg-amber-100 text-amber-700';
    if (status === 'ELIMINADO') return 'bg-rose-100 text-rose-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const handleRenewSubscription = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedRestaurantToRenew) return;

    try {
      await apiFetch(`/saas/restaurants/${selectedRestaurantToRenew.id}/renew`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: renewForm.plan,
          amount: parseFloat(String(renewForm.amount)),
        }),
      });

      setRenewModalOpen(false);
      await fetchRestaurants();
      alert('Suscripción reactivada con éxito');
    } catch (err) {
      // ApiError = non-2xx response (legacy `!response.ok` branch); anything else
      // is a network-level failure (legacy catch branch).
      if (err instanceof ApiError) {
        alert('Error al procesar la renovación');
        return;
      }
      console.error('Detalle del error:', err);
      alert('Error real: ' + errorMessage(err, 'desconocido'));
    }
  };

  const openDetailsModal = (restaurant: SaasRestaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailsModal(true);
  };

  const openResetModal = (restaurant: SaasRestaurant) => {
    setResetTarget(restaurant);
    setResetForm({ newPassword: '', confirmPassword: '' });
    setShowResetModal(true);
  };

  const openDeleteModal = (restaurant: SaasRestaurant) => {
    setDeleteTarget(restaurant);
    setDeleteConfirmationText('');
    setShowDeleteModal(true);
  };

  const closeAllModals = () => {
    setShowDetailsModal(false);
    setShowResetModal(false);
    setShowDeleteModal(false);
    setSelectedRestaurant(null);
    setResetTarget(null);
    setDeleteTarget(null);
    setResetForm({ newPassword: '', confirmPassword: '' });
    setDeleteConfirmationText('');
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;

    if (!resetForm.newPassword || !resetForm.confirmPassword) {
      setError('Completa la nueva contraseña y su confirmación.');
      return;
    }

    if (resetForm.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const adminUser = getMainAdmin(resetTarget);
    if (!adminUser?.id) {
      setError('No se encontró un usuario administrador para este restaurante.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch(`/saas/restaurants/${resetTarget.id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({
          userId: adminUser.id,
          newPassword: resetForm.newPassword,
        }),
      });

      setSuccess('Contraseña restablecida correctamente.');
      closeAllModals();
      await fetchRestaurants();
    } catch (err) {
      setError(errorMessage(err, 'Error al restablecer la contraseña'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteTarget) return;

    if (deleteConfirmationText !== 'ELIMINAR') {
      setError('Debes escribir ELIMINAR para confirmar.');
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch(`/saas/restaurants/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      setSuccess('Restaurante eliminado correctamente.');
      closeAllModals();
      await fetchRestaurants();
    } catch (err) {
      setError(errorMessage(err, 'Error al eliminar restaurante'));
    } finally {
      setDeleting(false);
    }
  };

  const restaurantInDetails = selectedRestaurant || null;
  const detailsAdmin = restaurantInDetails ? getMainAdmin(restaurantInDetails) : null;
  const detailsBranch = restaurantInDetails ? getMainBranch(restaurantInDetails) : null;
  const detailsSubscription = restaurantInDetails
    ? getLatestSubscription(restaurantInDetails)
    : null;

  const filteredRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const admin = getMainAdmin(restaurant);
      const status = getRestaurantStatus(restaurant);

      const matchesSearch =
        !term ||
        restaurant.name?.toLowerCase().includes(term) ||
        restaurant.slug?.toLowerCase().includes(term) ||
        restaurant.subdomain?.toLowerCase().includes(term) ||
        restaurant.ruc?.toLowerCase().includes(term) ||
        admin?.email?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'TODOS' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [restaurants, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const active = restaurants.filter((item) => getRestaurantStatus(item) === 'ACTIVO').length;
    const suspended = restaurants.filter(
      (item) => getRestaurantStatus(item) === 'SUSPENDIDO'
    ).length;
    const annual = restaurants.filter((item) => {
      const subscription = getLatestSubscription(item);
      const plan = subscription?.planType || item?.planType || '';
      return String(plan).toUpperCase() === 'ANUAL';
    }).length;
    const monthlyRevenue = restaurants.reduce((acc, restaurant) => {
      if (restaurant.subscriptions && restaurant.subscriptions.length > 0) {
        const totalHistorial = restaurant.subscriptions.reduce(
          (sum, sub) => sum + (Number(sub.amount) || 0),
          0
        );
        return acc + totalHistorial;
      }
      // Restaurant itself has no `amount` field in the API contract — only
      // Subscription does. With no subscriptions there is nothing to add.
      return acc;
    }, 0);

    return { active, suspended, annual, monthlyRevenue };
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed left-4 top-4 z-50 rounded-lg bg-slate-950 p-2 text-slate-300 transition hover:text-white lg:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>

        <aside
          className={`fixed inset-y-0 left-0 z-40 border-r border-white/50 bg-slate-950 text-white transition-all duration-300 ease-in-out lg:sticky lg:flex lg:flex-col ${
            mobileMenuOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
        >
          <div
            className={`flex items-center border-b border-slate-800 p-6 ${
              isSidebarCollapsed ? 'lg:justify-center' : 'justify-between'
            }`}
          >
            {(!isSidebarCollapsed || mobileMenuOpen) && (
              <div className="overflow-hidden">
                <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                  SmartMesa
                </div>
                <h1 className="mt-4 text-3xl font-bold">SmartMesa</h1>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden rounded-lg bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:block"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            <div className="space-y-2">
              <button
                className={`flex w-full items-center rounded-2xl bg-white py-3 text-sm font-medium text-slate-950 shadow-sm transition-all ${
                  isSidebarCollapsed ? 'lg:justify-center lg:px-0' : 'justify-start px-4'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-900 ${
                    isSidebarCollapsed ? 'lg:mr-0' : 'mr-3'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"
                    />
                  </svg>
                </div>
                {(!isSidebarCollapsed || mobileMenuOpen) && (
                  <span className="truncate">Panel SaaS</span>
                )}
              </button>
            </div>
          </nav>

          <div className="border-t border-slate-800 p-4">
            {isSidebarCollapsed && !mobileMenuOpen ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-slate-700 to-slate-800 text-lg font-bold">
                  S
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg">
                <p className="truncate text-sm font-semibold">Sesión activa</p>
                <p className="mt-1 truncate text-xs text-slate-400">Super Admin</p>
                <button
                  onClick={onLogout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white">
            <div className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">SmartMesa / Super Admin</p>
                  <h2 className="text-2xl font-bold tracking-tight">Panel de control SaaS</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Administra restaurantes, credenciales y planes desde una sola vista.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar restaurante, slug, RUC o correo..."
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 sm:w-80"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ACTIVO">Activos</option>
                    <option value="SUSPENDIDO">Suspendidos</option>
                    <option value="INACTIVO">Inactivos</option>
                    <option value="ELIMINADO">Eliminados</option>
                  </select>
                  <button
                    onClick={fetchRestaurants}
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Recargar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total restaurantes</p>
                <p className="mt-2 text-3xl font-bold">{restaurants.length}</p>
                <p className="mt-1 text-xs text-slate-400">Clientes registrados en la plataforma</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Activos</p>
                <p className="mt-2 text-3xl font-bold">{stats.active}</p>
                <p className="mt-1 text-xs text-slate-400">Restaurantes operativos</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Plan anual</p>
                <p className="mt-2 text-3xl font-bold">{stats.annual}</p>
                <p className="mt-1 text-xs text-slate-400">Clientes en suscripción anual</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-sm text-slate-300">Monto registrado</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="mt-1 text-xs text-slate-400">Suma de planes cargados</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
              <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Restaurantes registrados</h3>
                      <p className="text-sm text-slate-500">
                        Vista general de clientes, plan, estado y accesos principales.
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      Mostrando{' '}
                      <span className="font-semibold text-slate-900">
                        {filteredRestaurants.length}
                      </span>{' '}
                      de <span className="font-semibold text-slate-900">{restaurants.length}</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    Cargando restaurantes...
                  </div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No se encontraron restaurantes con esos filtros.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredRestaurants.map((restaurant) => {
                      const adminUser = getMainAdmin(restaurant);
                      const latestSubscription = getLatestSubscription(restaurant);

                      return (
                        <div key={restaurant.id} className="px-5 py-5 sm:px-6">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="truncate text-lg font-bold text-slate-900">
                                  {restaurant.name}
                                </h4>
                                <span
                                  className={`rounded-md px-3 py-1 text-xs font-semibold ${getStatusTone(restaurant)}`}
                                >
                                  {getRestaurantStatus(restaurant)}
                                </span>
                                <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  {getRemainingLabel(restaurant)}
                                </span>
                              </div>

                              <div className="mt-2 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                                <div>
                                  Dominio:{' '}
                                  <span className="font-medium text-slate-700">
                                    {getRestaurantDomain(restaurant)}
                                  </span>
                                </div>
                                <div>
                                  Plan:{' '}
                                  <span className="font-medium text-slate-700">
                                    {latestSubscription?.planType || restaurant.planType || '-'}
                                  </span>
                                </div>
                                <div>
                                  Admin:{' '}
                                  <span className="font-medium text-slate-700">
                                    {adminUser
                                      ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() ||
                                        '-'
                                      : '-'}
                                  </span>
                                </div>
                                <div>
                                  Correo:{' '}
                                  <span className="font-medium text-slate-700">
                                    {adminUser?.email || '-'}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                    RUC
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {restaurant.ruc || '-'}
                                  </p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                    Inicio
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {formatDate(latestSubscription?.startsAt || restaurant.startsAt)}
                                  </p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                    Monto
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {formatCurrency(latestSubscription?.amount)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                              <button
                                type="button"
                                onClick={() => openDetailsModal(restaurant)}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Ver info
                              </button>
                              <button
                                type="button"
                                onClick={() => openResetModal(restaurant)}
                                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Cambiar clave
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRestaurantToRenew(restaurant);
                                  setRenewModalOpen(true);
                                }}
                                className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                              >
                                Reactivar
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteModal(restaurant)}
                                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="text-xl font-bold">Nuevo restaurante</h3>
                    <p className="text-sm text-slate-500">
                      Registra negocio, cuenta administradora y plan inicial.
                    </p>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Nombre del negocio" value={form.name} onChange={(e) => autoFillFromName(e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Slug" value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Subdominio" value={form.subdomain} onChange={(e) => handleChange('subdomain', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="RUC" value={form.ruc} onChange={(e) => handleChange('ruc', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Teléfono" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Dirección" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                      <select className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" value={form.planType} onChange={(e) => handleChange('planType', e.target.value)}>
                        <option value="TRIMESTRAL">TRIMESTRAL</option>
                        <option value="ANUAL">ANUAL</option>
                      </select>
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Monto del plan" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Nombre sucursal" value={form.branchName} onChange={(e) => handleChange('branchName', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Código sucursal" value={form.branchCode} onChange={(e) => handleChange('branchCode', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Nombre admin" value={form.adminFirstName} onChange={(e) => handleChange('adminFirstName', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Apellido admin" value={form.adminLastName} onChange={(e) => handleChange('adminLastName', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Correo admin" value={form.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} />
                      <input type="password" className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Contraseña admin" value={form.adminPassword} onChange={(e) => handleChange('adminPassword', e.target.value)} />
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Aquí después puedes agregar:
                      <span className="font-semibold text-slate-800">
                        {' '}
                        renovaciones, historial de pagos, notas internas y última actividad
                      </span>
                      .
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? 'Creando...' : 'Crear restaurante'}
                    </button>
                  </form>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold">Qué más conviene poner aquí</h3>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      Historial de pagos por restaurante
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      Fecha de renovación y días restantes
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      Notas internas del cliente
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      Último acceso del administrador
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {showDetailsModal && restaurantInDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-none bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Información del restaurante</h3>
                <p className="text-sm text-slate-500">Detalle completo del registro principal.</p>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Negocio</p><p className="mt-1 font-semibold">{restaurantInDetails.name || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Estado</p><p className="mt-1 font-semibold">{getRestaurantStatus(restaurantInDetails)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Dominio</p><p className="mt-1 font-semibold break-all">{getRestaurantDomain(restaurantInDetails)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Slug</p><p className="mt-1 font-semibold">{restaurantInDetails.slug || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Subdominio</p><p className="mt-1 font-semibold">{restaurantInDetails.subdomain || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">RUC</p><p className="mt-1 font-semibold">{restaurantInDetails.ruc || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Teléfono</p><p className="mt-1 font-semibold">{restaurantInDetails.phone || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4 md:col-span-2"><p className="text-sm text-slate-500">Dirección</p><p className="mt-1 font-semibold">{restaurantInDetails.address || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Sucursal principal</p><p className="mt-1 font-semibold">{detailsBranch?.name || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Código sucursal</p><p className="mt-1 font-semibold">{detailsBranch?.code || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Administrador</p><p className="mt-1 font-semibold">{detailsAdmin ? `${detailsAdmin.firstName || ''} ${detailsAdmin.lastName || ''}`.trim() || '-' : '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Correo admin</p><p className="mt-1 font-semibold break-all">{detailsAdmin?.email || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Plan</p><p className="mt-1 font-semibold">{detailsSubscription?.planType || restaurantInDetails.planType || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Monto</p><p className="mt-1 font-semibold">{formatCurrency(detailsSubscription?.amount)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Inicio</p><p className="mt-1 font-semibold">{formatDate(detailsSubscription?.startsAt || restaurantInDetails.startsAt)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Vencimiento</p><p className="mt-1 font-semibold">{formatDate(detailsSubscription?.endsAt || restaurantInDetails.expiresAt)}</p></div>
            </div>
          </div>
        </div>
      ) : null}

      {showResetModal && resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-md bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">Restablecer contraseña</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Se actualizará la clave del administrador principal.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-slate-50 p-4 text-sm">
                <p className="text-slate-500">Restaurante</p>
                <p className="mt-1 font-semibold">{resetTarget.name}</p>
                <p className="mt-1 text-slate-500">
                  {getMainAdmin(resetTarget)?.email || 'Sin correo registrado'}
                </p>
              </div>

              <Field label="Nueva contraseña">
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="Nueva contraseña"
                />
              </Field>

              <Field label="Confirmar contraseña">
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) =>
                    setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="Confirmar contraseña"
                />
              </Field>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={saving}
                  className="rounded-md bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal && deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-md bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-rose-700">Eliminar restaurante</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Esta acción eliminará los datos del restaurante y no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-rose-700">
                Vas a eliminar:{' '}
                {deleteTarget ? (
                  <span className="font-bold">{deleteTarget.name}</span>
                ) : (
                  <span className="font-bold">Restaurante</span>
                )}
              </p>

              <Field label="Escribe ELIMINAR para confirmar">
                <input
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="ELIMINAR"
                />
              </Field>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRestaurant}
                  disabled={deleting || deleteConfirmationText !== 'ELIMINAR'}
                  className="rounded-md bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {renewModalOpen && selectedRestaurantToRenew && (
        <div className="bg-graycity-50 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Gestión de Suscripción</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Restaurante:{' '}
                  <span className="font-semibold text-gray-700">
                    {selectedRestaurantToRenew.name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setRenewModalOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
              <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-2">
                <div className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-4 border-b pb-2 text-base font-semibold text-slate-800">
                    Registrar Nuevo Pago
                  </h4>
                  <form onSubmit={handleRenewSubscription} className="space-y-5">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nuevo Plan
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                        value={renewForm.plan}
                        onChange={(e) => setRenewForm({ ...renewForm, plan: e.target.value })}
                        required
                      >
                        <option value="MENSUAL">Mensual</option>
                        <option value="TRIMESTRAL">Trimestral</option>
                        <option value="SEMESTRAL">Semestral</option>
                        <option value="ANUAL">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Monto Pagado (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                        value={renewForm.amount}
                        onChange={(e) => setRenewForm({ ...renewForm, amount: e.target.value })}
                        required
                        placeholder="Ej. 150.00"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setRenewModalOpen(false)}
                        className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        Confirmar Renovación
                      </button>
                    </div>
                  </form>
                </div>

                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex shrink-0 items-center justify-between border-b pb-2">
                    <h4 className="text-base font-semibold text-slate-800">Historial de Pagos</h4>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                      {selectedRestaurantToRenew.subscriptions?.length || 0} registros
                    </span>
                  </div>

                  <div className="max-h-[350px] flex-1 space-y-3 overflow-y-auto pr-2">
                    {selectedRestaurantToRenew.subscriptions &&
                    selectedRestaurantToRenew.subscriptions.length > 0 ? (
                      selectedRestaurantToRenew.subscriptions.map((sub, index) => (
                        <div
                          key={sub.id || index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{sub.planType}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 6h16M4 12h16M4 18h16"
                                ></path>
                              </svg>
                              {sub.createdAt
                                ? new Date(sub.createdAt).toLocaleDateString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-slate-900">
                              S/ {Number(sub.amount).toFixed(2)}
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                              Pagado
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm italic text-slate-500">No hay historial registrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

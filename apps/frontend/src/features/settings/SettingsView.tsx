import { useState } from 'react';
import { inputClass, panelCard } from '../../lib/ui';
import { useAuthStore } from '../../stores/auth';
import {
  useBusinessSettings,
  useCreateUser,
  useRoles,
  useSaveBusinessSettings,
  useUploadBusinessLogo,
  useUsers,
} from './hooks';

interface BusinessConfigForm {
  businessName: string;
  ruc: string;
  address: string;
  phone: string;
  logoUrl: string;
}

interface SystemUserForm {
  firstName: string;
  email: string;
  password: string;
  role: string;
}

const emptyUserForm: SystemUserForm = {
  firstName: '',
  email: '',
  password: '',
  role: 'COCINA',
};

/** Legacy App.jsx `renderSettings` (business config + logo upload + system users), markup preserved verbatim. */
export default function SettingsView() {
  const authUser = useAuthStore((state) => state.user);
  const branchId = authUser?.branchId || authUser?.branch?.id || null;

  const businessQuery = useBusinessSettings(branchId);
  const usersQuery = useUsers();
  const rolesQuery = useRoles();

  const saveBusinessSettings = useSaveBusinessSettings();
  const uploadBusinessLogo = useUploadBusinessLogo();
  const createUser = useCreateUser();

  // The form shows the server values until the user edits (then the draft wins).
  // This replaces the legacy load-once-into-state flow without a sync effect.
  const [businessDraft, setBusinessDraft] = useState<BusinessConfigForm | null>(null);
  const businessConfig: BusinessConfigForm = businessDraft ?? {
    businessName: businessQuery.data?.businessName || '',
    ruc: businessQuery.data?.ruc || '',
    address: businessQuery.data?.address || '',
    phone: businessQuery.data?.phone || '',
    logoUrl: businessQuery.data?.logoUrl || '',
  };
  const setBusinessConfig = (next: BusinessConfigForm) => setBusinessDraft(next);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [userForm, setUserForm] = useState<SystemUserForm>(emptyUserForm);
  const [connectionError, setConnectionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const protectedUsers = usersQuery.data ?? [];
  const protectedRoles = rolesQuery.data ?? [];

  const setMessage = (text: string) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(''), 2500);
  };

  const handleCreateSystemUser = async () => {
    try {
      setConnectionError('');

      if (!userForm.firstName.trim()) {
        throw new Error('Ingresa el nombre del usuario');
      }

      if (!userForm.email.trim()) {
        throw new Error('Ingresa el correo del usuario');
      }

      if (!userForm.password.trim() || userForm.password.trim().length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const selectedRole = protectedRoles.find(
        (role) =>
          String(role.name || '').toUpperCase() === String(userForm.role || '').toUpperCase()
      );

      if (!selectedRole) {
        throw new Error('No se encontró el rol seleccionado');
      }

      if (!branchId) {
        throw new Error('No se encontró la sucursal del usuario actual');
      }

      await createUser.mutateAsync({
        branchId,
        roleId: selectedRole.id,
        firstName: userForm.firstName.trim(),
        lastName: '',
        email: userForm.email.trim().toLowerCase(),
        password: userForm.password.trim(),
      });

      setUserForm(emptyUserForm);
      setMessage('Usuario creado correctamente.');
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Error al crear usuario');
    }
  };

  const handleUploadBusinessLogo = () => {
    if (!logoFile) {
      alert('Primero selecciona un archivo');
      return;
    }

    uploadBusinessLogo.mutate(logoFile, {
      onSuccess: (data) => {
        setBusinessConfig({ ...businessConfig, logoUrl: data.fileUrl });
        alert('Logo subido correctamente');
      },
      onError: (error) =>
        alert(error instanceof Error && error.message ? error.message : 'Error al subir logo'),
    });
  };

  const handleSaveBusinessConfig = () => {
    if (!branchId) {
      alert('No se encontró la sucursal del usuario actual');
      return;
    }

    saveBusinessSettings.mutate(
      {
        branchId,
        businessName: businessConfig.businessName,
        ruc: businessConfig.ruc,
        address: businessConfig.address,
        phone: businessConfig.phone,
        logoUrl: businessConfig.logoUrl,
      },
      {
        onSuccess: () => alert('Datos del negocio guardados correctamente'),
        onError: (error) =>
          alert(
            error instanceof Error && error.message
              ? error.message
              : 'Error al guardar configuración'
          ),
      }
    );
  };

  return (
    <div className="space-y-6">
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

      {/* CONFIGURACIÓN NEGOCIO */}
      <div className={panelCard}>
        <h3 className="text-xl font-bold mb-4">Datos del negocio</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Nombre del negocio"
            value={businessConfig.businessName}
            onChange={(e) =>
              setBusinessConfig({ ...businessConfig, businessName: e.target.value })
            }
          />

          <input
            className={inputClass}
            placeholder="RUC"
            value={businessConfig.ruc}
            onChange={(e) => setBusinessConfig({ ...businessConfig, ruc: e.target.value })}
          />

          <input
            className={inputClass}
            placeholder="Dirección"
            value={businessConfig.address}
            onChange={(e) => setBusinessConfig({ ...businessConfig, address: e.target.value })}
          />

          <input
            className={inputClass}
            placeholder="Teléfono"
            value={businessConfig.phone}
            onChange={(e) => setBusinessConfig({ ...businessConfig, phone: e.target.value })}
          />

          <input
            className={inputClass}
            placeholder="URL del logo"
            value={businessConfig.logoUrl}
            onChange={(e) => setBusinessConfig({ ...businessConfig, logoUrl: e.target.value })}
          />

          {businessConfig.logoUrl ? (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-500">Vista previa del logo</p>
              <img
                src={businessConfig.logoUrl}
                alt="Logo del negocio"
                className="h-20 w-auto rounded-xl border border-slate-200 bg-white p-2"
              />
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            />

            <button
              type="button"
              onClick={handleUploadBusinessLogo}
              className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Subir logo desde PC
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSaveBusinessConfig}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl"
          >
            Guardar datos
          </button>
        </div>
      </div>

      {/* USUARIOS */}
      <div className={panelCard}>
        <h3 className="text-xl font-bold mb-4">Usuarios del sistema</h3>

        <div className="grid gap-4 md:grid-cols-4 mb-4">
          <input
            className={inputClass}
            placeholder="Nombre"
            value={userForm.firstName}
            onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
          />

          <input
            className={inputClass}
            placeholder="Correo"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />

          <input
            type="password"
            className={inputClass}
            placeholder="Contraseña"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
          />

          <select
            className={inputClass}
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          >
            {protectedRoles
              .filter((role) => !['SUPER_ADMIN'].includes(String(role.name || '').toUpperCase()))
              .map((role) => (
                <option key={role.id} value={String(role.name || '').toUpperCase()}>
                  {role.name}
                </option>
              ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCreateSystemUser}
          disabled={createUser.isPending}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 disabled:opacity-60"
        >
          {createUser.isPending ? 'Creando...' : 'Crear usuario'}
        </button>

        <div className="space-y-2">
          {protectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center border p-3 rounded-xl"
            >
              <div>
                <div className="font-semibold">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
                </div>
                <div className="text-sm text-slate-500">{user.email || 'Sin correo'}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                  {user.role?.name || 'Sin rol'}
                </span>

                <button
                  type="button"
                  disabled
                  className="text-slate-400 text-sm cursor-not-allowed"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginRequest, LoginResponse } from '@restaurante/shared';
import { kitchenOrdersQueryKey } from '../kitchen/hooks';
import { apiFetch } from '../../lib/api';
import { inputClass } from '../../lib/ui';
import { useAuthStore } from '../../stores/auth';

/**
 * Legacy App.jsx login screen + `handleLogin`, markup preserved verbatim.
 * Rendered directly by the `/login` route; once `storeLogin` sets the session,
 * the route guard in main.tsx redirects to `/dashboard`.
 */
export default function LoginView() {
  const queryClient = useQueryClient();
  const storeLogin = useAuthStore((state) => state.login);

  const [loginForm, setLoginForm] = useState<LoginRequest>({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });

      storeLogin(data.token, data.user);
      // Reset any stale kitchen cache from a previous session (legacy behavior).
      queryClient.setQueryData(kitchenOrdersQueryKey, []);
    } catch (error) {
      setLoginError(
        error instanceof Error && error.message ? error.message : 'Error al iniciar sesión'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] p-6 text-white">
      <div className="mx-auto grid min-h-[90vh] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase">
            SmartMesa
          </div>
          <div>
            <h1 className="text-5xl font-bold leading-tight">Software de restaurante.</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Inicia sesión con tu usuario del sistema para cargar sucursales, productos, mesas,
              pedidos y usuarios directamente desde tu API.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Iniciar sesión</p>
            <h2 className="mt-2 text-3xl font-bold">Accede al panel</h2>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Bloque del Correo electrónico */}
            <div>
              <span className="text-sm font-medium text-slate-300 block mb-1">
                Correo electrónico
              </span>
              <input
                type="email"
                placeholder="ejemplo@restaurante.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Bloque de la Contraseña */}
            <div>
              <span className="text-sm font-medium text-slate-300 block mb-1">
                Contraseña
              </span>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  className={`${inputClass} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  {showLoginPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {loginError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {loginError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoggingIn ? 'Ingresando...' : 'Entrar al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

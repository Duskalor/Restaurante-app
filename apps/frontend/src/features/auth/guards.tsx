import { Navigate } from 'react-router';
import App from '../../App';
import { useAuthStore } from '../../stores/auth';
import LoginView from './LoginView';

/** Authenticated layout: no session → /login; otherwise the App shell (which renders the routed view via <Outlet/>). */
export function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  if (!token || !user) return <Navigate to="/login" replace />;
  return <App />;
}

/** /login: already authenticated → /dashboard; otherwise the standalone login screen. */
export function LoginRoute() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  if (token && user) return <Navigate to="/dashboard" replace />;
  return <LoginView />;
}

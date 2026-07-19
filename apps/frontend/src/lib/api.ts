import { useAuthStore } from '../stores/auth';

// TODO: remove this hardcoded IP once every environment defines VITE_API_URL.
const FALLBACK_API_URL = 'http://46.183.112.122:3001';

export const API_URL = import.meta.env.VITE_API_URL ?? FALLBACK_API_URL;

/** Error thrown by `apiFetch` for any non-2xx response. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ErrorBody {
  error?: string;
  message?: string;
}

function extractErrorMessage(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const body = data as ErrorBody;
  if (typeof body.error === 'string' && body.error) return body.error;
  if (typeof body.message === 'string' && body.message) return body.message;
  return null;
}

/**
 * The single entry point for talking to the API.
 *
 * - Joins `path` onto `API_URL`.
 * - Sets `Content-Type: application/json` unless the body is `FormData`
 *   (the browser must set the multipart boundary itself).
 * - Injects `Authorization: Bearer <token>` from the auth store unless the
 *   caller already provided one.
 * - Parses the JSON response; tolerates empty/non-JSON bodies (returns null).
 * - Throws `ApiError` (status + server message) on any non-2xx response.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = useAuthStore.getState().token;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(data) ?? 'Error en la solicitud'
    );
  }

  return data as T;
}

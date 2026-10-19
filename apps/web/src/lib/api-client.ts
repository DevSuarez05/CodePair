import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/**
 * Axios instance pre-configured for the CodePair API.
 * - Sends cookies (withCredentials) for JWT HttpOnly cookie auth
 * - Attaches Content-Type: application/json by default
 * - Handles 401 → clears session and redirects to /login
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,       // Send HttpOnly cookies with every request
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach request ID for tracing
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      config.headers['X-Request-ID'] = crypto.randomUUID();
    }
    // Attach Bearer token from storage if present (complements HttpOnly cookies)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('codepair_access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── 401 Handling: try token refresh once ──────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh tokens via the refresh cookie
        await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        // Retry original request with new cookie
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — redirect to login (avoid loop on /login)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Network / API down (e.g. backend not listening on :3001)
    if (!error.response && error.code === 'ERR_NETWORK') {
      error.message =
        'No se pudo conectar con la API. Comprueba que el servidor backend esté en ejecución (npm run dev en la raíz).';
    }

    return Promise.reject(error);
  },
);

export default apiClient;

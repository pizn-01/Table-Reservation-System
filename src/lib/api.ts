/**
 * Centralized API client for the Table Reservation System.
 * Wraps fetch with auth headers, error normalization, and token refresh.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// ─── Types ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ─── Token Helpers ──────────────────────────────────────

const TOKEN_KEY = 'trs_token';
const REFRESH_TOKEN_KEY = 'trs_refresh_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const clearRefreshToken = (): void => localStorage.removeItem(REFRESH_TOKEN_KEY);

// ─── Core Fetch Wrapper ────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, params, skipAuth = false, headers: customHeaders, ...rest } = options;

  // Build URL with query params
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Make the request
  const response = await fetch(url, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Parse response
  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: 'Failed to parse server response',
  }));

  // Handle 401 — try token refresh once
  if (response.status === 401 && !skipAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request with new token
      headers['Authorization'] = `Bearer ${getToken()}`;
      const retryResponse = await fetch(url, {
        ...rest,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const retryJson: ApiResponse<T> = await retryResponse.json().catch(() => ({
        success: false,
        error: 'Failed to parse server response',
      }));
      if (!retryResponse.ok) {
        // Refresh didn't help — force logout
        clearAllAuth();
        window.location.href = '/login';
        throw new ApiError(retryJson.error || 'Session expired', retryResponse.status);
      }
      return retryJson;
    } else {
      // Refresh failed — force logout
      clearAllAuth();
      window.location.href = '/login';
      throw new ApiError(json.error || 'Session expired', 401);
    }
  }

  // Handle other errors
  if (!response.ok) {
    throw new ApiError(
      json.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return json;
}

// ─── Token Refresh ─────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const json = await response.json();
      if (json.success && json.data?.token) {
        setToken(json.data.token);
        if (json.data.refreshToken) {
          setRefreshToken(json.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearAllAuth(): void {
  clearToken();
  clearRefreshToken();
  localStorage.removeItem('trs_user');
  localStorage.removeItem('trs_restaurant');
}

// ─── Convenience Methods ───────────────────────────────

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

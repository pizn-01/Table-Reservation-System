import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api, { getToken, setToken, setRefreshToken, clearToken, clearRefreshToken, ApiError } from '../lib/api';

// ─── Types ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  setupCompleted: boolean;
}

interface AuthState {
  user: User | null;
  restaurant: Restaurant | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ user: User; restaurant?: Restaurant }>;
  signup: (data: SignupData) => Promise<{ user: User; restaurant?: Restaurant }>;
  staffLogin: (email: string, password: string, restaurantSlug?: string) => Promise<{ user: User; restaurant?: Restaurant }>;
  logout: () => void;
  setRestaurant: (restaurant: Restaurant) => void;
}

export interface SignupData {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  country?: string;
  timezone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  restaurant?: Restaurant;
}

// ─── Context ────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Storage Helpers ────────────────────────────────────

const USER_KEY = 'trs_user';
const RESTAURANT_KEY = 'trs_restaurant';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getStoredRestaurant(): Restaurant | null {
  try {
    const raw = localStorage.getItem(RESTAURANT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeAuthData(data: AuthResponse): void {
  setToken(data.token);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if (data.restaurant) {
    localStorage.setItem(RESTAURANT_KEY, JSON.stringify(data.restaurant));
  }
}

function clearAuthData(): void {
  clearToken();
  clearRefreshToken();
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(RESTAURANT_KEY);
}

// ─── Provider ───────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: getStoredUser(),
    restaurant: getStoredRestaurant(),
    token: getToken(),
    isAuthenticated: !!getToken(),
    isLoading: true,
  });

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = getToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await api.get<{ user: User; restaurant?: Restaurant }>('/auth/me');
        if (response.success && response.data) {
          setState({
            user: response.data.user || getStoredUser(),
            restaurant: response.data.restaurant || getStoredRestaurant(),
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          clearAuthData();
          setState({ user: null, restaurant: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
        // Token might be invalid — keep stored data but mark as needing re-auth
        // Don't clear immediately; token refresh might handle it
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password }, { skipAuth: true });
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'Login failed', 401);
    }

    storeAuthData(response.data);
    setState({
      user: response.data.user,
      restaurant: response.data.restaurant || null,
      token: response.data.token,
      isAuthenticated: true,
      isLoading: false,
    });

    return { user: response.data.user, restaurant: response.data.restaurant };
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const response = await api.post<AuthResponse>('/auth/signup', data, { skipAuth: true });
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'Signup failed', 400);
    }

    storeAuthData(response.data);
    setState({
      user: response.data.user,
      restaurant: response.data.restaurant || null,
      token: response.data.token,
      isAuthenticated: true,
      isLoading: false,
    });

    return { user: response.data.user, restaurant: response.data.restaurant };
  }, []);

  const staffLogin = useCallback(async (email: string, password: string, restaurantSlug?: string) => {
    const response = await api.post<AuthResponse>('/auth/staff-login', { email, password, restaurantSlug }, { skipAuth: true });
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'Staff login failed', 401);
    }

    storeAuthData(response.data);
    setState({
      user: response.data.user,
      restaurant: response.data.restaurant || null,
      token: response.data.token,
      isAuthenticated: true,
      isLoading: false,
    });

    return { user: response.data.user, restaurant: response.data.restaurant };
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget server logout
    api.post('/auth/logout').catch(() => {});
    clearAuthData();
    setState({ user: null, restaurant: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const setRestaurantFn = useCallback((restaurant: Restaurant) => {
    localStorage.setItem(RESTAURANT_KEY, JSON.stringify(restaurant));
    setState(prev => ({ ...prev, restaurant }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, staffLogin, logout, setRestaurant: setRestaurantFn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

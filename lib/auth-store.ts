// ======================================
// Store de autenticación con JWT
// Guarda tokens en localStorage
// ======================================

import { User } from './types';

const ACCESS_TOKEN_KEY = 'zylo_access_token';
const REFRESH_TOKEN_KEY = 'zylo_refresh_token';
const USER_KEY = 'zylo_user';

// Verificar si estamos en el cliente
const isBrowser = typeof window !== 'undefined';

// Guardar tokens en localStorage
export function setTokens(accessToken: string, refreshToken?: string): void {
  if (!isBrowser) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

// Obtener access token
export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// Obtener refresh token
export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Guardar usuario
export function setUser(user: User): void {
  if (!isBrowser) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Obtener usuario
export function getUser(): User | null {
  if (!isBrowser) return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

// Verificar si está autenticado
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Verificar si es admin
export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'ADMIN';
}

// Limpiar auth (logout)
export function clearAuth(): void {
  if (!isBrowser) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Alias para logout
export function logout(): void {
  clearAuth();
}

// Decodificar JWT (sin verificar firma)
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Verificar si el token está expirado
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

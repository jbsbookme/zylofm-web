// ======================================
// Servicio de API con interceptor de auth
// ======================================

import { getAccessToken, clearAuth } from './auth-store';
import { Mix, User } from './types';

// URL base del backend - usar API local por defecto
// Si NEXT_PUBLIC_API_URL está configurada y no es localhost:3001, usar esa
const getApiBaseUrl = () => {
  // En cliente, usar API local de la PWA
  if (typeof window !== 'undefined') {
    return ''; // URL relativa para usar los endpoints locales
  }
  return '';
};

// Tipos de respuesta del backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'LISTENER' | 'DJ' | 'ADMIN';
    name?: string;
    djStatus?: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresInSec: number;
  };
}

interface MixFromAPI {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  durationSec?: number;
  status: string;
  visibility: string;
  hlsMasterUrl?: string;
  createdAt: string;
  updatedAt: string;
  djUserId: string;
  djProfile?: {
    displayName: string;
    avatarUrl?: string;
  };
}

// Función para hacer requests con auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const baseUrl = getApiBaseUrl();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Si es 401, limpiar auth y redirigir
  if (response.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('No autorizado');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Error en la solicitud');
  }
  
  return data;
}

// ======================================
// Endpoints de Auth
// ======================================

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const baseUrl = getApiBaseUrl();
  
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const rawText = await response.text();
  let data: ApiResponse<LoginResponse> | null = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }

  if (!data) {
    throw new Error('Respuesta inválida del servidor');
  }

  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Credenciales inválidas');
  }

  return data.data!;
}

export async function refreshToken(refreshTokenValue: string): Promise<{ tokens: LoginResponse['tokens'] }> {
  const baseUrl = getApiBaseUrl();
  
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
  
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error('Token inválido');
  }
  
  return data.data;
}

// ======================================
// Endpoints de Mixes
// ======================================

// Obtener mixes publicados (público)
export async function getMixes(): Promise<Mix[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/mixes`);
    const data: ApiResponse<Mix[]> = await response.json();
    
    if (!data.success || !data.data) {
      return [];
    }
    
    return data.data;
  } catch (error) {
    console.error('Error al obtener mixes:', error);
    return [];
  }
}

// ======================================
// Endpoints de Admin
// ======================================

// Obtener mixes pendientes (admin)
export async function getPendingMixes(): Promise<MixFromAPI[]> {
  const data = await fetchWithAuth<ApiResponse<MixFromAPI[]>>('/api/admin/mixes/pending');
  return data.data || [];
}

// Aprobar mix (admin)
export async function approveMix(mixId: string): Promise<void> {
  await fetchWithAuth(`/api/admin/mixes/${mixId}/approve`, {
    method: 'POST',
  });
}

// Rechazar mix (admin)
export async function rejectMix(mixId: string, reason: string): Promise<void> {
  await fetchWithAuth(`/api/admin/mixes/${mixId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Obtener todos los mixes para admin
export async function getAllMixesAdmin(): Promise<MixFromAPI[]> {
  const data = await fetchWithAuth<ApiResponse<MixFromAPI[]>>('/api/admin/mixes');
  return data.data || [];
}

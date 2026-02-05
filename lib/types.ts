// ======================================
// Tipos para ZyloFM PWA
// ======================================

// Estado del reproductor de audio
export type PlayerStatus = 
  | 'idle'      // Sin audio cargado
  | 'loading'   // Cargando audio
  | 'playing'   // Reproduciendo
  | 'paused'    // Pausado
  | 'buffering' // Buffering
  | 'error';    // Error

// Tipo de contenido en reproducción
export type MediaType = 'mix' | 'radio';

// Estado de un mix (del backend)
export type MixStatus = 'DRAFT' | 'UPLOADING' | 'PROCESSING' | 'PUBLISHED' | 'TAKEDOWN' | 'PENDING' | 'REJECTED';

// Interfaz para un Mix de DJ
export interface Mix {
  id: string;
  title: string;
  djId?: string;
  djName: string;
  djPhotoUrl?: string; // Logo/foto del DJ
  description?: string;
  durationSec: number;
  bpm?: number; // Beats per minute
  coverUrl: string;
  hlsUrl: string;
  genres?: string[];
  genre?: string;
  createdAt?: string;
  status?: MixStatus;
}

// Interfaz para Radio en vivo
export interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  coverUrl: string;
  description?: string;
  genre?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

// Estado actual del reproductor
export interface PlayerState {
  status: PlayerStatus;
  currentMedia: Mix | RadioStation | null;
  mediaType: MediaType | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error?: string;
}

// Acciones del reproductor
export type PlayerAction = 
  | { type: 'PLAY_MIX'; payload: Mix }
  | { type: 'PLAY_RADIO'; payload: RadioStation }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SEEK'; payload: number }
  | { type: 'SKIP_FORWARD'; payload?: number }
  | { type: 'SKIP_BACKWARD'; payload?: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_STATUS'; payload: PlayerStatus }
  | { type: 'SET_TIME'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_ERROR'; payload: string };

// Roles de usuario
export type UserRole = 'LISTENER' | 'DJ' | 'ADMIN';

// Usuario autenticado
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// Banner para promociones
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

// Mix desde la API del backend (formato completo)
export interface MixFromAPI {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  durationSec?: number;
  status: MixStatus;
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

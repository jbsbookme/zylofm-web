// ======================================
// Datos mock para desarrollo y testing
// ======================================

import { Mix, RadioStation } from './types';

// URL de prueba HLS (Big Buck Bunny audio demo)
const TEST_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

// Radio stream de prueba (jazz/lo-fi)
const TEST_RADIO_URL = 'https://stream.zeno.fm/fyn8eh3h5f8uv';

// Mixes de ejemplo
export const mockMixes: Mix[] = [
  {
    id: 'mix-001',
    title: 'Deep House Vibes Vol. 1',
    djName: 'DJ Cosmic',
    description: 'Un viaje por los mejores tracks de deep house para sesiones nocturnas.',
    durationSec: 3600, // 1 hora
    coverUrl: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&q=80',
    hlsUrl: TEST_HLS_URL,
    genres: ['Deep House', 'Electronic'],
    createdAt: '2026-01-15T20:00:00Z',
  },
  {
    id: 'mix-002',
    title: 'Tech House Explosion',
    djName: 'Luna Beats',
    description: 'Energía pura con los mejores tracks de tech house del momento.',
    durationSec: 4200, // 1h 10min
    coverUrl: 'https://thumbs.dreamstime.com/b/futuristic-d-background-featuring-floating-neon-speakers-emitting-colorful-sound-waves-all-directions-abstract-364283758.jpg',
    hlsUrl: TEST_HLS_URL,
    genres: ['Tech House', 'Techno'],
    createdAt: '2026-01-12T18:30:00Z',
  },
  {
    id: 'mix-003',
    title: 'Sunset Chill Session',
    djName: 'AuroraFM',
    description: 'Melodías relajantes para disfrutar al atardecer.',
    durationSec: 2700, // 45 min
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    hlsUrl: TEST_HLS_URL,
    genres: ['Chillout', 'Ambient'],
    createdAt: '2026-01-10T16:00:00Z',
  },
  {
    id: 'mix-004',
    title: 'Progressive Trance Journey',
    djName: 'NeonWave',
    description: 'Viaje épico por los mejores temas de progressive trance.',
    durationSec: 5400, // 1h 30min
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    hlsUrl: TEST_HLS_URL,
    genres: ['Progressive Trance', 'Trance'],
    createdAt: '2026-01-08T22:00:00Z',
  },
];

// Radio en vivo
export const liveRadio: RadioStation = {
  id: 'radio-live',
  name: 'ZyloFM Live',
  streamUrl: TEST_RADIO_URL,
  coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80',
  description: 'Transmisión en vivo 24/7 con los mejores DJs',
};

// Función para obtener un mix por ID
export function getMixById(id: string): Mix | undefined {
  return mockMixes?.find((mix) => mix?.id === id);
}

// Formatear duración en minutos:segundos o horas:minutos:segundos
export function formatDuration(seconds: number): string {
  const secs = seconds ?? 0;
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = Math.floor(secs % 60);

  if (hours > 0) {
    return `${hours}:${mins?.toString()?.padStart(2, '0')}:${remainingSecs?.toString()?.padStart(2, '0')}`;
  }
  return `${mins}:${remainingSecs?.toString()?.padStart(2, '0')}`;
}

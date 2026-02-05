'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Music2, Clock, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { ZYLO_LOGO } from '@/components/cover-image';

interface KaraokeTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string | null;
  coverUrl: string | null;
  durationSec: number | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function KaraokePage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<KaraokeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const res = await fetch('/api/karaoke');
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Error loading karaoke tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-black px-4 py-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full mb-4">
          <Mic2 className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Karaoke
          </h1>
        </div>
        <p className="text-zinc-400 text-sm sm:text-base">Canta tus canciones favoritas con letras sincronizadas</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto mb-8"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar canción o artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
          />
        </div>
      </motion.div>

      {/* Tracks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
        </div>
      ) : filteredTracks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Music2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">
            {searchQuery ? 'No se encontraron canciones' : 'No hay canciones de karaoke disponibles'}
          </p>
          {!searchQuery && (
            <p className="text-zinc-600 text-sm mt-2">El admin puede agregar pistas desde el panel</p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-3 max-w-2xl mx-auto"
        >
          <AnimatePresence mode="popLayout">
            {filteredTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/karaoke/${track.id}`)}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 hover:border-pink-500/30 rounded-xl cursor-pointer transition-all group"
              >
                {/* Cover */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  <Image
                    src={track.coverUrl || ZYLO_LOGO}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Mic2 className="w-6 h-6 text-pink-400" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-pink-400 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-zinc-400 truncate">{track.artist}</p>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1 text-zinc-500 text-xs sm:text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(track.durationSec)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder, Music, Loader2, Play, Pause, Clock } from 'lucide-react';
import Image from 'next/image';
import { usePlayer } from '@/context/player-context';
import { ZYLO_LOGO } from '@/components/cover-image';

interface Mix {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string | null;
  coverUrl: string | null;
  durationSec: number | null;
  genre?: { name: string; slug: string } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    photoUrl?: string | null;
  };
}

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  mixes: Mix[];
}

export default function GenrePage() {
  const router = useRouter();
  const params = useParams();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [loading, setLoading] = useState(true);
  const { state, playMix, pause, setPlaylist, playlist } = usePlayer();

  useEffect(() => {
    const loadGenre = async () => {
      try {
        const res = await fetch(`/api/genres/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setGenre(data.data);
        }
      } catch (err) {
        console.error('Error loading genre:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadGenre();
    }
  }, [params.id]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayMix = (mix: Mix, index: number) => {
    if (state.currentMedia?.id === mix.id && state.status === 'playing') {
      pause();
    } else {
      // Convertir todos los mixes del género a formato de playlist
      const playlistMixes = genre?.mixes.map(m => ({
        id: m.id,
        djId: m.user.id,
        title: m.title,
        djName: m.user.name || m.user.email.split('@')[0],
        djPhotoUrl: m.user.photoUrl || undefined,
        durationSec: m.durationSec || 0,
        coverUrl: m.coverUrl || ZYLO_LOGO,
        hlsUrl: m.audioUrl || '',
        genre: m.genre?.name,
      })) || [];
      
      // Establecer playlist y empezar desde el índice seleccionado
      setPlaylist(playlistMixes, index);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Folder className="w-16 h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-400">Género no encontrado</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-cyan-500 text-black rounded-lg"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Header limpio sin imagen de fondo */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 pt-4 pb-6 sm:pb-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Botón volver */}
          <button
            onClick={() => router.push('/')}
            className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Info del género */}
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Folder className="w-5 h-5" />
            <span className="text-sm font-medium">Género</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold">{genre.name}</h1>
          {genre.description && (
            <p className="text-zinc-400 mt-2">{genre.description}</p>
          )}
          <p className="text-zinc-500 mt-2">
            {genre.mixes.length} {genre.mixes.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
      </div>

      {/* Lista de canciones */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {genre.mixes.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No hay canciones en este género</p>
          </div>
        ) : (
          <div className="space-y-2">
            {genre.mixes.map((mix, index) => {
              const isPlaying = state.currentMedia?.id === mix.id && state.status === 'playing';
              const isActive = state.currentMedia?.id === mix.id;
              
              return (
                <motion.div
                  key={mix.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handlePlayMix(mix, index)}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-cyan-500/10 border border-cyan-500/30' 
                      : 'bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  {/* Número o Play */}
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {isPlaying ? (
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                        <Pause className="w-4 h-4 text-black" />
                      </div>
                    ) : isActive ? (
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-cyan-400 ml-0.5" />
                      </div>
                    ) : (
                      <span className="text-zinc-500 font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Cover con logo ZyloFM */}
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                    <Image
                      src={ZYLO_LOGO}
                      alt={mix.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                      {mix.title}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate">
                      {mix.user.name || mix.user.email.split('@')[0]}
                    </p>
                  </div>

                  {/* Duración */}
                  <div className="flex items-center gap-1 text-zinc-500 text-xs sm:text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDuration(mix.durationSec)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Folder, Loader2, Music, Eye } from 'lucide-react';
import Image from 'next/image';
import { ZYLO_LOGO } from '@/components/cover-image';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  mixCount: number;
}

export default function GenresPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tileStyles = [
    'from-fuchsia-600/90 to-fuchsia-700/90',
    'from-amber-500/90 to-amber-600/90',
    'from-blue-600/90 to-blue-700/90',
    'from-emerald-600/90 to-emerald-700/90',
    'from-rose-600/90 to-rose-700/90',
    'from-purple-600/90 to-purple-700/90',
  ];

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await fetch('/api/genres');
        const data = await res.json();
        if (data.success) setGenres(data.data);
      } catch (err) {
        console.error('Error loading genres:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGenres();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ZyloFm</h1>
          <div className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
        </div>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-indigo-800/80 via-indigo-700/70 to-indigo-900/80">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_45%)]" />
          <div className="relative p-5 sm:p-8">
            <div className="inline-flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2 rounded-full">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-lg font-semibold tracking-wide">MIXES</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg sm:text-xl font-semibold">Genres</h2>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-zinc-500">Cargando géneros...</p>
        </div>
      ) : genres.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {genres.map((genre, index) => (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => router.push(`/genre/${genre.id}`)}
              className="group cursor-pointer"
            >
              <div
                className={`relative rounded-2xl p-4 min-h-[88px] sm:min-h-[96px] border border-black/20 bg-gradient-to-br ${
                  tileStyles[index % tileStyles.length]
                } shadow-[0_10px_20px_rgba(0,0,0,0.25)] transition-transform group-hover:-translate-y-0.5`}
              >
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white/90" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                    <Image
                      src={genre.coverUrl || ZYLO_LOGO}
                      alt={genre.name}
                      width={20}
                      height={20}
                      className="opacity-90"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm sm:text-base truncate">{genre.name}</p>
                    <p className="text-[11px] sm:text-xs text-white/70">{genre.mixCount} mixes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
            <Folder className="w-6 h-6 text-cyan-300" />
          </div>
          <p className="text-zinc-300 font-medium">No hay géneros disponibles</p>
          <p className="text-zinc-500 text-sm mt-1">Aún no hay categorías publicadas.</p>
        </div>
      )}
    </div>
  );
}

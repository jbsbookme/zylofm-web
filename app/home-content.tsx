'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Headphones, RefreshCw, Music, Star, ChevronDown, Users } from 'lucide-react';
import { RadioButton } from '@/components/radio-button';
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

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

interface DJ {
  id: string;
  name: string;
  photoUrl: string | null;
  mixCount: number;
  genres: string[];
}

export function HomeContent() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreMenuOpen, setGenreMenuOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar todo en paralelo
      const [genresRes, bannersRes, djsRes] = await Promise.all([
        fetch('/api/genres'),
        fetch('/api/banners?position=HOME'),
        fetch('/api/djs')
      ]);
      
      const [genresData, bannersData, djsData] = await Promise.all([
        genresRes.json(),
        bannersRes.json(),
        djsRes.json()
      ]);
      
      if (genresData.success) setGenres(genresData.data);
      if (bannersData.success) setBanners(bannersData.data);
      if (djsData.success) setDjs(djsData.data);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('No se pudo cargar el contenido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 sm:mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl">
            <Headphones className="w-12 h-12 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
          Bienvenido a{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            ZyloFM
          </span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-lg max-w-xl mx-auto">
          Descubre DJs por género y explora su catálogo de mixes.
        </p>
      </motion.section>

      {/* Radio en Vivo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <RadioButton />
      </motion.section>

      {/* Banners */}
      {banners.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {banners.slice(0, 2).map((banner) => (
              <a
                key={banner.id}
                href={banner.linkUrl || '#'}
                target={banner.linkUrl ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="relative aspect-[2/1] rounded-xl overflow-hidden group"
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Badge Sponsored si tiene link externo */}
                {banner.linkUrl && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/90 text-black text-xs font-semibold rounded-md flex items-center gap-1 backdrop-blur-sm">
                    <Star className="w-3 h-3" />
                    Sponsored
                  </div>
                )}
                {/* Overlay con título */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-medium truncate">{banner.title}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* DJs */}
      {djs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">DJs</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {djs.map((dj, index) => (
              <motion.button
                key={dj.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/dj/${dj.id}`)}
                className="group text-left rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 transition-all overflow-hidden"
              >
                <div className="relative aspect-square flex items-center justify-center bg-zinc-900">
                  <div className="absolute inset-[-10px] rounded-full bg-purple-500/20 blur-2xl opacity-80" />
                  <div className="relative w-[78%] h-[78%] rounded-full overflow-hidden bg-zinc-800 ring-2 ring-purple-500/30 translate-y-2 shadow-lg">
                    <Image
                      src={dj.photoUrl || ZYLO_LOGO}
                      alt={dj.name}
                      fill
                      className={dj.photoUrl ? 'object-cover rounded-full' : 'object-contain p-6 bg-zinc-900 rounded-full'}
                    />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate text-white">{dj.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {dj.genres.length > 0 ? (
                      dj.genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-0.5 rounded-full text-[10px] text-zinc-300 bg-zinc-800"
                        >
                          {genre}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-500">Sin géneros</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm flex items-center justify-between"
        >
          <span>{error}</span>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 rounded hover:bg-amber-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </motion.div>
      )}

      {/* Selector de Géneros - Centrado */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="relative w-full sm:w-auto">
          {/* Botón principal - Color vivo */}
          <button
            onClick={() => setGenreMenuOpen(!genreMenuOpen)}
            disabled={isLoading || genres.length === 0}
            className="w-full sm:w-auto flex items-center gap-3 px-5 sm:px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl hover:from-cyan-500 hover:to-purple-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01]"
          >
            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Selecciona tu género</p>
              <p className="text-white/70 text-[11px] sm:text-xs">
                {isLoading ? 'Cargando...' : `${genres.length} géneros disponibles`}
              </p>
            </div>
            <ChevronDown className={`w-5 h-5 text-white transition-transform ${genreMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {genreMenuOpen && genres.length > 0 && (
            <>
              {/* Backdrop para cerrar */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setGenreMenuOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-[90vw] sm:w-72 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50"
              >
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => {
                      router.push(`/genre/${genre.id}`);
                      setGenreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left border-b border-zinc-800 last:border-b-0"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <Image
                        src={genre.coverUrl || ZYLO_LOGO}
                        alt={genre.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{genre.name}</p>
                      <p className="text-zinc-500 text-xs">
                        {genre.mixCount} {genre.mixCount === 1 ? 'canción' : 'canciones'}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </motion.section>


    </div>
  );
}

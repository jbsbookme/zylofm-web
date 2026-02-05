'use client';

import { usePlayer } from '@/context/player-context';
import { formatDuration } from '@/lib/mock-data';
import { Mix, RadioStation } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Radio, Loader2, Volume2, ChevronUp, SkipBack as Prev, SkipForward as Next } from 'lucide-react';
import Image from 'next/image';
import { ZYLO_LOGO } from './cover-image';

export function MiniPlayer() {
  const { state, play, pause, skipBackward, skipForward, setNowPlayingOpen, playlist, playNext, playPrevious, currentIndex } = usePlayer();

  const isVisible = state?.status !== 'idle' && state?.currentMedia;
  const isPlaying = state?.status === 'playing';
  const isLoading = state?.status === 'loading' || state?.status === 'buffering';
  const isMix = state?.mediaType === 'mix';

  const media = state?.currentMedia;
  const title = isMix 
    ? (media as Mix)?.title 
    : (media as RadioStation)?.name;
  const subtitle = isMix 
    ? (media as Mix)?.djName 
    : 'En vivo';
  // Usar logo ZyloFM si no hay cover o si es placeholder
const rawCoverUrl = media?.coverUrl;
const isPlaceholder = !rawCoverUrl || rawCoverUrl.includes('unsplash') || rawCoverUrl.includes('placeholder');
const coverUrl = isPlaceholder ? ZYLO_LOGO : rawCoverUrl;

  // Calcular progreso para la barra
  const progress = state?.duration > 0 
    ? ((state?.currentTime ?? 0) / (state?.duration ?? 1)) * 100 
    : 0;

  const hasPlaylist = playlist.length > 1;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < playlist.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[72px] left-0 right-0 z-40"
        >
          {/* Fondo con glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-900/98 to-zinc-900/95 backdrop-blur-2xl" />
          
          {/* Barra de progreso */}
          {isMix && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/30">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-purple-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
          
          {/* Indicador de radio en vivo */}
          {!isMix && (
            <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse" />
            </div>
          )}

          <div className="relative max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Cover */}
              <motion.div 
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-2xl cursor-pointer ring-1 ring-white/10"
                onClick={() => setNowPlayingOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={coverUrl}
                  alt={title ?? 'Cover'}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
                {/* Overlay de expandir */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center transition-all">
                  <ChevronUp className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
                {/* Badge de radio */}
                {!isMix && (
                  <div className="absolute bottom-0.5 right-0.5 bg-red-500 rounded-full p-0.5 shadow-lg">
                    <Radio className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.div>

              {/* Info */}
              <div 
                className="flex-1 min-w-0 cursor-pointer" 
                onClick={() => setNowPlayingOpen(true)}
              >
                <p className="text-white font-semibold text-sm sm:text-base truncate">
                  {title ?? 'Sin título'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-zinc-400 text-xs sm:text-sm truncate">
                    {subtitle ?? 'Desconocido'}
                  </p>
                  {isMix && state?.duration > 0 && (
                    <span className="text-zinc-500 text-xs hidden sm:inline">
                      {formatDuration(state?.currentTime ?? 0)} / {formatDuration(state?.duration ?? 0)}
                    </span>
                  )}
                  {!isMix && (
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="hidden sm:inline">EN VIVO</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Controles */}
              <div 
                className="flex items-center gap-0.5 sm:gap-1"
                onClick={(e) => e?.stopPropagation?.()}
              >
                {/* Anterior */}
                {hasPlaylist && (
                  <motion.button
                    onClick={() => playPrevious()}
                    disabled={!canPrev}
                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hidden sm:flex items-center justify-center"
                    aria-label="Anterior"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <SkipBack className="w-5 h-5" fill="currentColor" />
                  </motion.button>
                )}

                {/* Play/Pause - Botón principal profesional */}
                <motion.button
                  onClick={() => isPlaying ? pause?.() : play?.()}
                  disabled={isLoading}
                  className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center mx-1"
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {/* Fondo con gradiente */}
                  <div className={`absolute inset-0 rounded-full shadow-lg transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-cyan-500/40' 
                      : 'bg-white shadow-white/20'
                  }`} />
                  
                  {/* Anillo animado cuando reproduce */}
                  {isPlaying && (
                    <motion.div 
                      className="absolute inset-[-3px] rounded-full border-2 border-cyan-400/40"
                      animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0.2, 0.6]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  )}
                  
                  {/* Icono */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className={`w-5 h-5 sm:w-6 sm:h-6 animate-spin ${isPlaying ? 'text-white' : 'text-zinc-900'}`} />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
                    ) : (
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-900 ml-0.5" fill="currentColor" />
                    )}
                  </div>
                </motion.button>

                {/* Siguiente */}
                {hasPlaylist && (
                  <motion.button
                    onClick={() => playNext()}
                    disabled={!canNext && playlist.length <= 1}
                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hidden sm:flex items-center justify-center"
                    aria-label="Siguiente"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <SkipForward className="w-5 h-5" fill="currentColor" />
                  </motion.button>
                )}

                {/* Volumen */}
                <motion.button
                  className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5 hidden md:flex items-center justify-center"
                  aria-label="Volumen"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNowPlayingOpen(true)}
                >
                  <Volume2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Info de playlist (móvil) */}
            {hasPlaylist && (
              <div className="flex sm:hidden items-center justify-center mt-1 text-xs text-zinc-500">
                <span>{currentIndex + 1} / {playlist.length}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

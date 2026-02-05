'use client';

import { usePlayer } from '@/context/player-context';
import { formatDuration } from '@/lib/mock-data';
import { Mix, RadioStation } from '@/lib/types';
import { isLiked, toggleLike } from '@/lib/likes-store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Loader2, AlertCircle, Square,
  ChevronDown, List, Music, MoreHorizontal, X
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZYLO_LOGO } from './cover-image';

// Componente del ecualizador animado - optimizado para móvil
function Equalizer({ isPlaying }: { isPlaying: boolean }) {
  // Menos barras en móvil para mejor rendimiento y visualización
  const bars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  return (
    <div className="flex items-end justify-center gap-[4px] sm:gap-[5px] h-14 sm:h-16">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className="w-[5px] sm:w-[6px] rounded-full bg-gradient-to-t from-cyan-500 via-purple-500 to-pink-500"
          initial={{ height: 10 }}
          animate={isPlaying ? {
            height: [10, Math.random() * 40 + 16, Math.random() * 25 + 10, Math.random() * 50 + 12, 10],
          } : { height: 10 }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar * 0.05,
          }}
        />
      ))}
    </div>
  );
}

// Componente de ondas de audio
function AudioWaves({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-white/10"
          initial={{ width: 200, height: 200, opacity: 0 }}
          animate={isPlaying ? {
            width: [200, 400 + ring * 100],
            height: [200, 400 + ring * 100],
            opacity: [0.3, 0],
          } : { opacity: 0 }}
          transition={{
            duration: 2 + ring * 0.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: ring * 0.4,
          }}
        />
      ))}
    </div>
  );
}

export function NowPlaying() {
  const router = useRouter();
  const { 
    state, play, pause, stop, seek, skipBackward, skipForward, playRadio,
    setVolume, toggleMute, isNowPlayingOpen, setNowPlayingOpen,
    playlist, currentIndex, playMix
  } = usePlayer();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [radioStation, setRadioStation] = useState<RadioStation | null>(null);
  const [isLikedState, setIsLikedState] = useState(false);

  const isMix = state?.mediaType === 'mix';
  const media = state?.currentMedia;
  const title = isMix 
    ? (media as Mix)?.title 
    : (media as RadioStation)?.name;
  const subtitle = isMix 
    ? (media as Mix)?.djName 
    : 'Transmisión en vivo';
  // Usar logo ZyloFM si no hay cover o si es una imagen de placeholder
const rawCoverUrl = media?.coverUrl;
const isPlaceholder = !rawCoverUrl || rawCoverUrl.includes('unsplash') || rawCoverUrl.includes('placeholder');
const coverUrl = isPlaceholder ? ZYLO_LOGO : rawCoverUrl;
  const mixLogo = isMix ? (media as Mix)?.djPhotoUrl : undefined;
  const displayCover = mixLogo || coverUrl;
  const isRadioCover = !isMix;

  const isPlaying = state?.status === 'playing';
  const isLoading = state?.status === 'loading' || state?.status === 'buffering';
  const isError = state?.status === 'error';
  const isCurrentRadio = state?.mediaType === 'radio';

  const fallbackPlaylist = isMix && media ? [media as Mix] : [];
  const playlistItems = playlist.length > 0 ? playlist : fallbackPlaylist;
  const hasAnyPlaylist = playlistItems.length > 0;
  const djId = isMix ? (media as Mix)?.djId : undefined;
  const djGenres = Array.from(new Set(playlist.map(item => item.genre).filter(Boolean))) as string[];

  // Progreso
  const progress = state?.duration > 0 
    ? ((state?.currentTime ?? 0) / (state?.duration ?? 1)) * 100 
    : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isMix || !state?.duration) return;
    const rect = e?.currentTarget?.getBoundingClientRect?.();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const x = (clientX ?? 0) - (rect?.left ?? 0);
    const percentage = x / (rect?.width ?? 1);
    seek?.(percentage * (state?.duration ?? 0));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume?.(parseFloat(e?.target?.value ?? '0.8'));
  };

  useEffect(() => {
    if (isMix && media) {
      setIsLikedState(isLiked((media as Mix).id));
    } else {
      setIsLikedState(false);
    }
  }, [media, isMix]);

  useEffect(() => {
    const loadRadio = async () => {
      try {
        const res = await fetch('/api/radio');
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          const defaultRadio = data.data.find((r: RadioStation) => r.isDefault) || data.data[0];
          setRadioStation(defaultRadio);
        }
      } catch (err) {
        console.error('Error loading radio:', err);
      }
    };
    loadRadio();
  }, []);

  const handleToggleLike = () => {
    if (!isMix || !media) return;
    toggleLike((media as Mix).id);
    setIsLikedState(isLiked((media as Mix).id));
  };

  const handleShare = async () => {
    const shareTitle = title ?? 'ZyloFM';
    const shareText = subtitle ?? 'Escucha en ZyloFM';
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        return;
      }
    }
    if (navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  useEffect(() => {
    if (!showPlaylist && !showOptions) return;
    const timer = window.setTimeout(() => {
      setShowPlaylist(false);
      setShowOptions(false);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [showPlaylist, showOptions]);

  const handleLiveClick = async () => {
    let station = radioStation;
    if (!station) {
      try {
        const res = await fetch('/api/radio');
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          station = data.data.find((r: RadioStation) => r.isDefault) || data.data[0];
          setRadioStation(station);
        }
      } catch (err) {
        console.error('Error loading radio:', err);
      }
    }

    if (!station) return;

    if (isCurrentRadio && isPlaying) {
      pause?.();
    } else if (isCurrentRadio) {
      play?.();
    } else {
      playRadio?.(station);
    }
  };

  return (
    <AnimatePresence>
      {isNowPlayingOpen && media && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[100] overflow-hidden bg-black"
        >
          {/* Fondo sólido + imagen desenfocada */}
          <div className="absolute inset-0 bg-black">
            <Image
              src={coverUrl}
              alt="Background"
              fill
              className="object-cover scale-110 blur-3xl opacity-20"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/95 to-black" />
          </div>

          {/* Ondas de audio animadas */}
          <AudioWaves isPlaying={isPlaying} />

          <div className="relative h-full flex flex-col max-w-lg mx-auto px-6 py-6 safe-area-inset">
            {/* Header - minimalista */}
            <div className="flex items-center justify-between mb-2">
              <motion.button
                onClick={() => setNowPlayingOpen(false)}
                className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="Cerrar"
                whileTap={{ scale: 0.9 }}
              >
                <ChevronDown className="w-7 h-7" />
              </motion.button>
              <div className="w-10" />
              <div className="w-10" />
            </div>

            {/* Info + Cover */}
            <div className="flex-1 flex flex-col items-center justify-start min-h-0 pt-2">
              {/* Info - arriba de la portada */}
              <div className="text-center mb-4 sm:mb-6 px-4 mt-6">
                <motion.h2 
                  className="text-base sm:text-lg font-semibold text-white truncate max-w-[300px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {title ?? 'Sin título'}
                </motion.h2>
                <motion.p 
                  className="text-white/50 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {subtitle ?? 'Desconocido'}
                </motion.p>
              </div>

              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="relative w-full max-w-[180px] sm:max-w-[220px] aspect-square"
              >
                {/* Glow circular más grande */}
                <div className="absolute inset-[-38px] rounded-full bg-gradient-to-br from-cyan-400/70 via-purple-500/70 to-pink-500/70 blur-3xl opacity-90" />
                
                {/* Contenedor principal */}
                <motion.div
                  className="relative w-full h-full flex items-center justify-center"
                  animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className={`relative w-[86%] h-[86%] overflow-hidden shadow-2xl ring-1 ring-white/10 translate-y-36 ${isRadioCover ? 'rounded-2xl' : 'rounded-full'}`}>
                    <Image
                      src={displayCover}
                      alt={title ?? 'Cover'}
                      fill
                      className={`object-cover ${isRadioCover ? 'rounded-2xl' : 'rounded-full'}`}
                      sizes="(max-width: 640px) 180px, 220px"
                      priority
                    />

                    {/* Overlay para radio en vivo */}
                    {isRadioCover && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-6">
                        <div className="flex items-center gap-2 text-red-500">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm font-bold uppercase tracking-wider">En Vivo</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Indicador de carga */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Ecualizador - El latido de ZyloFM */}
            <div className="flex items-center justify-center py-3 sm:py-4">
              <Equalizer isPlaying={isPlaying} />
            </div>

            {/* Barra de progreso (solo mixes) */}
            {isMix && (
              <div className="mb-4">
                <div 
                  className="h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden group"
                  onClick={handleSeek}
                  onTouchMove={handleSeek}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Bolita de progreso */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>
                <div className="flex justify-between text-xs text-white/50 mt-2 px-1">
                  <span>{formatDuration(state?.currentTime ?? 0)}</span>
                  <span>{formatDuration(state?.duration ?? 0)}</span>
                </div>
              </div>
            )}

            {/* Controles principales - Play/Pause */}
            <div className="flex items-center justify-center mb-4">
              <motion.button
                onClick={() => isPlaying ? pause?.() : play?.()}
                disabled={isLoading}
                className="relative w-16 h-16 sm:w-20 sm:h-20"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`absolute inset-0 rounded-full shadow-2xl transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-purple-600 shadow-cyan-500/50' 
                    : 'bg-white shadow-white/30'
                }`} />
                {isPlaying && (
                  <>
                    <motion.div 
                      className="absolute inset-[-4px] rounded-full border-2 border-cyan-400/50"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                      className="absolute inset-[-8px] rounded-full border border-purple-500/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                  </>
                )}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className={`w-8 h-8 sm:w-10 sm:h-10 animate-spin ${isPlaying ? 'text-white' : 'text-zinc-900'}`} />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="white" />
                  ) : (
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-900 ml-1" fill="currentColor" />
                  )}
                </div>
              </motion.button>
            </div>

            {/* Controles principales (5 botones) */}
            <div className="flex items-center justify-between gap-4 px-2">
              <motion.button
                onClick={() => setShowPlaylist(!showPlaylist)}
                disabled={!hasAnyPlaylist}
                className={`p-3 rounded-full transition-colors ${showPlaylist ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'} disabled:opacity-30 disabled:cursor-not-allowed`}
                aria-label="Lista de mixes"
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative w-6 h-6">
                  <List className="w-6 h-6" />
                  <Music className="w-3 h-3 absolute -bottom-1 -right-1" />
                </div>
              </motion.button>

              <motion.button
                onClick={() => skipBackward?.(15)}
                disabled={!isMix}
                className="p-3 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Retroceder 15 segundos"
                whileTap={{ scale: 0.9 }}
              >
                <SkipBack className="w-6 h-6" />
              </motion.button>

              <motion.button
                onClick={handleLiveClick}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-colors ${
                  isCurrentRadio ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/80 hover:text-white'
                }`}
                aria-label="ZyloFM Live"
                whileTap={{ scale: 0.95 }}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live
              </motion.button>

              <motion.button
                onClick={() => skipForward?.(15)}
                disabled={!isMix}
                className="p-3 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Adelantar 15 segundos"
                whileTap={{ scale: 0.9 }}
              >
                <SkipForward className="w-6 h-6" />
              </motion.button>

              <motion.button
                onClick={() => setShowOptions(true)}
                className="p-3 text-white/70 hover:text-white transition-colors"
                aria-label="Más opciones"
                whileTap={{ scale: 0.9 }}
              >
                <MoreHorizontal className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Controles secundarios */}
            <div className="flex items-center justify-center gap-4 px-4 mt-4">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={toggleMute}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                  aria-label={state?.isMuted ? 'Activar sonido' : 'Silenciar'}
                  whileTap={{ scale: 0.9 }}
                >
                  {state?.isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </motion.button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state?.isMuted ? 0 : (state?.volume ?? 0.8)}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* Stop */}
              <motion.button
                onClick={() => {
                  stop?.();
                  setNowPlayingOpen(false);
                }}
                className="p-2 text-white/50 hover:text-red-500 transition-colors"
                aria-label="Detener"
                whileTap={{ scale: 0.9 }}
              >
                <Square className="w-5 h-5" fill="currentColor" />
              </motion.button>
            </div>

            {/* Panel de Playlist */}
            <AnimatePresence>
              {showPlaylist && hasAnyPlaylist && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Cerrar lista"
                    className="absolute inset-0 bg-black/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowPlaylist(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-1/2 -translate-y-1/2 left-4 w-[78%] max-w-sm bg-zinc-900/98 backdrop-blur-xl rounded-2xl max-h-[60%] overflow-hidden border border-white/10"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="font-semibold text-white">Lista de reproducción</h3>
                      <span className="text-sm text-white/50">{playlistItems.length} mixes</span>
                    </div>
                    <div className="overflow-y-auto max-h-[300px] p-2">
                      {playlistItems.map((item, index) => {
                      const effectiveIndex = playlist.length > 0 ? currentIndex : 0;
                      const isCurrentlyPlaying = index === effectiveIndex;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => {
                            if (playlist.length === 0 || index !== currentIndex) {
                              playMix(item);
                            }
                            setShowPlaylist(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isCurrentlyPlaying 
                              ? 'bg-cyan-500/20 border border-cyan-500/30' 
                              : 'hover:bg-white/5'
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Número o Ecualizador mini */}
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            {isCurrentlyPlaying && isPlaying ? (
                              <div className="flex items-end gap-0.5 h-4">
                                {[1,2,3].map(i => (
                                  <motion.div
                                    key={i}
                                    className="w-1 bg-cyan-400 rounded-full"
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className={`text-sm ${isCurrentlyPlaying ? 'text-cyan-400 font-bold' : 'text-white/40'}`}>
                                {index + 1}
                              </span>
                            )}
                          </div>
                          
                          {/* Cover mini */}
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                            <Image
                              src={item.djPhotoUrl || item.coverUrl || ZYLO_LOGO}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm font-medium truncate ${isCurrentlyPlaying ? 'text-cyan-400' : 'text-white'}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-white/40 truncate">{item.djName}</p>
                          </div>
                          
                          {/* Duración */}
                          <span className="text-xs text-white/40">
                            {formatDuration(item.durationSec || 0)}
                          </span>
                        </motion.button>
                      );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Panel de opciones */}
            <AnimatePresence>
              {showOptions && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Cerrar opciones"
                    className="absolute inset-0 bg-black/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowOptions(false)}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Panel de opciones */}
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-1/2 -translate-y-1/2 right-4 w-[78%] max-w-sm bg-zinc-900/98 backdrop-blur-xl rounded-2xl max-h-[60%] overflow-hidden border border-white/10"
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Más opciones</h3>
                    <button
                      onClick={() => setShowOptions(false)}
                      className="text-white/50 hover:text-white transition-colors"
                      aria-label="Cerrar opciones"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <button
                      onClick={() => {
                        if (djId) {
                          router.push(`/dj/${djId}`);
                          setShowOptions(false);
                        }
                      }}
                      disabled={!djId}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition disabled:opacity-40"
                    >
                      Ver perfil del DJ
                    </button>

                    <div className="px-4">
                      <p className="text-xs text-white/40 mb-2">Géneros del DJ</p>
                      <div className="flex flex-wrap gap-2">
                        {djGenres.length > 0 ? (
                          djGenres.map((genre) => (
                            <span key={genre} className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300">
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-white/40">Sin géneros</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        router.push('/radio');
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                    >
                      Ir a ZyloFM Radio
                    </button>

                    <button
                      onClick={() => {
                        handleToggleLike();
                      }}
                      disabled={!isMix}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition disabled:opacity-40"
                    >
                      {isLikedState ? 'Quitar de guardados' : 'Guardar mix'}
                    </button>

                    <button
                      onClick={async () => {
                        await handleShare();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                    >
                      Compartir
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {isError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-center"
              >
                <p className="text-red-400 text-sm flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {state?.error ?? 'Error al reproducir'}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { usePlayer } from '@/context/player-context';
import { formatDuration } from '@/lib/mock-data';
import { Mix } from '@/lib/types';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Disc3, Heart } from 'lucide-react';
import Image from 'next/image';
import { ZYLO_LOGO } from './cover-image';
import { useState, useEffect } from 'react';
import { isLiked, toggleLike } from '@/lib/likes-store';

interface MixCardProps {
  mix: Mix;
  index?: number;
}

/**
 * Obtiene la URL de portada correcta según las reglas:
 * 1. Si el mix tiene coverUrl propio → usar coverUrl
 * 2. Si el DJ tiene logo/foto (djPhotoUrl) → usar djPhotoUrl
 * 3. Si no hay nada → usar logo ZyloFM
 */
function getCoverUrl(mix: Mix): string {
  // Si tiene cover específico del mix
  if (mix?.coverUrl && !mix.coverUrl.includes('unsplash') && !mix.coverUrl.includes('placeholder')) {
    return mix.coverUrl;
  }
  // Si el DJ tiene foto/logo
  if (mix?.djPhotoUrl) {
    return mix.djPhotoUrl;
  }
  // Default: logo ZyloFM
  return ZYLO_LOGO;
}

export function MixCard({ mix, index = 0 }: MixCardProps) {
  const { state, playMix, pause, play } = usePlayer();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isLiked(mix?.id));
  }, [mix?.id]);

  const isCurrentMix = state?.currentMedia && 
    state?.mediaType === 'mix' && 
    (state?.currentMedia as Mix)?.id === mix?.id;
  const isPlaying = isCurrentMix && state?.status === 'playing';
  const isLoading = isCurrentMix && (state?.status === 'loading' || state?.status === 'buffering');

  const coverUrl = getCoverUrl(mix);
  const isZyloLogo = coverUrl === ZYLO_LOGO;

  const handleClick = () => {
    if (isCurrentMix) {
      if (isPlaying) {
        pause?.();
      } else {
        play?.();
      }
    } else {
      playMix?.(mix);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleLike(mix?.id);
    setLiked(newState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index ?? 0) * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className={`group relative bg-zinc-900/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-zinc-800/70 ${
        isCurrentMix ? 'ring-2 ring-cyan-500/50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Cover */}
      <div className="relative aspect-square">
        <Image
          src={coverUrl}
          alt={mix?.title ?? 'Mix cover'}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            isZyloLogo ? 'object-contain p-6 bg-zinc-800' : ''
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              liked ? 'text-red-500 fill-red-500' : 'text-white'
            }`} 
          />
        </button>
        
        {/* Nombre del DJ si usa logo ZyloFM */}
        {isZyloLogo && mix?.djName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium text-center truncate">
              {mix.djName}
            </p>
          </div>
        )}
        
        {/* Badge ZyloFM si el DJ tiene foto propia */}
        {!isZyloLogo && mix?.djPhotoUrl && (
          <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full overflow-hidden ring-2 ring-black shadow-lg">
            <Image
              src={ZYLO_LOGO}
              alt="ZyloFM"
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        
        {/* Overlay de reproducción */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
          isCurrentMix ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 sm:p-4 bg-cyan-500 rounded-full text-white shadow-lg hover:bg-cyan-400 transition-colors"
          >
            {isLoading ? (
              <Disc3 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-0.5" fill="currentColor" />
            )}
          </motion.button>
        </div>

        {/* Indicador de reproducción actual */}
        {isCurrentMix && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-cyan-500 rounded-full">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs text-white font-medium">
                {isPlaying ? 'Sonando' : 'Pausado'}
              </span>
            </div>
          </div>
        )}

        {/* Like indicator when liked */}
        {liked && !isCurrentMix && (
          <div className="absolute bottom-2 right-2">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="text-white font-semibold text-sm sm:text-base truncate mb-1">
          {mix?.title ?? 'Sin título'}
        </h3>
        <p className="text-zinc-400 text-xs sm:text-sm truncate mb-2 sm:mb-3">
          {mix?.djName ?? 'DJ Desconocido'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(mix?.durationSec ?? 0)}
            </span>
            {mix?.bpm && (
              <span className="flex items-center gap-1">
                <Disc3 className="w-3 h-3" />
                {mix.bpm}
              </span>
            )}
          </div>
          {(mix?.genres?.[0] || mix?.genre) && (
            <span className="px-2 py-0.5 bg-zinc-800 rounded-full truncate max-w-[80px] sm:max-w-[120px]">
              {mix?.genres?.[0] || mix?.genre}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

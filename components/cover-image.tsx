'use client';

import Image from 'next/image';
import { useState } from 'react';

const ZYLO_LOGO = '/zylo-logo.png';

interface CoverImageProps {
  // URL de la imagen (portada del DJ o mix)
  src?: string | null;
  // Nombre del DJ (para mostrar si no hay logo)
  djName?: string | null;
  // Si es contenido oficial de ZyloFM
  isOfficial?: boolean;
  // Tamaño de la imagen
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  // Clase adicional
  className?: string;
  // Alt text
  alt?: string;
  // Mostrar badge de ZyloFM (para mixes de DJs)
  showBadge?: boolean;
}

/**
 * Componente de portada inteligente para ZyloFM
 * 
 * Reglas de portada:
 * 1. Contenido oficial ZyloFM (radio 24/7, destacados) → Logo ZyloFM
 * 2. Mix de DJ con logo propio → Logo DJ + badge ZyloFM
 * 3. DJ sin logo → Logo ZyloFM + nombre del DJ
 */
export function CoverImage({
  src,
  djName,
  isOfficial = false,
  size = 'md',
  className = '',
  alt = 'Cover',
  showBadge = true,
}: CoverImageProps) {
  const [imageError, setImageError] = useState(false);

  // Determinar qué imagen mostrar
  const hasCustomCover = src && !imageError;
  const showZyloLogo = isOfficial || !hasCustomCover;
  const coverSrc = showZyloLogo ? ZYLO_LOGO : src;

  // Tamaños
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    full: 'w-full h-full',
  };

  const badgeSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    full: 'w-10 h-10',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Imagen principal */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-800">
        <Image
          src={coverSrc || ZYLO_LOGO}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === 'full' ? '100vw' : '128px'}
          onError={() => setImageError(true)}
          priority={size === 'xl' || size === 'full'}
        />

        {/* Overlay con nombre del DJ si no tiene imagen y no es oficial */}
        {!hasCustomCover && !isOfficial && djName && (
          <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            <span className="text-white text-xs font-medium text-center truncate w-full">
              {djName}
            </span>
          </div>
        )}
      </div>

      {/* Badge de ZyloFM (para mixes de DJs con imagen propia) */}
      {showBadge && hasCustomCover && !isOfficial && (
        <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} rounded-full overflow-hidden ring-2 ring-black shadow-lg`}>
          <Image
            src={ZYLO_LOGO}
            alt="ZyloFM"
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Hook para obtener la URL de portada correcta
 */
export function getCoverUrl(src?: string | null, isOfficial?: boolean): string {
  if (isOfficial || !src) {
    return ZYLO_LOGO;
  }
  return src;
}

/**
 * Constante del logo para uso externo
 */
export { ZYLO_LOGO };

'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/player-context';
import { motion } from 'framer-motion';
import { Radio, Play, Pause, Loader2, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { RadioStation } from '@/lib/types';

export function RadioButton() {
  const { state, playRadio, pause, play } = usePlayer();
  const [radioStation, setRadioStation] = useState<RadioStation | null>(null);
  const [loadingStation, setLoadingStation] = useState(true);

  // Cargar la radio desde la API
  useEffect(() => {
    const loadRadio = async () => {
      try {
        const res = await fetch('/api/radio');
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          // Buscar la radio por defecto o usar la primera
          const defaultRadio = data.data.find((r: RadioStation) => r.isDefault) || data.data[0];
          setRadioStation(defaultRadio);
        }
      } catch (err) {
        console.error('Error loading radio:', err);
      } finally {
        setLoadingStation(false);
      }
    };
    loadRadio();
  }, []);

  const isCurrentRadio = state?.mediaType === 'radio';
  const isPlaying = isCurrentRadio && state?.status === 'playing';
  const isLoading = isCurrentRadio && (state?.status === 'loading' || state?.status === 'buffering');

  const handleClick = () => {
    if (!radioStation) return;
    
    if (isCurrentRadio) {
      if (isPlaying) {
        pause?.();
      } else {
        play?.();
      }
    } else {
      playRadio?.(radioStation);
    }
  };

  // No mostrar si no hay radio configurada
  if (loadingStation) {
    return (
      <div className="rounded-2xl bg-zinc-900/50 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!radioStation) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Banner Profesional de ZyloFM Radio */}
      <div
        onClick={handleClick}
        className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ${
          isCurrentRadio
            ? 'ring-2 ring-cyan-500 shadow-2xl shadow-cyan-500/30'
            : 'hover:shadow-xl hover:shadow-cyan-500/20'
        }`}
      >
        {/* Background Gradient Animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
        
        {/* Pattern de ondas */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {[...Array(10)].map((_, i) => (
              <motion.path
                key={i}
                d={`M0,${50 + i * 5} Q25,${45 + i * 5} 50,${50 + i * 5} T100,${50 + i * 5}`}
                fill="none"
                stroke="url(#waveGrad)"
                strokeWidth="0.5"
                animate={{
                  d: [
                    `M0,${50 + i * 5} Q25,${45 + i * 5} 50,${50 + i * 5} T100,${50 + i * 5}`,
                    `M0,${50 + i * 5} Q25,${55 + i * 5} 50,${50 + i * 5} T100,${50 + i * 5}`,
                    `M0,${50 + i * 5} Q25,${45 + i * 5} 50,${50 + i * 5} T100,${50 + i * 5}`,
                  ],
                }}
                transition={{
                  duration: 3 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </svg>
        </div>

        {/* Glow Effect cuando está reproduciendo */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo y Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo Container */}
              <div className="relative">
                <motion.div
                  className={`relative w-[60px] h-[60px] sm:w-[76px] sm:h-[76px] flex items-center justify-center ${
                    isPlaying ? 'shadow-lg shadow-cyan-500/50' : ''
                  }`}
                  animate={isPlaying ? { scale: [1, 1.015, 1] } : {}}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-cyan-500/40 to-purple-600/40 blur-2xl pulse-slow" />
                  <div className="relative w-[82%] h-[82%] rounded-2xl overflow-hidden bg-black flex items-center justify-center translate-y-[3px] ring-1 ring-white/10">
                    <Image
                      src="/zylo-logo.png"
                      alt="ZyloFM"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                </motion.div>
                
                {/* Live indicator */}
                {isPlaying && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    ZYLO RADIO
                  </h3>
                  {isPlaying && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      En Vivo
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 text-sm sm:text-base">
                  {isPlaying ? 'Transmitiendo ahora' : 'Transmisión 24/7 • Música sin parar'}
                </p>
                
                {/* Sound Bars Animation */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 mt-2 h-4">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                        animate={{
                          height: ['4px', `${8 + Math.random() * 12}px`, '4px'],
                        }}
                        transition={{
                          duration: 0.5 + Math.random() * 0.3,
                          repeat: Infinity,
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Play Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCurrentRadio
                  ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/30'
              }`}
            >
              {/* Outer ring animation */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-cyan-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              
              {isLoading ? (
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" />
              )}
            </motion.button>
          </div>

          {/* Bottom Tag */}
          <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500 text-xs sm:text-sm">
              <Radio className="w-4 h-4" />
              <span>Los mejores mixes de DJ • House • Techno • Reggaeton</span>
            </div>
            {isPlaying && (
              <div className="flex items-center gap-1 text-cyan-400">
                <Volume2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

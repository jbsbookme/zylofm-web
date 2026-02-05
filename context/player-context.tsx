'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { PlayerState, PlayerStatus, Mix, RadioStation, MediaType } from '@/lib/types';

// Estado inicial del reproductor
const initialState: PlayerState = {
  status: 'idle',
  currentMedia: null,
  mediaType: null,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  error: undefined,
};

// Interfaz del contexto
interface PlayerContextType {
  state: PlayerState;
  playlist: Mix[];
  currentIndex: number;
  playMix: (mix: Mix) => void;
  playRadio: (station: RadioStation) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaylist: (mixes: Mix[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  isNowPlayingOpen: boolean;
  setNowPlayingOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

// Reducer para manejar el estado
type Action =
  | { type: 'SET_MEDIA'; payload: { media: Mix | RadioStation; mediaType: MediaType } }
  | { type: 'SET_STATUS'; payload: PlayerStatus }
  | { type: 'SET_TIME'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'STOP' };

function playerReducer(state: PlayerState, action: Action): PlayerState {
  switch (action?.type) {
    case 'SET_MEDIA':
      return {
        ...state,
        currentMedia: action?.payload?.media ?? null,
        mediaType: action?.payload?.mediaType ?? null,
        currentTime: 0,
        duration: action?.payload?.mediaType === 'mix' 
          ? ((action?.payload?.media as Mix)?.durationSec ?? 0) 
          : 0,
        status: 'loading',
        error: undefined,
      };
    case 'SET_STATUS':
      return { ...state, status: action?.payload ?? 'idle' };
    case 'SET_TIME':
      return {
        ...state,
        currentTime: action?.payload?.currentTime ?? 0,
        duration: action?.payload?.duration ?? state?.duration ?? 0,
      };
    case 'SET_VOLUME':
      return { ...state, volume: action?.payload ?? 0.8 };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state?.isMuted };
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action?.payload ?? 'Error desconocido' };
    case 'STOP':
      return { ...initialState, volume: state?.volume ?? 0.8, isMuted: state?.isMuted ?? false };
    default:
      return state;
  }
}

// Componente Provider
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const [isNowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [playlist, setPlaylistState] = useState<Mix[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const shouldAutoplayRef = useRef(false);

  // Montar solo en cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inicializar audio element
  useEffect(() => {
    if (!isMounted) return;
    
    if (typeof window !== 'undefined' && !audioRef?.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state?.volume ?? 0.8;
    }
    
    return () => {
      hlsRef?.current?.destroy?.();
      audioRef?.current?.pause?.();
    };
  }, [isMounted]);

  // Actualizar volume/mute
  useEffect(() => {
    if (audioRef?.current) {
      audioRef.current.volume = state?.isMuted ? 0 : (state?.volume ?? 0.8);
    }
  }, [state?.volume, state?.isMuted]);

  // Cargar y reproducir medio HLS o directo
  const loadMedia = useCallback((url: string) => {
    const audio = audioRef?.current;
    if (!audio || !url) return;

    // Destruir HLS anterior si existe
    hlsRef?.current?.destroy?.();
    hlsRef.current = null;

    // Función para intentar reproducir con manejo de errores
    const tryPlay = () => {
      const playPromise = audio?.play?.();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            dispatch({ type: 'SET_STATUS', payload: 'playing' });
          })
          .catch((error) => {
            console.log('Autoplay bloqueado, esperando interacción:', error);
            dispatch({ type: 'SET_STATUS', payload: 'paused' });
          });
      }
    };

    // Si es HLS
    if (url?.includes?.('.m3u8')) {
      // Safari soporta HLS nativamente
      if (audio?.canPlayType?.('application/vnd.apple.mpegurl')) {
        audio.src = url;
        audio.load();
        tryPlay();
      } else if (Hls?.isSupported?.()) {
        // Otros navegadores usan hls.js
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls?.loadSource?.(url);
        hls?.attachMedia?.(audio);
        hls?.on?.(Hls?.Events?.MANIFEST_PARSED, () => {
          tryPlay();
        });
        hls?.on?.(Hls?.Events?.ERROR, (_event, data) => {
          if (data?.fatal) {
            dispatch({ type: 'SET_ERROR', payload: 'Error al cargar stream HLS' });
          }
        });
        hlsRef.current = hls;
      }
    } else {
      // Audio directo (MP3, etc.) - funciona en todos los navegadores
      audio.src = url;
      audio.load();
      tryPlay();
    }
  }, []);

  // Función para reproducir siguiente
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.length) {
      const nextMix = playlist[nextIndex];
      setCurrentIndex(nextIndex);
      dispatch({ type: 'SET_MEDIA', payload: { media: nextMix, mediaType: 'mix' } });
      loadMedia(nextMix?.hlsUrl ?? '');
    } else {
      // Playlist terminada - volver al inicio
      const firstMix = playlist[0];
      setCurrentIndex(0);
      dispatch({ type: 'SET_MEDIA', payload: { media: firstMix, mediaType: 'mix' } });
      loadMedia(firstMix?.hlsUrl ?? '');
    }
  }, [playlist, currentIndex, loadMedia]);

  // Función para reproducir anterior
  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevMix = playlist[prevIndex];
      setCurrentIndex(prevIndex);
      dispatch({ type: 'SET_MEDIA', payload: { media: prevMix, mediaType: 'mix' } });
      loadMedia(prevMix?.hlsUrl ?? '');
    }
  }, [playlist, currentIndex, loadMedia]);

  // Eventos del audio
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      dispatch({
        type: 'SET_TIME',
        payload: {
          currentTime: audio?.currentTime ?? 0,
          duration: audio?.duration ?? 0,
        },
      });
    };

    const handlePlay = () => dispatch({ type: 'SET_STATUS', payload: 'playing' });
    const handlePause = () => dispatch({ type: 'SET_STATUS', payload: 'paused' });
    const handleWaiting = () => dispatch({ type: 'SET_STATUS', payload: 'buffering' });
    const handlePlaying = () => dispatch({ type: 'SET_STATUS', payload: 'playing' });
    const handleError = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Error al reproducir audio' });
    };
    
    // AUTOPLAY: Cuando termina la canción, reproducir la siguiente
    const handleEnded = () => {
      if (state?.mediaType === 'mix' && playlist.length > 0) {
        playNext();
      } else {
        dispatch({ type: 'STOP' });
      }
    };

    audio?.addEventListener?.('timeupdate', handleTimeUpdate);
    audio?.addEventListener?.('play', handlePlay);
    audio?.addEventListener?.('pause', handlePause);
    audio?.addEventListener?.('waiting', handleWaiting);
    audio?.addEventListener?.('playing', handlePlaying);
    audio?.addEventListener?.('error', handleError);
    audio?.addEventListener?.('ended', handleEnded);

    return () => {
      audio?.removeEventListener?.('timeupdate', handleTimeUpdate);
      audio?.removeEventListener?.('play', handlePlay);
      audio?.removeEventListener?.('pause', handlePause);
      audio?.removeEventListener?.('waiting', handleWaiting);
      audio?.removeEventListener?.('playing', handlePlaying);
      audio?.removeEventListener?.('error', handleError);
      audio?.removeEventListener?.('ended', handleEnded);
    };
  }, [state?.mediaType, playlist.length, playNext]);

  // Media Session API
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator?.mediaSession) return;
    if (!state?.currentMedia) return;

    const media = state?.currentMedia;
    const isMix = state?.mediaType === 'mix';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: (media as Mix)?.title ?? (media as RadioStation)?.name ?? 'ZyloFM',
      artist: isMix ? (media as Mix)?.djName : 'ZyloFM Radio',
      album: 'ZyloFM',
      artwork: [
        {
          src: media?.coverUrl ?? '/og-image.png',
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('stop', () => stop());
    navigator.mediaSession.setActionHandler('previoustrack', playlist.length > 0 ? () => playPrevious() : null);
    navigator.mediaSession.setActionHandler('nexttrack', playlist.length > 0 ? () => playNext() : null);
    
    if (isMix) {
      navigator.mediaSession.setActionHandler('seekbackward', () => skipBackward(15));
      navigator.mediaSession.setActionHandler('seekforward', () => skipForward(15));
    } else {
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    }
  }, [state?.currentMedia, state?.mediaType, playlist.length]);

  // Acciones del reproductor
  const playMix = useCallback((mix: Mix) => {
    // Buscar el mix en la playlist actual
    const index = playlist.findIndex(m => m.id === mix.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
    dispatch({ type: 'SET_MEDIA', payload: { media: mix, mediaType: 'mix' } });
    loadMedia(mix?.hlsUrl ?? '');
  }, [loadMedia, playlist]);

  const playRadio = useCallback((station: RadioStation) => {
    // Limpiar playlist cuando se reproduce radio
    setPlaylistState([]);
    setCurrentIndex(-1);
    dispatch({ type: 'SET_MEDIA', payload: { media: station, mediaType: 'radio' } });
    loadMedia(station?.streamUrl ?? '');
  }, [loadMedia]);

  const setPlaylist = useCallback((mixes: Mix[], startIndex: number = 0) => {
    setPlaylistState(mixes);
    setCurrentIndex(startIndex);
    if (mixes.length > 0 && startIndex < mixes.length) {
      const mix = mixes[startIndex];
      dispatch({ type: 'SET_MEDIA', payload: { media: mix, mediaType: 'mix' } });
      loadMedia(mix?.hlsUrl ?? '');
    }
  }, [loadMedia]);

  const play = useCallback(() => {
    audioRef?.current?.play?.()?.catch?.(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef?.current?.pause?.();
  }, []);

  const stop = useCallback(() => {
    hlsRef?.current?.destroy?.();
    hlsRef.current = null;
    if (audioRef?.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPlaylistState([]);
    setCurrentIndex(-1);
    dispatch({ type: 'STOP' });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef?.current && state?.mediaType === 'mix') {
      audioRef.current.currentTime = Math.max(0, Math.min(time, audioRef?.current?.duration ?? 0));
    }
  }, [state?.mediaType]);

  const skipForward = useCallback((seconds = 15) => {
    if (audioRef?.current && state?.mediaType === 'mix') {
      audioRef.current.currentTime = Math.min(
        (audioRef?.current?.currentTime ?? 0) + seconds,
        audioRef?.current?.duration ?? 0
      );
    }
  }, [state?.mediaType]);

  const skipBackward = useCallback((seconds = 15) => {
    if (audioRef?.current && state?.mediaType === 'mix') {
      audioRef.current.currentTime = Math.max(
        (audioRef?.current?.currentTime ?? 0) - seconds,
        0
      );
    }
  }, [state?.mediaType]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: Math.max(0, Math.min(1, volume)) });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  // Atajos de teclado
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e?.target as HTMLElement)?.tagName === 'INPUT' || 
          (e?.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      
      if (state?.status === 'idle') return;

      switch (e?.key) {
        case ' ':
          e?.preventDefault?.();
          if (state?.status === 'playing') pause();
          else play();
          break;
        case 'ArrowRight':
          if (state?.mediaType === 'mix') skipForward(15);
          break;
        case 'ArrowLeft':
          if (state?.mediaType === 'mix') skipBackward(15);
          break;
        case 'n':
        case 'N':
          if (playlist.length > 0) playNext();
          break;
        case 'p':
        case 'P':
          if (playlist.length > 0) playPrevious();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
      }
    };

    window?.addEventListener?.('keydown', handleKeyDown);
    return () => window?.removeEventListener?.('keydown', handleKeyDown);
  }, [state?.status, state?.mediaType, play, pause, skipForward, skipBackward, toggleMute, playNext, playPrevious, playlist.length]);

  const value: PlayerContextType = {
    state,
    playlist,
    currentIndex,
    playMix,
    playRadio,
    play,
    pause,
    stop,
    seek,
    skipForward,
    skipBackward,
    setVolume,
    toggleMute,
    setPlaylist,
    playNext,
    playPrevious,
    isNowPlayingOpen,
    setNowPlayingOpen,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

// Hook para usar el contexto
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer debe usarse dentro de PlayerProvider');
  }
  return context;
}

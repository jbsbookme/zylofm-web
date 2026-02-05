'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  ArrowLeft, Loader2, Music2, RefreshCw 
} from 'lucide-react';
import Image from 'next/image';
import { ZYLO_LOGO } from '@/components/cover-image';

interface KaraokeTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string | null;
  coverUrl: string | null;
  lyrics: string | null;
  durationSec: number | null;
}

interface LyricLine {
  time: number; // in seconds
  text: string;
}

// Parse LRC format lyrics
function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/;
  
  lrc.split('\n').forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) / 1000 : 0;
      const time = minutes * 60 + seconds + ms;
      const text = match[4].trim();
      if (text) {
        lines.push({ time, text });
      }
    }
  });
  
  return lines.sort((a, b) => a.time - b.time);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function KaraokePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const [track, setTrack] = useState<KaraokeTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  useEffect(() => {
    if (params.id) {
      loadTrack(params.id as string);
    }
  }, [params.id]);

  // Parse lyrics when track loads
  useEffect(() => {
    if (track?.lyrics) {
      const parsed = parseLRC(track.lyrics);
      setLyrics(parsed);
    }
  }, [track?.lyrics]);

  // Update current line based on time
  useEffect(() => {
    if (lyrics.length === 0) return;
    
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    setCurrentLineIndex(index);
  }, [currentTime, lyrics]);

  // Auto-scroll to current lyric
  useEffect(() => {
    if (currentLineIndex >= 0 && lyricsContainerRef.current) {
      const activeLine = lyricsContainerRef.current.querySelector(`[data-index="${currentLineIndex}"]`);
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLineIndex]);

  const loadTrack = async (id: string) => {
    try {
      const res = await fetch(`/api/karaoke/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTrack(data);
      } else {
        router.push('/karaoke');
      }
    } catch (error) {
      console.error('Error loading track:', error);
      router.push('/karaoke');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setCurrentLineIndex(-1);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLyricClick = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500">Canción no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/30 via-black to-black">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={track.audioUrl || ''}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.push('/karaoke')}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate text-sm sm:text-base">{track.title}</h1>
            <p className="text-[11px] sm:text-sm text-zinc-400 truncate">{track.artist}</p>
          </div>
          <div className="flex items-center gap-1 text-pink-400">
            <Mic2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cover & Info */}
      <div className="px-4 py-5 sm:py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 sm:gap-4 max-w-md mx-auto"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-lg shadow-pink-500/20">
            <Image
              src={track.coverUrl || ZYLO_LOGO}
              alt={track.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">{track.title}</h2>
            <p className="text-sm sm:text-base text-zinc-400">{track.artist}</p>
          </div>
        </motion.div>
      </div>

      {/* Lyrics Display */}
      <div className="px-4 pb-44 sm:pb-48">
        <div
          ref={lyricsContainerRef}
          className="max-w-lg mx-auto h-[45vh] sm:h-[50vh] overflow-y-auto scrollbar-hide"
        >
          {lyrics.length > 0 ? (
            <div className="py-20 space-y-4">
              {lyrics.map((line, index) => (
                <motion.div
                  key={index}
                  data-index={index}
                  initial={{ opacity: 0.4 }}
                  animate={{ 
                    opacity: index === currentLineIndex ? 1 : 0.4,
                    scale: index === currentLineIndex ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleLyricClick(line.time)}
                  className={`text-center cursor-pointer transition-all py-2 px-4 rounded-lg ${
                    index === currentLineIndex 
                      ? 'text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent' 
                      : 'text-sm sm:text-lg text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {line.text}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <Music2 className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-zinc-500">Letras no disponibles para esta canción</p>
              <p className="text-zinc-600 text-sm mt-2">Disfruta la música instrumental</p>
            </div>
          )}
        </div>
      </div>

      {/* Player Controls - Fixed at Bottom */}
      <div className="fixed bottom-20 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-zinc-800">
        {/* Progress Bar */}
        <div className="px-4 pt-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ec4899 ${(currentTime / (duration || 1)) * 100}%, #3f3f46 ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 py-4">
          <button
            onClick={restart}
            className="p-2 sm:p-3 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => skip(-10)}
            className="p-2 sm:p-3 text-zinc-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            disabled={!track.audioUrl}
            className="p-3 sm:p-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause className="w-7 h-7 sm:w-8 sm:h-8" /> : <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1" />}
          </motion.button>

          <button
            onClick={() => skip(10)}
            className="p-2 sm:p-3 text-zinc-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 sm:p-3 text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

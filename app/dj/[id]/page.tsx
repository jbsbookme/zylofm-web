'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Music, Play, Pause, Clock, Instagram, Twitter, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
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
  genre: { name: string; slug: string } | null;
}

interface DJ {
  id: string;
  name: string | null;
  email: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  instagram: string | null;
  twitter: string | null;
  soundcloud: string | null;
  mixCount: number;
}

export default function DJProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [dj, setDJ] = useState<DJ | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loadingMixes, setLoadingMixes] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { state, pause, setPlaylist } = usePlayer();

  const loadMixes = async (reset = false) => {
    if (!params.id) return;
    if (loadingMore || loadingMixes) return;

    if (reset) {
      setLoadingMixes(true);
      setMixes([]);
      setNextCursor(null);
      setHasMore(true);
      setSelectedGenre('all');
    } else {
      setLoadingMore(true);
    }

    try {
      const cursorParam = reset ? '' : nextCursor ? `&cursor=${nextCursor}` : '';
      const res = await fetch(`/api/djs/${params.id}/mixes?limit=12${cursorParam}`);
      const data = await res.json();
      if (data.success) {
        setMixes(prev => (reset ? data.data : [...prev, ...data.data]));
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      console.error('Error loading mixes:', err);
    } finally {
      setLoadingMixes(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const loadDJ = async () => {
      try {
        const res = await fetch(`/api/djs/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setDJ(data.data);
        }
      } catch (err) {
        console.error('Error loading DJ:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadDJ();
      loadMixes(true);
    }
  }, [params.id]);

  useEffect(() => {
    if (!hasMore || loadingMore || loadingMixes) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMixes();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingMixes, nextCursor]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayMix = (mix: Mix, index: number, list: Mix[]) => {
    if (state.currentMedia?.id === mix.id && state.status === 'playing') {
      pause();
    } else {
      const playlistMixes = list.map(m => ({
        id: m.id,
        djId: dj?.id,
        title: m.title,
        djName: dj?.name || dj?.email.split('@')[0] || 'DJ',
        djPhotoUrl: dj?.photoUrl || undefined,
        durationSec: m.durationSec || 0,
        coverUrl: m.coverUrl || ZYLO_LOGO,
        hlsUrl: m.audioUrl || '',
        genre: m.genre?.name,
      })) || [];
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

  if (!dj) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <User className="w-16 h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-400">DJ no encontrado</p>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-cyan-500 text-black rounded-lg">
          Volver al inicio
        </button>
      </div>
    );
  }

  const djName = dj.name || dj.email.split('@')[0];
  const isVerified = dj.role === 'DJ' || dj.role === 'ADMIN';
  const heroImage = dj.photoUrl || ZYLO_LOGO;
  const isZyloHero = heroImage === ZYLO_LOGO;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Header con foto */}
      <div className="bg-gradient-to-b from-purple-900/30 to-zinc-950 pt-4 pb-6 sm:pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            {/* Foto del DJ */}
            <div className="relative w-32 h-32 sm:w-44 sm:h-44">
              <div className="absolute inset-[-12px] rounded-full bg-purple-500/20 blur-2xl" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-[86%] h-[86%] rounded-full overflow-hidden bg-zinc-800 ring-2 ring-purple-500/30 translate-y-2 shadow-xl">
                  <Image
                    src={heroImage}
                    alt={djName}
                    fill
                    className={isZyloHero ? 'object-contain p-6 bg-zinc-900 rounded-full' : 'object-cover rounded-full'}
                  />
                </div>
              </div>
            </div>

            {/* Info del DJ */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-purple-400 font-medium mb-1">DJ</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-4xl font-bold">{djName}</h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <CheckCircle className="w-3 h-3" />
                    DJ VERIFIED
                  </span>
                )}
              </div>
              {dj.bio && <p className="text-zinc-400 mt-2 max-w-lg">{dj.bio}</p>}
              
              {/* Redes sociales */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                {dj.instagram && (
                  <a href={`https://instagram.com/${dj.instagram}`} target="_blank" rel="noopener noreferrer" 
                     className="p-2 bg-zinc-800 rounded-full hover:bg-pink-500/20 hover:text-pink-400 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {dj.twitter && (
                  <a href={`https://twitter.com/${dj.twitter}`} target="_blank" rel="noopener noreferrer"
                     className="p-2 bg-zinc-800 rounded-full hover:bg-blue-500/20 hover:text-blue-400 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {dj.soundcloud && (
                  <a href={`https://soundcloud.com/${dj.soundcloud}`} target="_blank" rel="noopener noreferrer"
                     className="p-2 bg-zinc-800 rounded-full hover:bg-orange-500/20 hover:text-orange-400 transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>

              <p className="text-zinc-500 mt-3">
                {dj.mixCount} {dj.mixCount === 1 ? 'mix' : 'mixes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de mixes */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
          <Music className="w-5 h-5 text-cyan-400" />
          Mixes
        </h2>

        {mixes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                selectedGenre === 'all'
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {Array.from(new Set(mixes.map(m => m.genre?.slug).filter(Boolean)))
              .map((slug) => {
                const genreName = mixes.find(m => m.genre?.slug === slug)?.genre?.name || slug;
                return (
                  <button
                    key={slug as string}
                    onClick={() => setSelectedGenre(slug as string)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      selectedGenre === slug
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {genreName}
                  </button>
                );
              })}
          </div>
        )}

        {loadingMixes ? (
          <div className="text-center py-16 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500">Cargando mixes...</p>
          </div>
        ) : mixes.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Este DJ aún no tiene mixes publicados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(selectedGenre === 'all'
              ? mixes
              : mixes.filter(m => m.genre?.slug === selectedGenre)).map((mix, index) => {
              const isPlaying = state.currentMedia?.id === mix.id && state.status === 'playing';
              const isActive = state.currentMedia?.id === mix.id;
              const list = selectedGenre === 'all'
                ? mixes
                : mixes.filter(m => m.genre?.slug === selectedGenre);
              
              return (
                <motion.div
                  key={mix.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handlePlayMix(mix, index, list)}
                  className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <div className="w-8 text-center">
                    {isPlaying ? (
                      <div className="w-6 h-6 mx-auto rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-cyan-400 ml-0.5" />
                      </div>
                    ) : (
                      <span className="text-zinc-500 font-medium">{index + 1}</span>
                    )}
                  </div>

                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                    <Image src={mix.coverUrl || ZYLO_LOGO} alt={mix.title} fill className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                      {mix.title}
                    </h3>
                    {mix.genre && (
                      <p className="text-sm text-zinc-500 truncate">{mix.genre.name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-zinc-500 text-xs sm:text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDuration(mix.durationSec)}
                  </div>
                </motion.div>
              );
            })}
            {hasMore && (
              <div ref={loadMoreRef} className="h-12 flex items-center justify-center text-zinc-500 text-sm">
                {loadingMore ? 'Cargando más mixes…' : 'Desplázate para más mixes'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

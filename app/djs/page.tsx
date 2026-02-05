'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Loader2, Music, Instagram, Twitter } from 'lucide-react';
import Image from 'next/image';
import { ZYLO_LOGO } from '@/components/cover-image';

interface DJ {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  photoUrl: string | null;
  instagram: string | null;
  twitter: string | null;
  mixCount: number;
}

export default function DJsPage() {
  const router = useRouter();
  const [djs, setDjs] = useState<DJ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDJs = async () => {
      try {
        const res = await fetch('/api/djs');
        const data = await res.json();
        if (data.success) setDjs(data.data);
      } catch (err) {
        console.error('Error loading DJs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDJs();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">DJs</h1>
        </div>
        <p className="text-zinc-400">Conoce a nuestros artistas</p>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
          <p className="text-zinc-500">Cargando DJs...</p>
        </div>
      ) : djs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {djs.map((dj, index) => (
            <motion.div
              key={dj.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(`/dj/${dj.id}`)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-purple-500/50 transition-all">
                <Image
                  src={dj.photoUrl || ZYLO_LOGO}
                  alt={dj.name || 'DJ'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Social icons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {dj.instagram && (
                    <div className="p-1.5 bg-black/50 rounded-full">
                      <Instagram className="w-3 h-3 text-pink-400" />
                    </div>
                  )}
                  {dj.twitter && (
                    <div className="p-1.5 bg-black/50 rounded-full">
                      <Twitter className="w-3 h-3 text-blue-400" />
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-lg truncate">{dj.name || 'DJ'}</h3>
                  <p className="text-[11px] sm:text-sm text-zinc-400 flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {dj.mixCount} {dj.mixCount === 1 ? 'mix' : 'mixes'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No hay DJs disponibles</p>
        </div>
      )}
    </div>
  );
}

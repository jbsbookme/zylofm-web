'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Radio, Upload, Loader2, FileAudio, Mic } from 'lucide-react';
import { isAuthenticated, isAdmin } from '@/lib/auth-store';

export default function RadioIDsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace('/login?callbackUrl=/admin/library/radio-ids');
      return;
    }
    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
              <Radio className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Radio IDs</h1>
              <p className="text-zinc-500 text-sm">zylofm/radio_ids/</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-6 h-6 text-cyan-300" />
            <h2 className="text-lg font-semibold">Jingles e Identificadores</h2>
          </div>
          <p className="text-zinc-400 text-sm">
            Aquí puedes gestionar los jingles, IDs de estación, bumpers y transiciones de ZyloFM.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => router.push('/upload?folder=radio_ids')}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition"
          >
            <Upload className="w-5 h-5" />
            Subir Radio ID
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-10 bg-zinc-900/60 border border-dashed border-zinc-800/80 rounded-2xl text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
            <FileAudio className="w-6 h-6 text-cyan-300" />
          </div>
          <p className="text-zinc-300 font-medium">No hay Radio IDs aún</p>
          <p className="text-zinc-500 text-sm mt-2">Sube jingles, IDs y transiciones</p>
        </motion.div>
      </main>
    </div>
  );
}

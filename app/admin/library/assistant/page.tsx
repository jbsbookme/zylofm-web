'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Music2,
  Upload,
  Loader2,
  Play,
  Trash2,
  Clock,
  FileAudio,
  Cloud,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { isAuthenticated, isAdmin, getAccessToken } from '@/lib/auth-store';

export default function AssistantLibraryPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'checking' | 'configured' | 'not_configured'>('checking');
  const [initMessage, setInitMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace('/login?callbackUrl=/admin/library/assistant');
      return;
    }
    setIsAuthorized(true);
    setIsLoading(false);
    checkCloudinaryStatus();
  }, [router]);

  const checkCloudinaryStatus = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/cloudinary/signature', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCloudinaryStatus(data.success && data.data?.configured ? 'configured' : 'not_configured');
    } catch {
      setCloudinaryStatus('not_configured');
    }
  };

  const initializeCloudinary = async () => {
    setInitMessage('Inicializando...');
    try {
      const token = getAccessToken();
      const res = await fetch('/api/cloudinary/init', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInitMessage('✅ Cloudinary inicializado correctamente');
        setCloudinaryStatus('configured');
      } else {
        setInitMessage(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setInitMessage(`❌ Error: ${err.message}`);
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      {/* Header */}
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
              <Music2 className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Assistant Library</h1>
              <p className="text-zinc-500 text-sm">zylofm/assistant_library/</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Cloudinary Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-6 h-6 text-cyan-300" />
            <h2 className="text-lg font-semibold">Estado de Cloudinary</h2>
          </div>

          {cloudinaryStatus === 'checking' && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verificando configuración...</span>
            </div>
          )}

          {cloudinaryStatus === 'configured' && (
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle className="w-5 h-5" />
              <span>Cloudinary configurado y listo</span>
            </div>
          )}

          {cloudinaryStatus === 'not_configured' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5" />
                <span>Cloudinary no configurado</span>
              </div>
              <p className="text-zinc-500 text-sm">
                Agrega las siguientes variables de entorno:
              </p>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300">
                CLOUDINARY_CLOUD_NAME=tu_cloud_name<br />
                CLOUDINARY_API_KEY=tu_api_key<br />
                CLOUDINARY_API_SECRET=tu_api_secret
              </div>
              <button
                onClick={initializeCloudinary}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition"
              >
                Inicializar Cloudinary
              </button>
              {initMessage && (
                <p className="text-sm mt-2">{initMessage}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Folder Structure Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <h2 className="text-lg font-semibold mb-4">Estructura de Carpetas</h2>
          <div className="font-mono text-sm text-zinc-400 space-y-1">
            <p className="text-cyan-400">zylofm/</p>
            <p className="pl-4">├─ <span className="text-cyan-300">assistant_library/</span> ← Mixes y tracks principales</p>
            <p className="pl-4">├─ <span className="text-cyan-300">djs/</span> ← Archivos por DJ</p>
            <p className="pl-4">├─ <span className="text-cyan-300">radio_ids/</span> ← Jingles e identificadores</p>
            <p className="pl-4">└─ <span className="text-cyan-300">shows/</span> ← Programas grabados</p>
          </div>
        </motion.div>

        {/* Upload Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4"
        >
          <button
            onClick={() => router.push('/upload?folder=assistant_library')}
            disabled={cloudinaryStatus !== 'configured'}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition"
          >
            <Upload className="w-5 h-5" />
            Subir a Assistant Library
          </button>
        </motion.div>

        {/* Files List Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-10 bg-zinc-900/60 border border-dashed border-zinc-800/80 rounded-2xl text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
            <FileAudio className="w-6 h-6 text-cyan-300" />
          </div>
          <p className="text-zinc-300 font-medium">Los archivos subidos aparecerán aquí</p>
          <p className="text-zinc-500 text-sm mt-2">Formatos permitidos: MP3, WAV, M4A, AAC</p>
        </motion.div>
      </main>
    </div>
  );
}

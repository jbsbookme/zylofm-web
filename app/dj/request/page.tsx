'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface DJRequestData {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  soundcloud?: string | null;
  sampleLink?: string | null;
}

export default function DJRequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [djRequest, setDjRequest] = useState<DJRequestData | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    phone: '',
    instagram: '',
    twitter: '',
    soundcloud: '',
    sampleLink: '',
  });

  const fetchWithTimeout = async (input: RequestInfo, init: RequestInit = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      return res;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const loadRequest = async () => {
    try {
      const res = await fetchWithTimeout('/api/dj-requests', {}, 8000);
      if (res.status === 401) {
        router.replace('/login?callbackUrl=/dj/request');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDjRequest(data.data);
        if (data.data) {
          setFormData({
            displayName: data.data.displayName || '',
            bio: data.data.bio || '',
            location: data.data.location || '',
            phone: data.data.phone || '',
            instagram: data.data.instagram || '',
            twitter: data.data.twitter || '',
            soundcloud: data.data.soundcloud || '',
            sampleLink: data.data.sampleLink || '',
          });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar la solicitud' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, []);

  const handleSubmit = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetchWithTimeout('/api/dj-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }, 8000);

      const data = await res.json();
      if (data.success) {
        setDjRequest(data.data);
        setMessage({ type: 'success', text: 'Solicitud enviada correctamente' });
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Error al enviar solicitud' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pb-32">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Solicitud para ser DJ</h1>
      </div>

      {djRequest?.status === 'PENDING' && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
          Tu solicitud está en revisión.
        </div>
      )}
      {djRequest?.status === 'APPROVED' && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-sm">
          Tu solicitud fue aprobada. Ya puedes editar tu perfil DJ.
        </div>
      )}
      {djRequest?.status === 'REJECTED' && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
          Tu solicitud fue rechazada. Puedes enviar una nueva.
        </div>
      )}

      <div className="space-y-4">
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          placeholder="Nombre artístico"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Cuéntanos sobre tu proyecto"
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 resize-none"
        />
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Ciudad / País"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Teléfono"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />
        <input
          type="url"
          value={formData.instagram}
          onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
          placeholder="Instagram"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />
        <input
          type="url"
          value={formData.twitter}
          onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
          placeholder="Twitter"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />
        <input
          type="url"
          value={formData.soundcloud}
          onChange={(e) => setFormData(prev => ({ ...prev, soundcloud: e.target.value }))}
          placeholder="SoundCloud"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />
        <input
          type="url"
          value={formData.sampleLink}
          onChange={(e) => setFormData(prev => ({ ...prev, sampleLink: e.target.value }))}
          placeholder="Link de muestra (Mix/SoundCloud/Drive)"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
        />

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Enviar solicitud
        </button>
      </div>
    </div>
  );
}

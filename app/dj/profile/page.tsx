'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Instagram, Twitter, ExternalLink, Save, Loader2, AlertCircle, CheckCircle, ArrowLeft, User, Music } from 'lucide-react';
import Image from 'next/image';

interface DJProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  instagram: string | null;
  twitter: string | null;
  soundcloud: string | null;
}

export default function DJProfileEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<DJProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    photoUrl: '',
    instagram: '',
    twitter: '',
    soundcloud: '',
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

  const loadProfile = async () => {
    try {
      const res = await fetchWithTimeout('/api/dj/profile', {}, 8000);
      if (res.status === 401 || res.status === 403) {
        router.replace('/login?callbackUrl=/dj/profile');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          bio: data.data.bio || '',
          photoUrl: data.data.photoUrl || '',
          instagram: data.data.instagram || '',
          twitter: data.data.twitter || '',
          soundcloud: data.data.soundcloud || '',
        });
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Error al cargar el perfil DJ' });
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setMessage({ type: 'error', text: 'El servidor está lento. Intenta de nuevo.' });
      } else {
        setMessage({ type: 'error', text: 'Error de conexión' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetchWithTimeout('/api/dj/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }, 15000);

      if (res.status === 401 || res.status === 403) {
        setMessage({ type: 'error', text: 'No autorizado. Inicia sesión nuevamente.' });
        return;
      }

      const data = await res.json();
      if (data.success) {
        setProfile(prev => (prev ? { ...prev, ...data.data } : null));
        setMessage({ type: 'success', text: 'Perfil DJ actualizado' });
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Error al guardar' });
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Tiempo de espera agotado. Intenta de nuevo.' });
      } else {
        setMessage({ type: 'error', text: 'Error de conexión' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen debe ser menor a 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Solo se permiten imágenes' });
      return;
    }

    setIsSaving(true);
    try {
      const presignedRes = await fetchWithTimeout('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'profile-photos',
        }),
      }, 15000);

      if (presignedRes.status === 401) {
        setMessage({ type: 'error', text: 'Sesión no válida. Inicia sesión nuevamente.' });
        return;
      }

      const presignedData = await presignedRes.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error);
      }

      if (presignedData.provider !== 'cloudinary') {
        throw new Error('Proveedor de subida no soportado');
      }

      const form = new FormData();
      form.append('file', file);
      form.append('api_key', presignedData.data.apiKey);
      form.append('timestamp', String(presignedData.data.timestamp));
      form.append('signature', presignedData.data.signature);
      form.append('folder', presignedData.data.folder);

      const uploadRes = await fetch(presignedData.data.uploadUrl, {
        method: 'POST',
        body: form,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson?.error?.message || 'Error al subir imagen a Cloudinary');
      }

      const photoUrl = uploadJson.secure_url || uploadJson.url;
      if (!photoUrl) {
        throw new Error('Cloudinary no devolvió URL pública');
      }

      setFormData(prev => ({ ...prev, photoUrl }));
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Tiempo de espera agotado. Intenta de nuevo.' });
      } else {
        setMessage({ type: 'error', text: err.message || 'Error al subir la imagen' });
      }
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Editar Perfil DJ</h1>
        </div>

        <div className="text-center mb-8">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors overflow-hidden"
            >
              {formData.photoUrl ? (
                <Image src={formData.photoUrl} alt="Foto DJ" fill className="object-cover rounded-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-zinc-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Tu nombre"
            className="text-2xl font-bold bg-transparent border-b border-zinc-700 text-center w-full max-w-xs mx-auto focus:outline-none focus:border-cyan-500 mb-2"
          />
          <p className="text-zinc-400 text-sm">{profile?.email}</p>
        </div>

        <div className="space-y-4">
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Escribe tu biografía..."
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 resize-none"
          />

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Instagram className="w-4 h-4 text-pink-400" />
              </div>
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/tu_usuario"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Twitter className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/tu_usuario"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <ExternalLink className="w-4 h-4 text-orange-400" />
              </div>
              <input
                type="url"
                value={formData.soundcloud}
                onChange={(e) => setFormData(prev => ({ ...prev, soundcloud: e.target.value }))}
                placeholder="https://soundcloud.com/tu_usuario"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar cambios
          </button>

          <button
            onClick={() => router.push('/upload')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors"
          >
            <Music className="w-5 h-5" />
            Subir Música
          </button>
        </div>
      </motion.div>
    </div>
  );
}

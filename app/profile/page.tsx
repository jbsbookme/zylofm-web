'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Music, Heart, Settings, Loader2, Edit2, Save, X, Camera, Instagram, Twitter, Headphones, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';
import { isAuthenticated, getUser, getAccessToken, getRefreshToken, setTokens, setUser as saveUser, clearAuth, isTokenExpired } from '@/lib/auth-store';
import { getLikes, toggleLike } from '@/lib/likes-store';
import { Mix } from '@/lib/types';
import { usePlayer } from '@/context/player-context';
import Image from 'next/image';

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  instagram: string | null;
  twitter: string | null;
  soundcloud: string | null;
  _count?: { mixes: number };
}

type DJRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
interface DJRequestData {
  id: string;
  status: DJRequestStatus;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { state, setPlaylist, pause } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [favoriteMixes, setFavoriteMixes] = useState<Mix[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [djMixes, setDjMixes] = useState<Mix[]>([]);
  const [loadingDjMixes, setLoadingDjMixes] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [djRequest, setDjRequest] = useState<DJRequestData | null>(null);
  const [djRequestLoading, setDjRequestLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    photoUrl: '',
    instagram: '',
    twitter: '',
    soundcloud: ''
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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/profile', {
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Sesión no válida. Inicia sesión nuevamente.' });
        return;
      }
      if (res.status === 403) {
        router.replace('/dj/profile');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          bio: data.data.bio || '',
          photoUrl: data.data.photoUrl || '',
          instagram: data.data.instagram || '',
          twitter: data.data.twitter || '',
          soundcloud: data.data.soundcloud || ''
        });
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Error al cargar el perfil' });
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setMessage({ type: 'error', text: 'El servidor está lento. Intenta de nuevo.' });
      } else {
        console.error('Error loading profile:', err);
        setMessage({ type: 'error', text: 'Error de conexión' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?callbackUrl=/profile');
      return;
    }
    const cachedUser = getUser();
    if (cachedUser && !profile) {
      setProfile((prev) =>
        prev ?? {
          id: cachedUser.id,
          name: cachedUser.name ?? null,
          email: cachedUser.email,
          role: cachedUser.role,
          bio: null,
          photoUrl: null,
          instagram: null,
          twitter: null,
          soundcloud: null,
          _count: { mixes: 0 },
        }
      );
    }
    loadProfile();
    setLikesCount(getLikes().length);
    loadFavorites();
  }, [router]);

  useEffect(() => {
    const handleStorageChange = () => {
      setLikesCount(getLikes().length);
      loadFavorites();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (profile?.role === 'LISTENER') {
      loadDJRequest();
    }
  }, [profile?.role]);

  useEffect(() => {
    if (profile && (profile.role === 'DJ' || profile.role === 'ADMIN')) {
      loadDJMixes();
    }
  }, [profile?.id, profile?.role, profile?.name, profile?.email]);

  const loadFavorites = async () => {
    const likedIds = getLikes();
    if (likedIds.length === 0) {
      setFavoriteMixes([]);
      return;
    }

    setLoadingFavorites(true);
    try {
      const idsParam = encodeURIComponent(likedIds.join(','));
      const res = await fetch(`/api/mixes?ids=${idsParam}`);
      const data = await res.json();
      if (data.success) {
        const mixes = (data.data || []).filter((mix: Mix) => likedIds.includes(mix.id));
        setFavoriteMixes(mixes);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const loadDJRequest = async () => {
    setDjRequestLoading(true);
    try {
      const res = await fetchWithTimeout('/api/dj-requests', {}, 8000);
      if (res.status === 401) {
        setDjRequest(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDjRequest(data.data);
      }
    } catch (err) {
      console.error('Error loading DJ request:', err);
    } finally {
      setDjRequestLoading(false);
    }
  };

  const loadDJMixes = async () => {
    if (!profile) return;
    setLoadingDjMixes(true);
    try {
      const res = await fetch('/api/mixes');
      const data = await res.json();
      if (data.success) {
        const candidates = new Set(
          [profile.name, profile.email?.split('@')[0]]
            .filter(Boolean)
            .map((value) => value!.toLowerCase().trim())
        );
        const mixes = (data.data || []).filter((mix: Mix) =>
          candidates.has(mix.djName.toLowerCase().trim())
        );
        setDjMixes(mixes);
      } else {
        setDjMixes([]);
      }
    } catch (err) {
      console.error('Error loading DJ mixes:', err);
      setDjMixes([]);
    } finally {
      setLoadingDjMixes(false);
    }
  };


  const handlePlayFavorite = (mix: Mix, index: number) => {
    const playlist = favoriteMixes.map((m) => ({
      id: m.id,
      title: m.title,
      djName: m.djName,
      durationSec: m.durationSec,
      coverUrl: m.coverUrl,
      hlsUrl: m.hlsUrl,
      djPhotoUrl: m.djPhotoUrl,
      genres: m.genres,
      genre: m.genre,
    }));
    setPlaylist(playlist, index);
  };

  const handleToggleFavorite = (mixId: string) => {
    toggleLike(mixId);
    setLikesCount(getLikes().length);
    loadFavorites();
  };

  const handlePlayDJMix = (mix: Mix, index: number, list: Mix[]) => {
    const playlist = list.map((m) => ({
      id: m.id,
      title: m.title,
      djName: m.djName,
      durationSec: m.durationSec,
      coverUrl: m.coverUrl,
      hlsUrl: m.hlsUrl,
      djPhotoUrl: m.djPhotoUrl,
      genres: m.genres,
      genre: m.genre,
    }));
    setPlaylist(playlist, index);
  };

  const handleSave = async () => {
    if (!canEditProfile) {
      setMessage({ type: 'error', text: 'Solo oyentes pueden editar este perfil.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    
    try {
      const res = await fetchWithTimeout('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          photoUrl: formData.photoUrl,
        })
      }, 15000);
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Sesión no válida. Inicia sesión nuevamente.' });
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, ...data.data } : null);
        // Actualizar localStorage
        const currentUser = getUser();
        if (currentUser) {
          saveUser({ ...currentUser, ...data.data });
        }
        setMessage({ type: 'success', text: '¡Perfil actualizado!' });
        setIsEditing(false);
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

    if (!canEditProfile) {
      setMessage({ type: 'error', text: 'Solo oyentes pueden editar este perfil.' });
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen debe ser menor a 5MB' });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Solo se permiten imágenes' });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Obtener datos de firma
      const presignedRes = await fetchWithTimeout('/api/upload/image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'profile-photos'
        })
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

      // 2. Subir imagen a Cloudinary
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

      // 3. Actualizar formulario con URL pública
      const photoUrl = uploadJson.secure_url || uploadJson.url;
      if (!photoUrl) {
        throw new Error('Cloudinary no devolvió URL pública');
      }

      setFormData(prev => ({ ...prev, photoUrl }));

      // Guardar inmediatamente la foto en el perfil
      const saveRes = await fetchWithTimeout('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          photoUrl,
        })
      }, 15000);

      const saveText = await saveRes.text();
      let saveData: any = null;
      try {
        saveData = JSON.parse(saveText);
      } catch {
        saveData = null;
      }

      if (saveRes.ok && saveData?.success) {
        setProfile(prev => prev ? { ...prev, ...saveData.data } : null);
        const currentUser = getUser();
        if (currentUser) {
          saveUser({ ...currentUser, ...saveData.data });
        }
        setMessage({ type: 'success', text: 'Foto guardada correctamente' });
      } else {
        setMessage({
          type: 'error',
          text: saveData?.error?.message || 'Error al guardar la foto. Verifica sesión y servidor.'
        });
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Administrador' };
      case 'DJ':
        return { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'DJ' };
      default:
        return { color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', label: 'Oyente' };
    }
  };

  const roleBadge = getRoleBadge(profile?.role || 'LISTENER');
  const isDJorAdmin = profile?.role === 'DJ' || profile?.role === 'ADMIN';
  const canEditProfile = profile?.role === 'LISTENER';
  const djStageName = profile?.email ? profile.email.split('@')[0] : profile?.name || 'DJ';
  const realName = profile?.name || 'Nombre real';
  const instagramHandle = profile?.instagram
    ? profile.instagram
        .replace('https://instagram.com/', '')
        .replace('https://www.instagram.com/', '')
        .replace('@', '')
    : null;
  const instagramUrl = profile?.instagram
    ? profile.instagram.startsWith('http')
      ? profile.instagram
      : `https://instagram.com/${profile.instagram.replace('@', '')}`
    : null;
  const twitterUrl = profile?.twitter
    ? profile.twitter.startsWith('http')
      ? profile.twitter
      : `https://twitter.com/${profile.twitter.replace('@', '')}`
    : null;
  const soundcloudUrl = profile?.soundcloud
    ? profile.soundcloud.startsWith('http')
      ? profile.soundcloud
      : `https://soundcloud.com/${profile.soundcloud.replace('@', '')}`
    : null;
  const genreOptions = Array.from(
    new Map(
      djMixes
        .map((mix) => mix.genre || mix.genres?.[0])
        .filter(Boolean)
        .map((genre) => [genre!.toLowerCase(), genre!])
    ).values()
  );
  const filteredDjMixes = selectedGenre === 'all'
    ? djMixes
    : djMixes.filter((mix) => {
        const mixGenre = mix.genre || mix.genres?.[0];
        return mixGenre?.toLowerCase() === selectedGenre;
      });

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Message Toast */}
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

      <div className="relative">
        <div className="relative h-56 sm:h-72 overflow-hidden">
          {profile?.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={djStageName}
              fill
              className="object-cover blur-2xl scale-110 opacity-45"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/65 to-black" />
          <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(34,211,238,0.18), transparent 45%), radial-gradient(circle at 85% 10%, rgba(139,92,246,0.22), transparent 42%), radial-gradient(circle at 50% 80%, rgba(59,130,246,0.12), transparent 40%)' }} />
        </div>

        <div className="-mt-28 sm:-mt-32 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_28px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_55%)]" />
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                  <div className="absolute inset-[-14px] rounded-full bg-gradient-to-br from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-2xl pulse-slow" />
                  {isEditing ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full h-full rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors overflow-hidden"
                    >
                      {formData.photoUrl ? (
                        <Image src={formData.photoUrl} alt="Foto" fill className="object-cover rounded-full" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-zinc-500 mb-1" />
                          <span className="text-xs text-zinc-500">Subir foto</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : profile?.photoUrl ? (
                    <Image
                      src={profile.photoUrl}
                      alt={djStageName}
                      fill
                      className="rounded-full object-cover ring-2 ring-cyan-500/20"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/90 mb-2">DJ PROFILE</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                    <h1 className="text-2xl sm:text-4xl font-bold text-white">{djStageName}</h1>
                    {isDJorAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <CheckCircle className="w-3 h-3" />
                        DJ VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mt-1">{realName}</p>

                  <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mt-3">
                    {instagramHandle && (
                      <span className="text-xs text-zinc-400">@{instagramHandle}</span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border ${roleBadge.color} backdrop-blur` }>
                      {roleBadge.label}
                    </span>
                    {isDJorAdmin && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] border border-zinc-800 text-zinc-400 bg-zinc-900/60 backdrop-blur">
                        <Music className="w-3 h-3" />
                        {profile?._count?.mixes || 0} mixes
                      </span>
                    )}
                  </div>

                  {isDJorAdmin && profile?.bio && (
                    <p className="text-zinc-400 text-sm mt-4 max-w-xl mx-auto sm:mx-0">{profile.bio}</p>
                  )}

                  {isDJorAdmin && (
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                      {instagramUrl && (
                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-zinc-900/70 border border-zinc-800 hover:border-pink-500/40 hover:text-pink-400 transition shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {soundcloudUrl && (
                        <a
                          href={soundcloudUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-zinc-900/70 border border-zinc-800 hover:border-orange-500/40 hover:text-orange-400 transition shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                        >
                          <Headphones className="w-4 h-4" />
                        </a>
                      )}
                      {twitterUrl && (
                        <a
                          href={twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-zinc-900/70 border border-zinc-800 hover:border-blue-500/40 hover:text-blue-400 transition shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-10">
        {/* Info Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">Información</h3>
          
          {/* Email */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Mail className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500">Email</p>
                {isEditing && canEditProfile ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@email.com"
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                ) : (
                  <p className="text-white text-sm">{profile?.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Likes */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Mixes favoritos</p>
                <p className="text-white text-sm">{likesCount} guardados</p>
              </div>
            </div>
          </div>

          {/* Mixes subidos (solo DJs) */}
          {isDJorAdmin && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Music className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Mixes subidos</p>
                  <p className="text-white text-sm">{profile?._count?.mixes || 0} mixes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mixes del DJ */}
        {isDJorAdmin && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Mixes</h3>
                <p className="text-xs text-zinc-500">Explora el catálogo del DJ</p>
              </div>
              <span className="text-xs text-zinc-500">{djMixes.length} mixes</span>
            </div>

            {djMixes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedGenre('all')}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    selectedGenre === 'all'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_8px_20px_rgba(34,211,238,0.12)]'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre.toLowerCase())}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      selectedGenre === genre.toLowerCase()
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_8px_20px_rgba(34,211,238,0.12)]'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}

            {loadingDjMixes ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando mixes...
              </div>
            ) : filteredDjMixes.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
                  <Music className="w-6 h-6 text-cyan-300" />
                </div>
                <p className="text-zinc-200 font-medium">Aún no hay mixes publicados</p>
                <p className="text-zinc-500 text-sm mt-1">Cuando subas tu primer mix aparecerá aquí.</p>
                {isDJorAdmin && (
                  <button
                    onClick={() => router.push('/upload')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors"
                  >
                    Subir mi primer mix
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDjMixes.map((mix, index) => {
                  const isCurrent = state.currentMedia?.id === mix.id && state.mediaType === 'mix';
                  const isPlaying = isCurrent && state.status === 'playing';
                  return (
                    <div
                      key={mix.id}
                      className={`group bg-zinc-900/60 border rounded-2xl overflow-hidden transition-all ${
                        isCurrent
                          ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                          : 'border-zinc-800/80 hover:border-cyan-500/30 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)]'
                      }`}
                    >
                      <div className="relative h-44 bg-zinc-800">
                        <Image src={mix.coverUrl || '/zylo-logo.png'} alt={mix.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <button
                          onClick={() => handlePlayDJMix(mix, index, filteredDjMixes)}
                          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white hover:bg-cyan-500/80 hover:text-black transition"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-white font-semibold truncate">{mix.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-zinc-500 truncate">{mix.genre || mix.genres?.[0] || 'Sin género'}</span>
                          <span className="text-xs text-cyan-300">{mix.durationSec ? `${Math.floor(mix.durationSec / 60)}:${String(mix.durationSec % 60).padStart(2, '0')}` : '--:--'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Solicitud DJ (solo oyentes) */}
        {profile?.role === 'LISTENER' && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Solicitud para ser DJ</h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              {djRequestLoading ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando solicitud...
                </div>
              ) : djRequest ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">
                    Estado actual:{' '}
                    <span className="font-semibold">
                      {djRequest.status === 'PENDING'
                        ? 'PENDIENTE'
                        : djRequest.status === 'APPROVED'
                          ? 'APROBADA'
                          : 'RECHAZADA'}
                    </span>
                  </p>
                  {djRequest.status === 'REJECTED' && (
                    <button
                      onClick={() => router.push('/dj/request')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors"
                    >
                      Quiero ser DJ
                    </button>
                  )}
                  {djRequest.status === 'PENDING' && (
                    <p className="text-xs text-zinc-500">
                      Tu solicitud está en revisión. Te avisaremos cuando sea aprobada.
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => router.push('/dj/request')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Quiero ser DJ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Favoritos */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">Tus favoritos</h3>
          {loadingFavorites ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando favoritos...
            </div>
          ) : favoriteMixes.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
                <Heart className="w-5 h-5 text-cyan-300" />
              </div>
              <p className="text-zinc-300 font-medium">No tienes favoritos aún</p>
              <p className="text-zinc-500 text-sm mt-1">Marca un mix con ❤️ para guardarlo aquí.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteMixes.map((mix, index) => {
                const isCurrent = state.currentMedia?.id === mix.id && state.mediaType === 'mix';
                const isPlaying = isCurrent && state.status === 'playing';
                return (
                  <div
                    key={mix.id}
                    onClick={() => handlePlayFavorite(mix, index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePlayFavorite(mix, index);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isCurrent ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <Image
                        src={mix.coverUrl || '/zylo-logo.png'}
                        alt={mix.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                        {mix.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{mix.djName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPlaying) {
                            pause();
                          } else {
                            handlePlayFavorite(mix, index);
                          }
                        }}
                        className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(mix.id);
                        }}
                        className="p-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition"
                      >
                        <Heart className="w-4 h-4 fill-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          {/* Edit/Save Button */}
          {isEditing && canEditProfile ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar
              </button>
            </div>
          ) : canEditProfile ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Edit2 className="w-5 h-5" />
              Editar Perfil
            </button>
          ) : null}
          
          {isDJorAdmin && !isEditing && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dj/profile')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
              >
                <Headphones className="w-5 h-5" />
                Editar Perfil DJ
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors"
              >
                <Music className="w-5 h-5" />
                Subir Música
              </button>
            </div>
          )}
          
          {profile?.role === 'ADMIN' && !isEditing && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5" />
              Panel de Admin
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

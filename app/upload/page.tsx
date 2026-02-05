'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Music2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  FileAudio,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Shield,
  Clock,
  Edit2,
} from 'lucide-react';
import Image from 'next/image';
import { isAuthenticated, getUser, getAccessToken, getRefreshToken, isTokenExpired, setTokens, clearAuth, isAdmin } from '@/lib/auth-store';
import { refreshToken } from '@/lib/api';

interface Genre {
  id: string;
  name: string;
  slug: string;
  mixCount: number;
}

interface FileUpload {
  file: File;
  title: string;
  coverUrl: string;
  coverUploading?: boolean;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  duration?: number;
}

// Límite total de mixes por DJ (Admin sin límite)
// TODO: Monetización DJ PRO - ajustar límites por plan
const MAX_MIXES_TOTAL = 200;

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mixCount, setMixCount] = useState(0);
  
  // Géneros
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<string>('');
  const [loadingGenres, setLoadingGenres] = useState(true);
  
  // Files to upload
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const user = getUser();
  const userIsAdmin = isAdmin();

  const getValidAccessToken = async () => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      return token;
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      return null;
    }

    try {
      const response = await refreshToken(refresh);
      setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      return response.tokens.accessToken;
    } catch {
      clearAuth();
      return null;
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?callbackUrl=/upload');
      return;
    }
    
    // Verificar si el usuario puede subir (DJ o Admin)
    const currentUser = getUser();
    if (currentUser && (currentUser.role === 'DJ' || currentUser.role === 'ADMIN')) {
      setCanUpload(true);
    } else {
      // Los LISTENERS no pueden subir
      setCanUpload(false);
    }
    
    setIsAuthorized(true);
    setIsLoading(false);
    loadGenres();
    loadMixCount();
  }, [router]);

  useEffect(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam) {
      setSelectedGenreId(genreParam);
    }
  }, [searchParams]);

  const loadGenres = async () => {
    try {
      const res = await fetch('/api/genres');
      const data = await res.json();
      if (data.success) {
        setGenres(data.data);
        if (!selectedGenreId && data.data.length > 0) {
          setSelectedGenreId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading genres:', err);
    } finally {
      setLoadingGenres(false);
    }
  };

  const loadMixCount = async () => {
    if (userIsAdmin) {
      setMixCount(0); // Admin sin límite
      return;
    }
    try {
      const token = await getValidAccessToken();
      if (!token) {
        router.replace('/login?callbackUrl=/upload');
        return;
      }
      const res = await fetch('/api/mixes/my-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMixCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error checking mix count:', err);
    }
  };

  const remainingMixes = userIsAdmin ? Infinity : Math.max(0, MAX_MIXES_TOTAL - mixCount);

  // Formatos aceptados: MP3 (estándar), WAV/FLAC/M4A (opcional)
  const ACCEPTED_FORMATS = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const MAX_DURATION = 3 * 60 * 60; // 3 horas max
  const MIN_DURATION = 30; // 30 segundos min

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Validar formato
    const isValidFormat = ACCEPTED_FORMATS.some(format => file.type.includes(format.replace('audio/', ''))) || 
                          file.name.match(/\.(mp3|wav|flac|m4a|aac)$/i);
    if (!isValidFormat) {
      return { valid: false, error: `Formato no soportado. Usa MP3 (recomendado), WAV, FLAC o M4A` };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `Archivo muy grande (máx ${formatFileSize(MAX_FILE_SIZE)})` };
    }

    // MP3 es el estándar recomendado
    const isMP3 = file.type === 'audio/mpeg' || file.name.endsWith('.mp3');
    if (!isMP3) {
      // Advertencia para WAV/FLAC (archivos grandes)
      if (file.size > 100 * 1024 * 1024) {
        console.log('Advertencia: Archivo grande. Recomendamos MP3 320kbps para mejor compatibilidad.');
      }
    }

    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: FileUpload[] = [];
    const errors: string[] = [];
    
    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        return;
      }

      // Extraer título del nombre del archivo
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      
      const fileUpload: FileUpload = {
        file,
        title,
        coverUrl: '',
        progress: 0,
        status: 'pending',
      };

      // Obtener duración y validar
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        const duration = Math.floor(audio.duration);
        fileUpload.duration = duration;
        URL.revokeObjectURL(audio.src);
        
        // Validar duración
        if (duration < MIN_DURATION) {
          fileUpload.status = 'error';
          fileUpload.error = 'Duración muy corta (mín 30 seg)';
        } else if (duration > MAX_DURATION) {
          fileUpload.status = 'error';
          fileUpload.error = 'Duración muy larga (máx 3 horas)';
        }
        
        setFiles(prev => [...prev]);
      };

      newFiles.push(fileUpload);
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'));
    } else {
      setErrorMessage('');
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileTitle = (index: number, title: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, title } : f));
  };

  const updateFileCover = (index: number, coverUrl: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, coverUrl } : f));
  };

  const handleCoverSelect = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten imágenes para la portada');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La portada no puede superar 5MB');
      return;
    }

    setFiles(prev => prev.map((f, i) => i === index ? { ...f, coverUploading: true } : f));
    try {
      const presignedRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'mix-covers',
        }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error || 'Error al obtener URL de subida');
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
        throw new Error(uploadJson?.error?.message || 'Error al subir portada');
      }

      const coverUrl = uploadJson.secure_url || uploadJson.url;
      if (!coverUrl) {
        throw new Error('Cloudinary no devolvió URL pública');
      }

      setFiles(prev => prev.map((f, i) => i === index ? { ...f, coverUrl, coverUploading: false } : f));
    } catch (error: any) {
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, coverUploading: false } : f));
      setErrorMessage(error?.message || 'Error al subir portada');
    }
  };

  const uploadSingleFile = async (fileUpload: FileUpload, index: number): Promise<boolean> => {
    const token = await getValidAccessToken();
    if (!token) {
      setErrorMessage('Sesión expirada. Inicia sesión nuevamente.');
      return false;
    }
    const activeGenre = genres.find(g => g.id === selectedGenreId) || genres[0];
    if (!activeGenre?.id) {
      setErrorMessage('No hay colecciones disponibles para subir mixes.');
      return false;
    }

    try {
      // Update status
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'uploading' as const, progress: 10 } : f));

      // 1. Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: fileUpload.file.name,
          contentType: fileUpload.file.type,
          isPublic: true,
          genre: activeGenre?.slug || 'otros',
        }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error?.message || presignedData.error || 'Error al obtener URL');
      }

      setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 30 } : f));

      // 2. Upload to S3
      let cloudStoragePath: string | undefined;
      let audioUrl: string | undefined;

      if (presignedData.provider === 'cloudinary') {
        const form = new FormData();
        form.append('file', fileUpload.file);
        form.append('api_key', presignedData.data.apiKey);
        form.append('timestamp', String(presignedData.data.timestamp));
        form.append('signature', presignedData.data.signature);
        form.append('folder', presignedData.data.folder);
        form.append('upload_preset', presignedData.data.uploadPreset);
        form.append('resource_type', 'video');

        const uploadRes = await fetch(presignedData.data.uploadUrl, {
          method: 'POST',
          body: form,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadJson?.error?.message || 'Error al subir audio');
        }

        cloudStoragePath = uploadJson.public_id;
        audioUrl = uploadJson.secure_url || uploadJson.url;
      } else {
        const { uploadUrl, cloud_storage_path } = presignedData.data;

        const urlParams = new URLSearchParams(uploadUrl.split('?')[1] || '');
        const signedHeaders = urlParams.get('X-Amz-SignedHeaders') || '';
        const includesContentDisposition = signedHeaders.includes('content-disposition');

        const uploadHeaders: HeadersInit = {
          'Content-Type': fileUpload.file.type,
        };
        if (includesContentDisposition) {
          uploadHeaders['Content-Disposition'] = 'attachment';
        }

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: uploadHeaders,
          body: fileUpload.file,
        });

        if (!uploadRes.ok) {
          throw new Error('Error al subir archivo a S3');
        }

        cloudStoragePath = cloud_storage_path;
      }

      setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 70 } : f));

      // 3. Create mix record
      const createRes = await fetch('/api/mixes/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: fileUpload.title,
          cloud_storage_path: cloudStoragePath,
          audioUrl,
          durationSec: fileUpload.duration,
          genreId: activeGenre?.id,
          coverUrl: fileUpload.coverUrl,
        }),
      });

      const createData = await createRes.json();
      if (!createData.success) {
        throw new Error(createData.error?.message || createData.error || 'Error al crear registro');
      }

      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'success' as const, progress: 100 } : f));
      return true;

    } catch (error: any) {
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error' as const, error: error.message } : f));
      return false;
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) {
      setErrorMessage('Selecciona al menos un archivo');
      return;
    }
    if (genres.length === 0) {
      setErrorMessage('No hay colecciones disponibles para subir mixes.');
      return;
    }
    if (!userIsAdmin && mixCount >= MAX_MIXES_TOTAL) {
      setErrorMessage(`Has alcanzado el límite de ${MAX_MIXES_TOTAL} mixes. Elimina uno para subir otro.`);
      return;
    }
    setIsUploading(true);
    setErrorMessage('');

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;
      await uploadSingleFile(files[i], i);
    }

    setIsUploading(false);
    
    // Check if all succeeded
    const allSuccess = files.every(f => f.status === 'success');
    if (allSuccess) {
      setTimeout(() => {
        router.push('/admin/genres');
      }, 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  // Si el usuario no puede subir (no es DJ ni Admin)
  if (!canUpload) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Restringido</h1>
          <p className="text-zinc-400 mb-6">
            Solo los DJs verificados y Administradores pueden subir música a ZyloFM.
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            Si eres DJ y quieres unirte a la plataforma, contacta a un administrador.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const selectedGenre = genres.find(g => g.id === selectedGenreId);
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 tracking-tight">
                <Upload className="w-6 h-6 text-cyan-400" />
                Subir Mix
              </h1>
              <p className="text-sm text-zinc-400">Crea tu mix y completa su información</p>
            </div>
          </div>
          {/* Límite de subidas */}
          {!userIsAdmin && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Mixes disponibles</p>
              <p className={`text-lg font-bold ${remainingMixes > 10 ? 'text-emerald-300' : remainingMixes > 0 ? 'text-amber-300' : 'text-red-300'}`}>
                {remainingMixes} / {MAX_MIXES_TOTAL}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Advertencia si no quedan mixes */}
        {!userIsAdmin && remainingMixes === 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-medium">Límite de mixes alcanzado</p>
              <p className="text-red-300/70 text-sm">Has alcanzado el límite de {MAX_MIXES_TOTAL} mixes. Elimina uno para subir otro.</p>
            </div>
          </div>
        )}
        {/* Seleccionar Género */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-4 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-cyan-400" />
            Colección / Estilo del Mix
          </label>
          
          {loadingGenres ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando géneros...
            </div>
          ) : genres.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
                <Music2 className="w-6 h-6 text-cyan-300" />
              </div>
              <p className="text-zinc-300 font-medium mb-1">No hay colecciones creadas aún</p>
              <p className="text-zinc-500 text-sm mb-4">Un admin debe crear los estilos primero.</p>
              {isAdmin() && (
                <button
                  onClick={() => router.push('/admin/genres')}
                  className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400"
                >
                  Crear Categorías
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenreId(genre.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selectedGenreId === genre.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  {isAdmin() && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/admin/genres?edit=${genre.id}`);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white"
                      aria-label={`Editar ${genre.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <Music2 className={`w-8 h-8 mb-2 ${selectedGenreId === genre.id ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  <p className="font-medium truncate">Colección / Estilo</p>
                  <p className="text-xs text-zinc-500">{genre.mixCount} mixes</p>
                </button>
              ))}
              {isAdmin() && (
                <button
                  onClick={() => router.push('/admin/genres')}
                  className="p-4 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 flex flex-col items-center justify-center"
                >
                  <Plus className="w-8 h-8 text-zinc-500 mb-2" />
                  <p className="text-sm text-zinc-500">Nuevo</p>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selección de audio */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-4 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-cyan-400" />
            Audio del Mix
          </label>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-zinc-600 transition-colors bg-zinc-900/40"
          >
            <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-300 mb-2">Arrastra o selecciona el audio del mix</p>
            <p className="text-sm text-zinc-500">MP3 320kbps (recomendado) • WAV opcional • Máx 500MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Lista de mixes */}
        {files.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {files.length} mix{files.length !== 1 ? 'es' : ''} en preparación
              </h3>
              {successCount > 0 && (
                <span className="text-green-400 text-sm">
                  {successCount} listo{successCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {isUploading && (
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-300 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Subida en progreso. No cierres esta ventana.
              </div>
            )}

            <div className="space-y-3">
              <AnimatePresence>
                {files.map((fileUpload, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`bg-zinc-900/60 border rounded-xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition ${
                      fileUpload.status === 'success' ? 'border-green-500/50' :
                      fileUpload.status === 'error' ? 'border-red-500/50' :
                      'border-zinc-800/80 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Cover preview */}
                      <div className="relative w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                        {fileUpload.coverUrl ? (
                          <img 
                            src={fileUpload.coverUrl} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {fileUpload.coverUploading ? (
                              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            ) : fileUpload.status === 'success' ? (
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : fileUpload.status === 'error' ? (
                              <AlertCircle className="w-6 h-6 text-red-400" />
                            ) : fileUpload.status === 'uploading' ? (
                              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            ) : (
                              <Music2 className="w-6 h-6 text-zinc-500" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Nombre del mix */}
                        {fileUpload.status === 'pending' ? (
                          <input
                            type="text"
                            value={fileUpload.title}
                            onChange={(e) => updateFileTitle(index, e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 focus:border-cyan-500 outline-none px-3 py-2 rounded-lg text-white text-sm"
                            placeholder="Nombre del mix"
                          />
                        ) : (
                          <p className="font-medium truncate">{fileUpload.title}</p>
                        )}
                        
                        {/* Portada del mix */}
                        {fileUpload.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleCoverSelect(index, file);
                                  }
                                }}
                              />
                              <span className="block w-full bg-zinc-800/50 border border-zinc-700/50 focus:border-cyan-500/50 outline-none px-3 py-1.5 rounded text-zinc-300 text-xs">
                                {fileUpload.coverUploading ? 'Subiendo portada...' : (fileUpload.coverUrl ? 'Portada lista' : 'Agregar portada (opcional)')}
                              </span>
                              <span className="mt-1 block text-[10px] text-zinc-500">
                                Recomendado: logo del DJ o imagen del tema del mix.
                              </span>
                            </label>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fileUpload.duration ? formatDuration(fileUpload.duration) : '--:--'}
                          </span>
                          <span>{formatFileSize(fileUpload.file.size)}</span>
                          {fileUpload.error && <span className="text-red-400">{fileUpload.error}</span>}
                        </div>
                      </div>

                      {fileUpload.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 text-zinc-500 hover:text-red-400 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {fileUpload.status === 'uploading' && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${fileUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {errorMessage.split('\n').map((line, idx) => (
                  <p key={idx} className="text-sm">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botón Guardar */}
        {files.length > 0 && pendingCount > 0 && (
          <button
            onClick={handleUploadAll}
            disabled={isUploading}
            className="w-full py-4 bg-cyan-500 text-black font-semibold rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Guardar {pendingCount} mix{pendingCount !== 1 ? 'es' : ''}
              </>
            )}
          </button>
        )}

        {/* Success message */}
        {files.length > 0 && pendingCount === 0 && successCount === files.length && (
          <div className="text-center py-10 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-xl font-semibold mb-1">¡Subida completada!</h2>
            <p className="text-zinc-500 text-sm">Todas las canciones se subieron correctamente</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <UploadContent />
    </Suspense>
  );
}

'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Folder,
  Music,
  Trash2,
  Edit2,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Upload,
  Save,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { isAuthenticated, isAdmin, getUser, getAccessToken } from '@/lib/auth-store';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  mixCount: number;
  isActive: boolean;
}

export default function GenresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', coverUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }
    loadGenres();
  }, [router]);

  const editId = searchParams.get('edit');

  useEffect(() => {
    if (!editId || genres.length === 0) return;
    const target = genres.find((genre) => genre.id === editId);
    if (target) {
      openEditModal(target);
    }
  }, [editId, genres]);

  const loadGenres = async () => {
    try {
      const res = await fetch('/api/genres');
      const data = await res.json();
      if (data.success) {
        setGenres(data.data);
      }
    } catch (err) {
      console.error('Error loading genres:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGenre(null);
    setFormData({ name: '', description: '', coverUrl: '' });
    setImagePreview(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
      description: genre.description || '',
      coverUrl: genre.coverUrl || '',
    });
    setImagePreview(genre.coverUrl || null);
    setError('');
    setShowModal(true);
  };

  // Manejar selección de imagen
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB');
      return;
    }

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a S3
    setUploadingImage(true);
    setError('');

    try {
      const token = getAccessToken();

      // 1. Obtener presigned URL
      const presignedRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'genres',
        }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error?.message || 'Error al obtener URL');
      }

      const { uploadUrl, cloud_storage_path } = presignedData.data;

      // 2. Subir imagen a S3
      const uploadHeaders: HeadersInit = {
        'Content-Type': file.type,
      };
      
      // Check if content-disposition is in signed headers
      const urlParams = new URLSearchParams(uploadUrl.split('?')[1] || '');
      const signedHeaders = urlParams.get('X-Amz-SignedHeaders') || '';
      if (signedHeaders.includes('content-disposition')) {
        uploadHeaders['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Error al subir imagen');
      }

      // 3. Obtener URL pública
      const urlRes = await fetch(`/api/upload/image?path=${encodeURIComponent(cloud_storage_path)}`);
      const urlData = await urlRes.json();

      if (urlData.success) {
        setFormData(prev => ({ ...prev, coverUrl: urlData.data.url }));
      }

    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Error al subir imagen');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    // Nombre es opcional

    setSaving(true);
    setError('');

    try {
      const token = getAccessToken();
      const url = editingGenre ? `/api/genres/${editingGenre.id}` : '/api/genres';
      const method = editingGenre ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        loadGenres();
      } else {
        setError(data.error?.message || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (genre: Genre) => {
    if (!confirm(`¿Eliminar el género "${genre.name}"?`)) return;

    try {
      const token = getAccessToken();
      const res = await fetch(`/api/genres/${genre.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        loadGenres();
      }
    } catch (err) {
      console.error('Error deleting genre:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 tracking-tight">
                <FolderPlus className="w-6 h-6 text-cyan-400" />
                Géneros / Carpetas
              </h1>
              <p className="text-sm text-zinc-400">Organiza tu música por géneros</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Género
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {genres.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-400 mb-2">No hay géneros creados</h2>
            <p className="text-zinc-500 mb-6">Crea carpetas para organizar tu música</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400"
            >
              Crear primer género
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {genres.map((genre) => (
              <motion.div
                key={genre.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-cyan-500/15 to-cyan-700/10 ring-1 ring-cyan-500/10">
                    {genre.coverUrl ? (
                      <img src={genre.coverUrl} alt={genre.name} className="w-full h-full object-cover" />
                    ) : (
                      <Folder className="w-8 h-8 text-cyan-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{genre.name}</h3>
                    <p className="text-sm text-zinc-400 flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      {genre.mixCount} {genre.mixCount === 1 ? 'canción' : 'canciones'}
                    </p>
                    {genre.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{genre.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => router.push(`/upload?genre=${genre.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/25 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Subir
                  </button>
                  <button
                    onClick={() => openEditModal(genre)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(genre)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900/95 border border-zinc-800/80 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header fijo */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold tracking-tight">
                  {editingGenre ? 'Editar Género' : 'Nuevo Género'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Bachata, Salsa..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción opcional..."
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Imagen (opcional)
                  </label>
                  
                  <div className="flex items-center gap-3">
                    {/* Preview pequeño */}
                    <div 
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                      className={`relative w-20 h-20 rounded-lg border-2 border-dashed overflow-hidden cursor-pointer transition-all flex-shrink-0 ${
                        imagePreview || formData.coverUrl
                          ? 'border-cyan-500/50 bg-zinc-800'
                          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                      }`}
                    >
                      {(imagePreview || formData.coverUrl) ? (
                        <img 
                          src={imagePreview || formData.coverUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {uploadingImage ? (
                            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-zinc-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                      >
                        {uploadingImage ? 'Subiendo...' : (imagePreview || formData.coverUrl) ? 'Cambiar' : 'Subir imagen'}
                      </button>
                      {(imagePreview || formData.coverUrl) && !uploadingImage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, coverUrl: '' }));
                          }}
                          className="ml-3 text-sm text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">JPG, PNG • Máx 5MB</p>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Botones fijos abajo */}
              <div className="flex gap-3 p-4 border-t border-zinc-800 bg-zinc-900">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg hover:border-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

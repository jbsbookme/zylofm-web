'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Calendar,
  ArrowUp,
  ArrowDown,
  Save,
  ExternalLink,
} from 'lucide-react';
import { isAuthenticated, isAdmin, getAccessToken } from '@/lib/auth-store';
import Image from 'next/image';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function BannersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'HOME',
    sortOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace('/login');
      return;
    }
    setIsAuthorized(true);
    setIsLoading(false);
    loadBanners();
  }, [router]);

  const loadBanners = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/banners?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      setError('Error al cargar banners');
    }
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      position: 'HOME',
      sortOrder: banners.length,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
    });
    setImagePreview(banner.imageUrl);
    setShowModal(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      // Preview local
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload a S3
      const token = getAccessToken();
      const presignedRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'banners',
        }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error || 'Error al obtener URL de subida');
      }

      // Subir a S3
      const uploadRes = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        throw new Error('Error al subir imagen');
      }

      setFormData((prev) => ({ ...prev, imageUrl: presignedData.publicUrl }));
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl) {
      setError('Título e imagen son obligatorios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = getAccessToken();
      const url = editingBanner
        ? `/api/banners/${editingBanner.id}`
        : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(editingBanner ? 'Banner actualizado' : 'Banner creado');
        setShowModal(false);
        loadBanners();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;

    try {
      const token = getAccessToken();
      const res = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Banner eliminado');
        loadBanners();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const token = getAccessToken();
      await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      loadBanners();
    } catch (err) {
      setError('Error al actualizar');
    }
  };

  const updateOrder = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex((b) => b.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];

    // Actualizar sortOrder
    const token = getAccessToken();
    await Promise.all(
      newBanners.map((b, i) =>
        fetch(`/api/banners/${b.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sortOrder: i }),
        })
      )
    );

    loadBanners();
  };

  const loadingView = (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );

  if (isLoading || !isAuthorized) {
    return loadingView;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
                <ImageIcon className="w-5 h-5 text-cyan-300" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Banners</h1>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Banner</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300">
            {success}
          </div>
        )}

        {/* Banner List */}
        {banners.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
              <ImageIcon className="w-6 h-6 text-cyan-300" />
            </div>
            <p className="text-zinc-300 font-medium mb-1">No hay banners creados</p>
            <p className="text-zinc-500 text-sm mb-4">Crea tu primer banner para destacar contenido.</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition"
            >
              Crear primer banner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-zinc-900/60 rounded-xl border shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition ${
                  banner.isActive ? 'border-zinc-800/80 hover:border-cyan-500/30' : 'border-zinc-800/60 opacity-70'
                } overflow-hidden`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image Preview */}
                  <div className="relative w-full sm:w-48 h-32 sm:h-auto flex-shrink-0">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                    {!banner.isActive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <EyeOff className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{banner.title}</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          Posición: {banner.position} | Orden: {banner.sortOrder}
                        </p>
                        {banner.linkUrl && (
                          <a
                            href={banner.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 text-sm mt-2 hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" />
                            {banner.linkUrl.substring(0, 40)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {(banner.startDate || banner.endDate) && (
                          <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : '...'}
                            {' - '}
                            {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : '...'}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOrder(banner.id, 'up')}
                          disabled={index === 0}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => updateOrder(banner.id, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => toggleActive(banner)}
                          className={`p-2 rounded-lg transition ${
                            banner.isActive ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(banner)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
                className="bg-zinc-900/95 rounded-xl border border-zinc-800/80 w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.55)]"

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900/95 rounded-xl border border-zinc-800/80 w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white">
                  {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-800 rounded">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="text-zinc-400 text-sm mb-2 block">Imagen del Banner *</label>
                  <div className="relative aspect-[3/1] bg-zinc-800 rounded-lg overflow-hidden border-2 border-dashed border-zinc-600">
                    {imagePreview || formData.imageUrl ? (
                      <Image
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-zinc-600 mb-2" />
                        <p className="text-zinc-500 text-sm">Sube una imagen</p>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="mt-2 w-full py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition text-sm hover:border-zinc-700"
                  >
                    {uploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nombre del banner"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Link (opcional)</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-zinc-500 text-xs mt-1">Link a evento, DJ, promo, etc.</p>
                </div>

                {/* Position */}
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Posición</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="HOME">Home - Principal</option>
                    <option value="GENRE">Páginas de Género</option>
                    <option value="DJ">Páginas de DJ</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Fecha inicio</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Fecha fin</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Active */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-600"
                  />
                  <span className="text-white">Banner activo</span>
                </label>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title || !formData.imageUrl}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

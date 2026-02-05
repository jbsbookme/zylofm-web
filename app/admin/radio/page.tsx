'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Check,
  X,
  ArrowLeft,
  Globe,
  Music2,
  ExternalLink,
} from 'lucide-react';
import { isAuthenticated, isAdmin } from '@/lib/auth-store';

interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  genre: string | null;
  coverUrl: string | null;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export default function RadioAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState<RadioStation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    streamUrl: '',
    genre: '',
    coverUrl: '',
    description: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?callbackUrl=/admin/radio');
      return;
    }
    if (!isAdmin()) {
      router.replace('/');
      return;
    }
    setIsAuthorized(true);
    setIsLoading(false);
    loadStations();
  }, [router]);

  const loadStations = async () => {
    setLoadingStations(true);
    setError(null);
    
    try {
      const response = await fetch('/api/radio');
      const data = await response.json();
      
      if (data.success) {
        setStations(data.data || []);
      } else {
        setError('Error al cargar estaciones');
      }
    } catch (err) {
      console.error('Error loading stations:', err);
      setError('Error de conexión');
    } finally {
      setLoadingStations(false);
    }
  };

  const openModal = (station?: RadioStation) => {
    if (station) {
      setEditingStation(station);
      setFormData({
        name: station.name,
        streamUrl: station.streamUrl,
        genre: station.genre || '',
        coverUrl: station.coverUrl || '',
        description: station.description || '',
        isDefault: station.isDefault,
      });
    } else {
      setEditingStation(null);
      setFormData({
        name: '',
        streamUrl: '',
        genre: '',
        coverUrl: '',
        description: '',
        isDefault: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStation(null);
    setFormData({
      name: '',
      streamUrl: '',
      genre: '',
      coverUrl: '',
      description: '',
      isDefault: false,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.streamUrl.trim()) {
      setError('Nombre y URL son requeridos');
      return;
    }

    setActionLoading('submit');
    const token = localStorage.getItem('zylo_access_token');

    try {
      const url = editingStation
        ? `/api/radio/${editingStation.id}`
        : '/api/radio';
      const method = editingStation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        closeModal();
        loadStations();
      } else {
        setError(data.error?.message || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error saving station:', err);
      setError('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (stationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta estación?')) return;

    setActionLoading(stationId);
    const token = localStorage.getItem('zylo_access_token');

    try {
      const response = await fetch(`/api/radio/${stationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        loadStations();
      } else {
        setError(data.error?.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error('Error deleting station:', err);
      setError('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (station: RadioStation) => {
    setActionLoading(station.id);
    const token = localStorage.getItem('zylo_access_token');

    try {
      const response = await fetch(`/api/radio/${station.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...station, isDefault: true }),
      });

      const data = await response.json();

      if (data.success) {
        loadStations();
      } else {
        setError(data.error?.message || 'Error al actualizar');
      }
    } catch (err) {
      console.error('Error updating station:', err);
      setError('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 tracking-tight">
                <Radio className="w-6 h-6 text-cyan-400" />
                Gestionar Radios
              </h1>
              <p className="text-zinc-500 text-sm">Administra las estaciones de radio</p>
            </div>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-all"
          >
            <Plus className="w-4 h-4" />
            Agregar Radio
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center justify-between"
          >
            {error}
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Stations List */}
        {loadingStations ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
              <Radio className="w-6 h-6 text-cyan-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-1">Sin estaciones</h3>
            <p className="text-zinc-500 text-sm mb-6">Agrega tu primera estación de radio</p>
            <button
              onClick={() => openModal()}
              className="px-6 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Agregar Radio
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stations.map((station) => (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-zinc-900/60 rounded-xl border p-4 shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition hover:border-cyan-500/30 ${
                  station.isDefault ? 'border-cyan-500/50' : 'border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    station.isDefault 
                      ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-700/10 ring-1 ring-cyan-500/10' 
                      : 'bg-zinc-800'
                  }`}>
                    <Radio className={`w-7 h-7 ${station.isDefault ? 'text-cyan-300' : 'text-zinc-500'}`} />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{station.name}</h3>
                      {station.isDefault && (
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 truncate">{station.streamUrl}</p>
                    {station.genre && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                        {station.genre}
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!station.isDefault && (
                      <button
                        onClick={() => handleSetDefault(station)}
                        disabled={actionLoading === station.id}
                        className="p-2 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Establecer como principal"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={station.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Probar stream"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openModal(station)}
                      className="p-2 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(station.id)}
                      disabled={actionLoading === station.id}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      {actionLoading === station.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
          <h4 className="font-medium text-zinc-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Sobre las estaciones de radio
          </h4>
          <ul className="text-sm text-zinc-500 space-y-1">
            <li>• La estación marcada como "Principal" se mostrará por defecto en la app</li>
            <li>• Usa URLs de streaming compatibles (MP3, AAC, HLS)</li>
            <li>• Puedes agregar múltiples estaciones de diferentes géneros</li>
          </ul>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900/95 rounded-xl p-6 border border-zinc-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            >
              <h3 className="text-xl font-bold mb-4">
                {editingStation ? 'Editar Estación' : 'Nueva Estación'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ZyloFM Radio"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">URL del Stream *</label>
                  <input
                    type="url"
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="https://stream.zeno.fm/..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Género</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="Electronic, House, etc."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la estación..."
                    rows={2}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">URL de Portada</label>
                  <input
                    type="url"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-sm text-zinc-300">Establecer como estación principal</span>
                </label>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading === 'submit'}
                  className="flex-1 py-2.5 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'submit' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingStation ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ArrowLeft,
  Music,
  Instagram,
  Globe,
  Mail,
  Save,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { isAuthenticated, isAdmin, getAccessToken } from '@/lib/auth-store';
import Image from 'next/image';

interface DJ {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  photoUrl?: string;
  instagram?: string;
  soundcloud?: string;
  isActive: boolean;
  _count?: { mixes: number };
}

interface DJRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  soundcloud?: string | null;
  sampleLink?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    photoUrl: string | null;
  };
}

export default function DJsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [djs, setDJs] = useState<DJ[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [djRequests, setDjRequests] = useState<DJRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDJ, setEditingDJ] = useState<DJ | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    photoUrl: '',
    instagram: '',
    soundcloud: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace('/login');
      return;
    }
    setIsAuthorized(true);
    setIsLoading(false);
    loadDJs();
    loadDJRequests();
  }, [router]);

  const loadDJs = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/admin/djs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDJs(data.data);
      }
    } catch (err) {
      setError('Error al cargar DJs');
    }
  };

  const loadDJRequests = async () => {
    setRequestsLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/admin/dj-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDjRequests(data.data || []);
      }
    } catch (err) {
      setError('Error al cargar solicitudes DJ');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/dj-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(action === 'APPROVE' ? 'Solicitud aprobada' : 'Solicitud rechazada');
        loadDJRequests();
        loadDJs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error al procesar solicitud');
      }
    } catch (err) {
      setError('Error al procesar solicitud');
    }
  };

  const openEditModal = (dj: DJ) => {
    setEditingDJ(dj);
    setFormData({
      name: dj.name || '',
      email: dj.email,
      bio: dj.bio || '',
      photoUrl: dj.photoUrl || '',
      instagram: dj.instagram || '',
      soundcloud: dj.soundcloud || '',
      isActive: dj.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingDJ) return;

    setSaving(true);
    setError('');

    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/djs/${editingDJ.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('DJ actualizado');
        setShowModal(false);
        loadDJs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar DJ');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = async (dj: DJ) => {
    const newRole = dj.role === 'DJ' ? 'LISTENER' : 'DJ';
    if (!confirm(`¿Cambiar rol de ${dj.name || dj.email} a ${newRole}?`)) return;

    try {
      const token = getAccessToken();
      await fetch(`/api/admin/djs/${dj.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      loadDJs();
      setSuccess(`Rol actualizado a ${newRole}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar rol');
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const djUsers = djs.filter(d => d.role === 'DJ');
  const listeners = djs.filter(d => d.role === 'LISTENER');

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
                <User className="w-5 h-5 text-cyan-300" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">DJs</h1>
            </div>
          </div>
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

        {/* DJ Requests Section */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-300" />
            Solicitudes DJ ({djRequests.length})
          </h2>

          {requestsLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando solicitudes...
            </div>
          ) : djRequests.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/60 rounded-2xl border border-zinc-800/80">
              <p className="text-zinc-400">No hay solicitudes pendientes.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {djRequests.map((req) => (
                <div key={req.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                      {req.user.photoUrl ? (
                        <Image src={req.user.photoUrl} alt={req.user.name || req.user.email} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{req.user.name || 'Sin nombre'}</p>
                      <p className="text-xs text-zinc-500">{req.user.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRequestAction(req.id, 'APPROVE')}
                      className="px-3 py-2 bg-emerald-500/90 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRequestAction(req.id, 'REJECT')}
                      className="px-3 py-2 bg-red-500/80 hover:bg-red-400 text-white text-sm font-semibold rounded-lg"
                    >
                      Rechazar
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-zinc-400">
                    {req.displayName && (
                      <p><span className="text-zinc-500">Nombre artístico:</span> {req.displayName}</p>
                    )}
                    {req.location && (
                      <p><span className="text-zinc-500">Ubicación:</span> {req.location}</p>
                    )}
                    {req.phone && (
                      <p><span className="text-zinc-500">Teléfono:</span> {req.phone}</p>
                    )}
                    {req.bio && (
                      <p className="text-zinc-500">{req.bio}</p>
                    )}
                    {req.sampleLink && (
                      <a href={req.sampleLink} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                        Ver muestra
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DJs Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-300" />
            DJs Activos ({djUsers.length})
          </h2>
          
          {djUsers.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
                <User className="w-6 h-6 text-cyan-300" />
              </div>
              <p className="text-zinc-300 font-medium">No hay DJs registrados</p>
              <p className="text-zinc-500 text-sm mt-1">Convierte usuarios en DJs para empezar.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {djUsers.map((dj) => (
                <motion.div
                  key={dj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition hover:border-cyan-500/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                      {dj.photoUrl ? (
                        <Image
                          src={dj.photoUrl}
                          alt={dj.name || 'DJ'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {dj.name || 'Sin nombre'}
                      </h3>
                      <p className="text-zinc-400 text-sm truncate">{dj.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 text-xs rounded-full">
                          DJ
                        </span>
                        {dj._count && (
                          <span className="text-zinc-500 text-xs">
                            {dj._count.mixes} mixes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => openEditModal(dj)}
                      className="flex-1 py-2 bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 text-white rounded-lg transition text-sm flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => toggleRole(dj)}
                      className="py-2 px-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 rounded-lg transition text-sm"
                      title="Quitar rol de DJ"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Listeners Section */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-zinc-400" />
            Usuarios ({listeners.length})
          </h2>
          
          {listeners.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
                <User className="w-5 h-5 text-cyan-300" />
              </div>
              <p className="text-zinc-300 font-medium">No hay usuarios registrados</p>
              <p className="text-zinc-500 text-sm mt-1">Crea o invita usuarios para comenzar.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 divide-y divide-zinc-800 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
              {listeners.slice(0, 20).map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between transition hover:bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name || user.email.split('@')[0]}</p>
                      <p className="text-zinc-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRole(user)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm rounded-lg transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Hacer DJ
                  </button>
                </div>
              ))}
              {listeners.length > 20 && (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  Y {listeners.length - 20} usuarios más...
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingDJ && (
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
              className="bg-zinc-900/95 rounded-xl border border-zinc-800/80 w-full max-w-md max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white tracking-tight">Editar DJ</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-800 rounded">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Nombre artístico</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Foto URL</label>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@usuario"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">SoundCloud</label>
                  <input
                    type="url"
                    value={formData.soundcloud}
                    onChange={(e) => setFormData({ ...formData, soundcloud: e.target.value })}
                    placeholder="https://soundcloud.com/..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-600"
                  />
                  <span className="text-white">Cuenta activa</span>
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
                  disabled={saving}
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

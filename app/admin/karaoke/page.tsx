'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2, Plus, Trash2, Edit2, Save, X, Loader2, ArrowLeft,
  Music2, Play, Pause, Upload, FileText
} from 'lucide-react';
import Image from 'next/image';
import { isAuthenticated, isAdmin, getAccessToken } from '@/lib/auth-store';
import { ZYLO_LOGO } from '@/components/cover-image';

interface KaraokeTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string | null;
  cloudStoragePath: string | null;
  coverUrl: string | null;
  lyrics: string | null;
  durationSec: number | null;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminKaraokePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tracks, setTracks] = useState<KaraokeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<KaraokeTrack | null>(null);
  const [previewTrack, setPreviewTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    audioUrl: '',
    coverUrl: '',
    lyrics: '',
    durationSec: '',
    sortOrder: '0',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!isAdmin()) {
      router.push('/');
      return;
    }
    setAuthorized(true);
    loadTracks();
  }, [router]);

  const loadTracks = async () => {
    try {
      const res = await fetch('/api/karaoke');
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.artist) return;

    setSaving(true);
    try {
      const token = getAccessToken();
      const url = editingTrack ? `/api/karaoke/${editingTrack.id}` : '/api/karaoke';
      const method = editingTrack ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          artist: formData.artist,
          audioUrl: formData.audioUrl || null,
          coverUrl: formData.coverUrl || null,
          lyrics: formData.lyrics || null,
          durationSec: formData.durationSec ? parseInt(formData.durationSec) : null,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      if (res.ok) {
        loadTracks();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving track:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pista de karaoke?')) return;

    try {
      const token = getAccessToken();
      const res = await fetch(`/api/karaoke/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadTracks();
      }
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const startEdit = (track: KaraokeTrack) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      artist: track.artist,
      audioUrl: track.audioUrl || '',
      coverUrl: track.coverUrl || '',
      lyrics: track.lyrics || '',
      durationSec: track.durationSec?.toString() || '',
      sortOrder: track.sortOrder.toString(),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTrack(null);
    setFormData({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
      lyrics: '',
      durationSec: '',
      sortOrder: '0',
    });
  };

  const togglePreview = (audioUrl: string | null) => {
    if (!audioUrl || !audioRef.current) return;
    
    if (previewTrack === audioUrl && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (previewTrack !== audioUrl) {
        audioRef.current.src = audioUrl;
        setPreviewTrack(audioUrl);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (authorized === null || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black px-4 py-10 pb-32">
      {/* Hidden audio for preview */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/admin')}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 tracking-tight">
            <Mic2 className="w-6 h-6 text-cyan-400" />
            Gestión Karaoke
          </h1>
          <p className="text-zinc-400 text-sm">{tracks.length} pistas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Pista</span>
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900/95 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  {editingTrack ? 'Editar Pista' : 'Nueva Pista'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Artista *</label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">URL Audio (sin voz)</label>
                  <input
                    type="url"
                    value={formData.audioUrl}
                    onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">URL Cover</label>
                  <input
                    type="url"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Duración (seg)</label>
                    <input
                      type="number"
                      value={formData.durationSec}
                      onChange={(e) => setFormData({ ...formData, durationSec: e.target.value })}
                      placeholder="180"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Orden</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Letras (formato LRC)
                  </label>
                  <textarea
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    placeholder="[00:00.00]Primera línea...&#10;[00:05.50]Segunda línea..."
                    rows={6}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Formato: [MM:SS.ms]Texto de la línea
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition-colors hover:border-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingTrack ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
            <Music2 className="w-6 h-6 text-cyan-300" />
          </div>
          <p className="text-zinc-300 font-medium">No hay pistas de karaoke</p>
          <p className="text-zinc-500 text-sm mt-1">Sube la primera pista para comenzar.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors"
          >
            Crear primera pista
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition hover:border-cyan-500/30"
            >
              {/* Cover */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                <Image
                  src={track.coverUrl || ZYLO_LOGO}
                  alt={track.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{track.title}</h3>
                <p className="text-sm text-zinc-400 truncate">{track.artist}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  {track.lyrics && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Letras
                    </span>
                  )}
                  {track.durationSec && (
                    <span>{Math.floor(track.durationSec / 60)}:{(track.durationSec % 60).toString().padStart(2, '0')}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {track.audioUrl && (
                  <button
                    onClick={() => togglePreview(track.audioUrl)}
                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    {previewTrack === track.audioUrl && isPlaying ? (
                      <Pause className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => startEdit(track)}
                  className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(track.id)}
                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

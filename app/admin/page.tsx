'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Music2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  User,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Square,
  Radio,
  Home,
  Upload,
  FolderPlus,
  Image as ImageIcon,
  Eye,
  Filter,
  Disc3,
  Info,
  Mic2,
  Sparkles,
} from 'lucide-react';
import { isAuthenticated, isAdmin, getUser, getAccessToken, logout } from '@/lib/auth-store';
import { Mix } from '@/lib/types';
import { MixStatusBadge } from '@/components/ui/mix-status-badge';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AdminMix {
  id: string;
  title: string;
  djName?: string;
  djPhotoUrl?: string;
  description?: string;
  durationSec?: number;
  bpm?: number;
  coverUrl?: string;
  hlsUrl?: string;
  audioUrl?: string;
  status?: string;
  rejectReason?: string;
  featured?: boolean;
  createdAt?: string;
  userId?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    photoUrl?: string;
  };
  genre?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DjProActivationLog {
  id: string;
  adminUserId: string;
  updatedCount: number;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mixes, setMixes] = useState<AdminMix[]>([]);
  const [loadingMixes, setLoadingMixes] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [activatingPromo, setActivatingPromo] = useState(false);
  const djProEnabled = process.env.NEXT_PUBLIC_FEATURE_DJ_PRO === 'true';
  const [djProLogs, setDjProLogs] = useState<DjProActivationLog[]>([]);
  const [djProLogsLoading, setDjProLogsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [allMixes, setAllMixes] = useState<AdminMix[]>([]); // Para contadores

  // Preview player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMix, setCurrentMix] = useState<AdminMix | null>(null);

  // Modal de confirmación rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMixId, setRejectMixId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const user = getUser();

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.replace('/login?callbackUrl=/admin');
        return;
      }
      if (!isAdmin()) {
        router.replace('/');
        return;
      }
      setIsAuthorized(true);
      setIsLoading(false);
      loadMixes();
      loadDjProLogs();
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    loadMixes();
  }, [filterStatus]);

  // Cargar todos los mixes para contadores
  const loadAllMixes = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/admin/mixes/pending?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAllMixes(data.data || []);
    } catch {}
  };

  useEffect(() => {
    loadAllMixes();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadMixes = async () => {
    setLoadingMixes(true);
    setError('');
    try {
      const token = getAccessToken();
      const url = filterStatus === 'ALL' 
        ? '/api/admin/mixes/pending?all=true'
        : `/api/admin/mixes/pending?status=${filterStatus}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMixes(data.data || []);
      } else {
        setError(data.error || 'Error al cargar mixes');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoadingMixes(false);
    }
  };

  const handleApprove = async (mixId: string) => {
    setProcessingId(mixId);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/mixes/${mixId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Mix aprobado exitosamente');
        loadMixes();
        loadAllMixes(); // Actualizar contadores
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Error al aprobar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setProcessingId(null);
    }
  };

  const activateDjProPromo = async () => {
    setPromoError('');
    setActivatingPromo(true);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/admin/dj-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || 'DJ PRO activado');
        setPromoCode('');
        loadDjProLogs();
      } else {
        setPromoError(data.error?.message || 'Código inválido');
      }
    } catch {
      setPromoError('Error al activar DJ PRO');
    } finally {
      setActivatingPromo(false);
    }
  };

  const loadDjProLogs = async () => {
    setDjProLogsLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/admin/dj-pro/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDjProLogs(data.data || []);
      }
    } catch {
      // no-op
    } finally {
      setDjProLogsLoading(false);
    }
  };

  const openRejectModal = (mixId: string) => {
    setRejectMixId(mixId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectMixId) return;
    setProcessingId(rejectMixId);
    setShowRejectModal(false);
    
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/mixes/${rejectMixId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Mix rechazado');
        loadMixes();
        loadAllMixes(); // Actualizar contadores
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Error al rechazar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setProcessingId(null);
      setRejectMixId(null);
    }
  };

  // Preview player functions
  const playPreview = (mix: AdminMix) => {
    const audioUrl = mix.hlsUrl || mix.audioUrl || `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 16) + 1}.mp3`;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCurrentMix(mix);
    setPlayingId(mix.id);
    setProgress(0);
    setDuration(0);

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setProgress(audio.currentTime);
    audio.onended = () => {
      setIsPlaying(false);
      setPlayingId(null);
    };

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingId(null);
    setCurrentMix(null);
    setProgress(0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (sec: number) => {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    stopPreview();
    logout();
    router.push('/login');
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const statusCounts = {
    total: allMixes.length,
    PENDING: allMixes.filter(m => m.status === 'PENDING').length,
    PUBLISHED: allMixes.filter(m => m.status === 'PUBLISHED').length,
    REJECTED: allMixes.filter(m => m.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
              <Shield className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Admin Panel</h1>
              <p className="text-zinc-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
              title="Inicio"
            >
              <Home className="w-5 h-5 text-zinc-400" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Media Library Modules - Organized Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-cyan-400" />
            Media Library
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/admin/library/assistant')}
              className="group flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.01] hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgba(34,211,238,0.08)]"
            >
              <div className="p-3 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
                <Music2 className="w-6 h-6 text-cyan-300" />
              </div>
              <span className="text-sm font-medium text-white">Assistant Library</span>
              <span className="text-xs text-zinc-500">Mixes y tracks</span>
            </button>
            <button
              onClick={() => router.push('/admin/djs')}
              className="group flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.01] hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgba(34,211,238,0.08)]"
            >
              <div className="p-3 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
                <User className="w-6 h-6 text-cyan-300" />
              </div>
              <span className="text-sm font-medium text-white">DJs</span>
              <span className="text-xs text-zinc-500">Perfiles de artistas</span>
            </button>
            <button
              onClick={() => router.push('/admin/library/radio-ids')}
              className="group flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.01] hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgba(34,211,238,0.08)]"
            >
              <div className="p-3 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
                <Radio className="w-6 h-6 text-cyan-300" />
              </div>
              <span className="text-sm font-medium text-white">Radio IDs</span>
              <span className="text-xs text-zinc-500">Jingles y IDs</span>
            </button>
            <button
              onClick={() => router.push('/admin/library/shows')}
              className="group flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.01] hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgba(34,211,238,0.08)]"
            >
              <div className="p-3 bg-cyan-500/10 rounded-lg ring-1 ring-cyan-500/10">
                <Disc3 className="w-6 h-6 text-cyan-300" />
              </div>
              <span className="text-sm font-medium text-white">Shows</span>
              <span className="text-xs text-zinc-500">Programas grabados</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Acciones Rápidas
          </h2>
          <div className="flex flex-wrap gap-3">
            {!djProEnabled && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-cyan-500/40 hover:text-white"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Activar DJ PRO (Promoción)</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Activar DJ PRO (Promoción)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-500">
                      Ingresa el código de acceso para activar DJ PRO en DJs existentes.
                    </p>
                    <input
                      type="password"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="Código de acceso"
                    />
                    {promoError && (
                      <p className="text-sm text-red-400">{promoError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <button
                      onClick={activateDjProPromo}
                      disabled={activatingPromo}
                      className="px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                    >
                      {activatingPromo ? 'Activando...' : 'Confirmar'}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition shadow-sm"
            >
              <Upload className="w-5 h-5" />
              <span>Subir Audio</span>
            </button>
            <button
              onClick={() => router.push('/admin/genres')}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-cyan-500/40 hover:text-white"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Géneros</span>
            </button>
            <button
              onClick={() => router.push('/admin/radio')}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-cyan-500/40 hover:text-white"
            >
              <Radio className="w-5 h-5" />
              <span>Radios</span>
            </button>
            <button
              onClick={() => router.push('/admin/banners')}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-cyan-500/40 hover:text-white"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Banners</span>
            </button>
            <button
              onClick={() => router.push('/admin/karaoke')}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-cyan-500/40 hover:text-white"
            >
              <Mic2 className="w-5 h-5" />
              <span>Karaoke</span>
            </button>
          </div>
        </div>

        {/* DJ PRO Activation Logs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Historial DJ PRO
          </h2>
          {djProLogsLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando historial...
            </div>
          ) : djProLogs.length === 0 ? (
            <div className="text-zinc-500 text-sm">Sin activaciones registradas.</div>
          ) : (
            <div className="space-y-2">
              {djProLogs.map((log) => (
                <div key={log.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 text-sm text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>Actualizados: {log.updatedCount}</span>
                    <span className="text-zinc-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-zinc-500">Admin: {log.adminUserId}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mini Dashboard - Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Music2 className="w-4 h-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{statusCounts.total}</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 text-amber-300 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-amber-300">{statusCounts.PENDING}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 text-emerald-300 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Publicados</span>
            </div>
            <p className="text-2xl font-bold text-emerald-300">{statusCounts.PUBLISHED}</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 text-red-300 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Rechazados</span>
            </div>
            <p className="text-2xl font-bold text-red-300">{statusCounts.REJECTED}</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300">{successMessage}</span>
          </motion.div>
        )}

        {/* Mixes Section */}
        <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Music2 className="w-6 h-6 text-cyan-500" />
                <h2 className="text-lg font-semibold text-white">Moderación de Mixes</h2>
              </div>
              
              {/* Filtros de estado */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-zinc-500" />
                {['PENDING', 'PUBLISHED', 'REJECTED', 'ALL'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      filterStatus === status
                        ? status === 'PENDING' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : status === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : status === 'REJECTED' ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {status === 'ALL' ? 'Todos' : status === 'PENDING' ? 'Pendientes' : status === 'PUBLISHED' ? 'Publicados' : 'Rechazados'}
                  </button>
                ))}
                <button
                  onClick={loadMixes}
                  disabled={loadingMixes}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition ml-2"
                >
                  <RefreshCw className={`w-4 h-4 text-zinc-400 ${loadingMixes ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {loadingMixes ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : mixes.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/10">
                <Music2 className="w-6 h-6 text-cyan-300" />
              </div>
              <p className="text-zinc-300 font-medium">No hay mixes con estado "{filterStatus}"</p>
              <p className="text-zinc-500 text-sm mt-1">Prueba con otro filtro para ver resultados.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {mixes.map((mix) => (
                <div key={mix.id} className="p-4 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Cover Preview */}
                    <div className="relative w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-zinc-800/60">
                      {mix.coverUrl ? (
                        <Image
                          src={mix.coverUrl}
                          alt={mix.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-10 h-10 text-zinc-600" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <button
                        onClick={() => playingId === mix.id ? togglePlay() : playPreview(mix)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition"
                      >
                        {playingId === mix.id && isPlaying ? (
                          <Pause className="w-8 h-8 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-white font-semibold truncate">{mix.title}</h3>
                          <p className="text-zinc-400 text-sm truncate">
                            {mix.user?.name || mix.user?.email || mix.djName}
                          </p>
                        </div>
                        <MixStatusBadge status={mix.status || 'PENDING'} size="sm" />
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(mix.durationSec || 0)}
                        </span>
                        {mix.bpm && (
                          <span className="flex items-center gap-1">
                            <Disc3 className="w-3 h-3" />
                            {mix.bpm} BPM
                          </span>
                        )}
                        {mix.genre && (
                          <span className="px-2 py-0.5 bg-zinc-800 rounded-full">
                            {mix.genre.name}
                          </span>
                        )}
                        {mix.createdAt && (
                          <span>
                            {new Date(mix.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Razón de rechazo */}
                      {mix.status === 'REJECTED' && mix.rejectReason && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300 flex items-start gap-2">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{mix.rejectReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-2 sm:w-auto">
                      {mix.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(mix.id)}
                            disabled={processingId === mix.id}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm rounded-lg transition hover:bg-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {processingId === mix.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Aprobar
                          </button>
                          <button
                            onClick={() => openRejectModal(mix.id)}
                            disabled={processingId === mix.id}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg transition hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {mix.status === 'PUBLISHED' && (
                        <button
                          onClick={() => router.push(`/genre/${mix.genre?.id || ''}`)}
                          className="px-4 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-200 text-sm rounded-lg transition hover:border-cyan-500/40 hover:text-white flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Preview Player (Mini) */}
      <AnimatePresence>
        {currentMix && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 p-3 sm:p-4 shadow-[0_-12px_30px_rgba(0,0,0,0.45)]"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-3 sm:gap-4">
              {/* Cover mini */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-zinc-800/60">
                {currentMix.coverUrl ? (
                  <Image
                    src={currentMix.coverUrl}
                    alt={currentMix.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{currentMix.title}</p>
                <p className="text-zinc-400 text-xs truncate">
                  {currentMix.user?.name || currentMix.djName}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
                <span className="text-zinc-500 text-xs w-10 text-right">{formatTime(progress)}</span>
                <div
                  className="flex-1 h-1.5 bg-zinc-700 rounded-full cursor-pointer"
                  onClick={seekTo}
                >
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-zinc-500 text-xs w-10">{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button onClick={togglePlay} className="p-2 hover:bg-zinc-800 rounded-full transition">
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  )}
                </button>
                <button onClick={toggleMute} className="p-2 hover:bg-zinc-800 rounded-full transition">
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-zinc-400" />
                  )}
                </button>
                <button onClick={stopPreview} className="p-2 hover:bg-zinc-800 rounded-full transition">
                  <Square className="w-5 h-5 text-zinc-400" fill="currentColor" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Rechazo */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900/95 rounded-xl border border-zinc-800/80 w-full max-w-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Rechazar Mix
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                ¿Estás seguro de rechazar este mix? Esta acción notificará al DJ.
              </p>
              <div className="mb-4">
                <label className="text-zinc-400 text-sm mb-2 block">Razón del rechazo (opcional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Audio de baja calidad, contenido inapropiado..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-lg transition hover:border-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg transition hover:bg-red-500/20 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Confirmar Rechazo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

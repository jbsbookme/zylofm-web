'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Radio, LogOut, LogIn, Shield } from 'lucide-react';
import { isAuthenticated, isAdmin, getUser, clearAuth } from '@/lib/auth-store';
import type { User as UserType } from '@/lib/types';

export function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setAuthenticated(isAuthenticated());
    setAdmin(isAdmin());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getUser());
      setAuthenticated(isAuthenticated());
      setAdmin(isAdmin());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setAuthenticated(false);
    setAdmin(false);
    router.push('/');
  };

  if (!mounted) {
    return (
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50"
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              ZyloFM
            </span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        </div>
      </motion.header>
    );
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg shadow-lg group-hover:shadow-cyan-500/20 transition-shadow">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            ZyloFM
          </span>
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {authenticated ? (
            <div className="flex items-center gap-2">
              {admin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors text-sm"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors text-sm text-black font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Radio, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { login } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth-store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const callbackUrl = searchParams?.get?.('callbackUrl') ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setIsLoading(true);
    setError('');

    try {
      const normalizedEmail = email?.toLowerCase?.()?.trim?.() || '';
      const signInResult = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Credenciales inválidas');
      }

      // Llamar al backend real
      const response = await login(
        normalizedEmail,
        password
      );

      // Guardar tokens en localStorage
      setTokens(response.tokens.accessToken, response.tokens.refreshToken);

      // Guardar usuario
      setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      });

      // Redirigir según rol
      if (response.user.role === 'ADMIN') {
        router?.replace?.('/admin');
      } else {
        router?.replace?.(callbackUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Iniciar Sesión</h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">Accede a tu cuenta de ZyloFM</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e?.target?.value ?? '')}
                required
                placeholder="tu@email.com"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-zinc-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e?.target?.value ?? '')}
                required
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-zinc-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Iniciando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Link a registro */}
        <p className="text-center text-zinc-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-black flex items-center justify-center'><Loader2 className='w-8 h-8 animate-spin text-cyan-400' /></div>}>
      <LoginContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Radio, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setIsLoading(true);
    setError('');

    try {
      // Primero crear la cuenta
      const signupRes = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name?.trim?.(),
          email: email?.toLowerCase?.()?.trim?.(),
          password,
        }),
      });

      const signupData = await signupRes?.json?.();

      if (!signupRes?.ok) {
        setError(signupData?.error ?? 'Error al crear la cuenta');
        setIsLoading(false);
        return;
      }

      // Luego iniciar sesión automáticamente
      const result = await signIn?.('credentials', {
        email: email?.toLowerCase?.()?.trim?.(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Cuenta creada, pero error al iniciar sesión. Por favor, inicia sesión manualmente.');
      } else if (result?.ok) {
        router?.replace?.('/');
      }
    } catch (err) {
      setError('Error al crear la cuenta. Por favor, inténtalo de nuevo.');
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
          <h1 className="text-xl sm:text-2xl font-bold">Crear Cuenta</h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">Uníete a la comunidad ZyloFM</p>
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
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e?.target?.value ?? '')}
                required
                placeholder="Tu nombre"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-zinc-500 transition-all"
              />
            </div>
          </div>

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
                minLength={6}
                placeholder="Mínimo 6 caracteres"
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
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Link a login */}
        <p className="text-center text-zinc-400 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

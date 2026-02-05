'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Folder, Users, User, Mic2 } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth-store';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/genres', label: 'Géneros', icon: Folder },
  { href: '/karaoke', label: 'Karaoke', icon: Mic2 },
  { href: '/djs', label: 'DJs', icon: Users },
  { href: '/profile', label: 'Perfil', icon: User, requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  // No mostrar en páginas de admin
  if (pathname?.startsWith('/admin')) return null;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiresAuth || (item.requiresAuth && mounted && authenticated)
  );

  // Si no está autenticado, mostrar login en lugar de perfil
  const displayItems = mounted && !authenticated
    ? [...visibleItems.filter((i) => i.href !== '/profile'), { href: '/login', label: 'Entrar', icon: User }]
    : visibleItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 safe-area-bottom">
      {/* Glow effect */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {displayItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] sm:min-w-[64px] group"
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Icon container */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative p-2 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20'
                      : 'group-hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  
                  {/* Active glow */}
                  {active && (
                    <div className="absolute inset-0 rounded-xl bg-cyan-500/10 blur-md" />
                  )}
                </motion.div>
                
                {/* Label */}
                <span
                  className={`text-[10px] font-medium leading-none whitespace-nowrap transition-colors ${
                    active ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom bg-zinc-950" />
    </nav>
  );
}

'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { PlayerProvider } from '@/context/player-context';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PlayerProvider>
          {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
        </PlayerProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

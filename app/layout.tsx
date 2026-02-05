import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { MiniPlayer } from '@/components/mini-player';
import { NowPlaying } from '@/components/now-playing';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZyloFM - Radio & Mixes de DJ',
  description: 'Escucha los mejores mixes de DJs y radio en vivo 24/7. Música electrónica, house, techno, salsa, bachata y más.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZyloFM',
  },
  applicationName: 'ZyloFM',
  keywords: ['radio', 'dj', 'mixes', 'music', 'electronica', 'house', 'techno', 'salsa', 'bachata'],
  authors: [{ name: 'ZyloFM' }],
  creator: 'ZyloFM',
  publisher: 'ZyloFM',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://zylofm.com',
    title: 'ZyloFM - Radio & Mixes de DJ',
    description: 'Escucha los mejores mixes de DJs y radio en vivo 24/7.',
    siteName: 'ZyloFM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZyloFM - Radio & Mixes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZyloFM - Radio & Mixes de DJ',
    description: 'Escucha los mejores mixes de DJs y radio en vivo 24/7.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#06b6d4' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" defer></script>
        {/* Apple Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZyloFM" />
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* MS */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pb-40">
              {children}
            </main>
            <MiniPlayer />
            <BottomNav />
            <NowPlaying />
          </div>
        </Providers>
      </body>
    </html>
  );
}

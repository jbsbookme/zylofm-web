# ZyloFM PWA - Aplicación Web Progresiva de Radio y Música

## Descripción

ZyloFM es una Progressive Web App (PWA) para escuchar mixes de DJs y radio en vivo 24/7. La aplicación soporta reproducción de audio HLS, controles en las notificaciones del navegador (Media Session API), y funcionalidad offline básica.

## Características

### Reproductor de Audio
- ✅ Soporte para HLS streaming (usando hls.js)
- ✅ Radio en vivo con streaming
- ✅ Reproducción en background
- ✅ Media Session API para controles en notificaciones del navegador
- ✅ MiniPlayer persistente en la parte inferior
- ✅ Pantalla NowPlaying completa con controles

### PWA
- ✅ Service Worker para caché y offline
- ✅ Manifest.json para instalación (Add to Home Screen)
- ✅ Iconos en múltiples tamaños
- ✅ Splash screen
- ✅ Diseño responsive

### UI/UX
- ✅ Tema oscuro moderno
- ✅ Animaciones suaves con Framer Motion
- ✅ Grid de mixes con covers
- ✅ Botón de radio en vivo destacado
- ✅ Estados del reproductor visuales

### Atajos de Teclado
- `Espacio` - Play/Pause
- `Flecha Derecha` - Adelantar 15 segundos (solo mixes)
- `Flecha Izquierda` - Retroceder 15 segundos (solo mixes)
- `M` - Silenciar/Activar sonido

## Tecnologías

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS
- **Animaciones:** Framer Motion
- **Audio:** hls.js
- **Autenticación:** NextAuth.js v4
- **Base de datos:** Prisma + SQLite
- **Iconos:** Lucide React

## Instalación

```bash
# Clonar o navegar al proyecto
cd zylo_fm_pwa/nextjs_space

# Instalar dependencias
yarn install

# Generar cliente Prisma
yarn prisma generate

# Ejecutar migraciones
yarn prisma migrate dev

# Sembrar datos iniciales
yarn prisma db seed

# Iniciar servidor de desarrollo
yarn dev
```

## Estructura del Proyecto

```
nextjs_space/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── signup/route.ts
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── home-content.tsx
├── components/
│   ├── mini-player.tsx
│   ├── now-playing.tsx
│   ├── mix-card.tsx
│   ├── radio-button.tsx
│   ├── header.tsx
│   └── providers.tsx
├── context/
│   └── player-context.tsx
├── lib/
│   ├── types.ts
│   ├── mock-data.ts
│   └── auth-options.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
└── prisma/
    └── schema.prisma
```

## Integración con Backend

La PWA está preparada para conectarse al backend NestJS de ZyloFM. Los endpoints esperados son:

```
# API Base
https://api.zylofm.com

# Endpoints
GET  /mixes          - Lista de mixes públicos
GET  /mixes/:id      - Detalle de un mix
POST /auth/login     - Iniciar sesión
POST /auth/register  - Registrar usuario

# Streaming
https://cdn.zylofm.com/hls/mixes/{id}/master.m3u8
```

## Datos Mock

Para desarrollo, la aplicación incluye datos mock en `lib/mock-data.ts` con 4 mixes de ejemplo y una estación de radio en vivo.

## Variables de Entorno

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="tu_secreto_aqui"
NEXTAUTH_URL="http://localhost:3000"
```

## Notas de Desarrollo

- El reproductor usa `hls.js` para navegadores que no soportan HLS nativamente (todos excepto Safari)
- La Media Session API permite controlar la reproducción desde las notificaciones del sistema operativo
- El Service Worker cachea recursos estáticos pero NO cachea streams de audio
- Los controles de skip (±15s) solo están disponibles para mixes, no para radio en vivo

## Licencia

© 2026 ZyloFM. Todos los derechos reservados.

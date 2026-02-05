import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario de prueba (admin)
  const passwordHash = await bcrypt.hash('johndoe123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Usuario admin creado:', adminUser?.email);

  // Crear DJs de ejemplo
  const djsData = [
    {
      email: 'djcosmic@zylofm.com',
      name: 'DJ Cosmic',
      password: await bcrypt.hash('cosmic123', 12),
      role: 'DJ' as const,
      bio: 'Especialista en Deep House y Progressive. Residente de los mejores clubs de Miami.',
      photoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
      instagram: 'https://instagram.com/djcosmic',
      twitter: 'https://twitter.com/djcosmic',
    },
    {
      email: 'lunabeats@zylofm.com',
      name: 'Luna Beats',
      password: await bcrypt.hash('luna123', 12),
      role: 'DJ' as const,
      bio: 'Tech House y Techno melodico. Productora y DJ internacional.',
      photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
      instagram: 'https://instagram.com/lunabeats',
    },
    {
      email: 'neonwave@zylofm.com',
      name: 'NeonWave',
      password: await bcrypt.hash('neon123', 12),
      role: 'DJ' as const,
      bio: 'Trance y Progressive. Llevando la música electrónica a otro nivel.',
      photoUrl: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&q=80',
      twitter: 'https://twitter.com/neonwave',
    },
    {
      email: 'tropicalsoul@zylofm.com',
      name: 'Tropical Soul',
      password: await bcrypt.hash('tropical123', 12),
      role: 'DJ' as const,
      bio: 'Reggaeton, Latin House y ritmos tropicales. El alma de la fiesta.',
      photoUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
      instagram: 'https://instagram.com/tropicalsoul',
    },
  ];

  for (const dj of djsData) {
    const createdDj = await prisma.user.upsert({
      where: { email: dj.email },
      update: {
        name: dj.name,
        bio: dj.bio,
        photoUrl: dj.photoUrl,
        instagram: dj.instagram,
        twitter: dj.twitter,
      },
      create: dj,
    });
    console.log('DJ creado:', createdDj.name);
  }

  // Crear género mínimo
  const demoGenre = await prisma.genre.upsert({
    where: { slug: 'electronic-demo' },
    update: {
      name: 'Electronic',
      description: 'Género demo para validación de mixes',
      isActive: true,
    },
    create: {
      name: 'Electronic',
      slug: 'electronic-demo',
      description: 'Género demo para validación de mixes',
      coverUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      isActive: true,
    },
  });

  console.log('Género demo creado:', demoGenre?.name);

  // Crear mix de prueba
  const djUser = await prisma.user.findFirst({ where: { role: 'DJ' } });
  if (djUser) {
    const demoMix = await prisma.mix.upsert({
      where: { id: 'seed-mix' },
      update: {
        title: 'ZyloFM Demo Mix',
        description: 'Mix de prueba para validación end-to-end',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        status: 'PUBLISHED',
        isPublic: true,
        userId: djUser.id,
        genreId: demoGenre.id,
      },
      create: {
        id: 'seed-mix',
        title: 'ZyloFM Demo Mix',
        description: 'Mix de prueba para validación end-to-end',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        status: 'PUBLISHED',
        isPublic: true,
        userId: djUser.id,
        genreId: demoGenre.id,
      },
    });

    console.log('Mix demo creado:', demoMix?.title);
  }

  // Crear banner activo
  const demoBanner = await prisma.banner.upsert({
    where: { id: 'seed-banner' },
    update: {
      title: 'Nuevo Mix Destacado',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
      linkUrl: '/mixes',
      position: 'HOME',
      sortOrder: 0,
      isActive: true,
    },
    create: {
      id: 'seed-banner',
      title: 'Nuevo Mix Destacado',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
      linkUrl: '/mixes',
      position: 'HOME',
      sortOrder: 0,
      isActive: true,
    },
  });

  console.log('Banner demo creado:', demoBanner?.title);

  // Crear estación de radio por defecto
  const defaultRadio = await prisma.radioStation.upsert({
    where: { id: 'default-radio' },
    update: {},
    create: {
      id: 'default-radio',
      name: 'ZyloFM Radio',
      streamUrl: 'https://stream.zeno.fm/example',
      genre: 'Electronic',
      description: 'La mejor música electrónica 24/7',
      isActive: true,
      isDefault: true,
      sortOrder: 0,
    },
  });

  console.log('Radio por defecto creada:', defaultRadio?.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

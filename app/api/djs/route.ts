import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';

export const dynamic = 'force-dynamic';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

// GET - Obtener todos los DJs (role = DJ o ADMIN con mixes)
export async function GET() {
  try {
    const djs = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'DJ' },
          { role: 'ADMIN' }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        photoUrl: true,
        instagram: true,
        twitter: true,
        soundcloud: true,
        isActive: true,
        _count: {
          select: { mixes: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const djIds = djs.map(dj => dj.id);
    const mixes = await prisma.mix.findMany({
      where: {
        userId: { in: djIds },
        genreId: { not: null }
      },
      select: {
        userId: true,
        genre: { select: { name: true } }
      }
    });

    const genresByDj = mixes.reduce<Record<string, Record<string, number>>>((acc, mix) => {
      if (!mix.genre?.name) return acc;
      const djMap = acc[mix.userId] || {};
      djMap[mix.genre.name] = (djMap[mix.genre.name] || 0) + 1;
      acc[mix.userId] = djMap;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: djs.map(dj => {
        const genreCounts = genresByDj[dj.id] || {};
        const topGenres = Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);
        return {
          ...dj,
          mixCount: dj._count.mixes,
          genres: topGenres
        };
      })
    });
  } catch (error) {
    console.error('Error fetching DJs:', error);
    try {
      const fallbackDJs = await prisma.user.findMany({
        where: {
          OR: [{ role: 'DJ' }, { role: 'ADMIN' }],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: { mixes: { where: { status: 'PUBLISHED' } } },
          },
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: fallbackDJs.map((dj) => ({
          ...dj,
          bio: null,
          photoUrl: null,
          instagram: null,
          twitter: null,
          soundcloud: null,
          isActive: true,
          mixCount: dj._count.mixes,
          genres: [],
        })),
      });
    } catch (fallbackError) {
      console.error('Fallback fetching DJs failed:', fallbackError);
      return NextResponse.json(
        { success: false, error: { message: 'Error del servidor' } },
        { status: 500 }
      );
    }
  }
}

// POST - Crear nuevo DJ (admin only)
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { email, name, bio, photoUrl, instagram, twitter, soundcloud } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: 'Email es requerido' } },
        { status: 400 }
      );
    }

    // Verificar si existe
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      // Actualizar a DJ
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'DJ', name, bio, photoUrl, instagram, twitter, soundcloud }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Crear nuevo DJ (sin password, solo perfil)
    const bcrypt = await import('bcryptjs');
    const tempPassword = await bcrypt.hash('temp123', 10);
    
    const dj = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: tempPassword,
        role: 'DJ',
        bio,
        photoUrl,
        instagram,
        twitter,
        soundcloud
      }
    });

    return NextResponse.json({ success: true, data: dj });
  } catch (error) {
    console.error('Error creating DJ:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

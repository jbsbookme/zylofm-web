import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

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

// GET - Obtener mixes destacados
export async function GET() {
  try {
    const mixes = await prisma.mix.findMany({
      where: {
        featured: true,
        status: 'PUBLISHED'
      },
      include: {
        user: { select: { id: true, name: true, email: true, photoUrl: true, role: true } },
        genre: { select: { id: true, name: true, slug: true } }
      },
      orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'desc' }],
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: mixes.map(mix => ({
        id: mix.id,
        title: mix.title,
        djName: mix.user.name || mix.user.email.split('@')[0],
        djId: mix.user.id,
        djPhoto: mix.user.photoUrl,
        durationSec: mix.durationSec || 0,
        bpm: mix.bpm ?? null,
        coverUrl: mix.coverUrl,
        hlsUrl: mix.audioUrl || '',
        genre: mix.genre?.name,
        genreId: mix.genre?.id,
        djVerified: mix.user.role === 'DJ' || mix.user.role === 'ADMIN'
      }))
    });
  } catch (error) {
    console.error('Error fetching featured mixes:', error);
    return NextResponse.json({
      success: true,
      data: [],
      warning: 'DB_UNAVAILABLE',
    });
  }
}

// POST - Marcar/desmarcar mix como destacado
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { mixId, featured } = body;

    if (!mixId) {
      return NextResponse.json(
        { success: false, error: { message: 'mixId es requerido' } },
        { status: 400 }
      );
    }

    const mix = await prisma.mix.update({
      where: { id: mixId },
      data: {
        featured: featured ?? true,
        featuredOrder: featured ? (await prisma.mix.count({ where: { featured: true } })) + 1 : null
      }
    });

    return NextResponse.json({ success: true, data: mix });
  } catch (error) {
    console.error('Error updating featured mix:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

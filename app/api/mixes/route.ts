import { NextRequest, NextResponse } from 'next/server';
import { mockMixes } from '@/lib/mock-data';
import { prisma } from '@/lib/db';

// GET /api/mixes - Obtener mixes publicados
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get('ids');
    const ids = idsParam
      ? idsParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    // Obtener mixes reales de la base de datos
    const dbMixes = await prisma.mix.findMany({
      where: {
        status: 'PUBLISHED',
        ...(ids.length > 0 ? { id: { in: ids } } : {}),
      },
      include: {
        user: {
          select: { name: true, email: true, photoUrl: true },
        },
        genre: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar al formato esperado
    const mixes = dbMixes.map((mix) => ({
      id: mix.id,
      title: mix.title,
      djName: mix.user.name || mix.user.email.split('@')[0],
      djPhotoUrl: mix.user.photoUrl || null, // Logo/foto del DJ
      durationSec: mix.durationSec || 0,
      bpm: mix.bpm || null,
      coverUrl: mix.coverUrl || mix.user.photoUrl || '/zylo-logo.png', // Prioridad: coverUrl > djPhotoUrl > logo ZyloFM
      hlsUrl: mix.audioUrl || '',
      genre: mix.genre?.name || null,
      genres: mix.genre ? [mix.genre.name] : [],
      status: mix.status,
    }));

    // Si no hay mixes reales, usar mock data
    if (mixes.length === 0 && ids.length === 0) {
      const fallbackMixes = mockMixes.map((mix) => ({
        ...mix,
        status: 'PUBLISHED',
      }));
      return NextResponse.json({
        success: true,
        data: fallbackMixes,
        isMock: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: mixes,
    });
  } catch (error: any) {
    console.error('Error fetching mixes:', error);
    // Fallback a mock data si hay error
    const fallbackMixes = mockMixes.map((mix) => ({
      ...mix,
      status: 'PUBLISHED',
    }));
    return NextResponse.json({
      success: true,
      data: fallbackMixes,
      isMock: true,
    });
  }
}

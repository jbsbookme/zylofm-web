import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zylofm-jwt-secret-key-2024';

// Verificar usuario admin
function verifyAdmin(req: NextRequest): { valid: boolean; error?: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Token no proporcionado' };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'ADMIN') {
      return { valid: false, error: 'Acceso denegado' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Token inválido' };
  }
}

// GET /api/admin/mixes/pending - Obtener mixes pendientes con metadata completa
export async function GET(request: NextRequest) {
  const auth = verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const all = searchParams.get('all') === 'true';

    const where = all ? {} : { status };

    const mixes = await prisma.mix.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            role: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar para incluir toda la metadata
    const transformedMixes = mixes.map(mix => ({
      id: mix.id,
      title: mix.title,
      description: mix.description,
      coverUrl: mix.coverUrl,
      audioUrl: mix.audioUrl,
      hlsUrl: mix.audioUrl, // Alias para compatibilidad
      durationSec: mix.durationSec,
      bpm: mix.bpm,
      status: mix.status,
      rejectReason: mix.rejectReason,
      featured: mix.featured,
      createdAt: mix.createdAt.toISOString(),
      user: mix.user,
      genre: mix.genre,
      djName: mix.user.name || mix.user.email.split('@')[0],
      djPhotoUrl: mix.user.photoUrl,
    }));

    return NextResponse.json({
      success: true,
      data: transformedMixes,
    });
  } catch (error: any) {
    console.error('Error fetching pending mixes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener mixes' },
      { status: 500 }
    );
  }
}

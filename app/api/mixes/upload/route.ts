import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';

const AUTH_SECRETS = [
  process.env.JWT_SECRET,
  process.env.NEXTAUTH_SECRET,
  'zylofm-jwt-secret-key-2024',
].filter(Boolean) as string[];

// Límite total de mixes por DJ
// TODO: Monetización DJ PRO - ajustar límites por plan
const MAX_MIXES_TOTAL = 200;

function verifyToken(token: string): { userId?: string; sub?: string; role: string } | null {
  for (const secret of AUTH_SECRETS) {
    try {
      return jwt.verify(token, secret) as { userId?: string; sub?: string; role: string };
    } catch {
      continue;
    }
  }
  return null;
}

function verifyUser(req: NextRequest): { valid: boolean; userId?: string; role?: string; error?: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Token no proporcionado' };
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return { valid: false, error: 'Token inválido' };
  }
  const userId = decoded.userId || decoded.sub;
  if (!userId) {
    return { valid: false, error: 'Token inválido' };
  }
  return { valid: true, userId, role: decoded.role };
}

export async function POST(request: NextRequest) {
  const auth = verifyUser(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, cloud_storage_path, durationSec, genreId, coverUrl, audioUrl } = body;

    if (!title || !genreId || (!cloud_storage_path && !audioUrl)) {
      return NextResponse.json(
        { success: false, error: 'Título, género y archivo son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    let user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    // Verificar rol: solo DJ y ADMIN pueden subir
    if (user.role !== 'DJ' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Solo DJs y Admins pueden subir música' },
        { status: 403 }
      );
    }

    // Verificar límite total (solo para DJs, Admin sin límite)
    if (user.role === 'DJ') {
      const totalMixes = await prisma.mix.count({
        where: {
          userId: user.id,
        },
      });

      if (totalMixes >= MAX_MIXES_TOTAL) {
        return NextResponse.json(
          { success: false, error: `Has alcanzado el límite de ${MAX_MIXES_TOTAL} mixes. Elimina uno para subir otro.` },
          { status: 429 }
        );
      }
    }

    // Obtener URL pública del archivo
    const finalAudioUrl = audioUrl || await getFileUrl(cloud_storage_path, true);

    // Crear el mix
    const mix = await prisma.mix.create({
      data: {
        title,
        audioUrl: finalAudioUrl,
        cloudStoragePath: cloud_storage_path || null,
        isPublic: true,
        durationSec: durationSec || null,
        bpm: null,
        coverUrl: coverUrl || '/zylo-logo.png',
        genreId,
        userId: user.id,
        status: user.role === 'DJ' || user.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING',
      },
      include: {
        genre: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: mix,
      message: user.role === 'ADMIN' ? 'Mix publicado' : 'Mix enviado para aprobación',
    });
  } catch (error: any) {
    console.error('Error creating mix:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Error al crear mix' } },
      { status: 500 }
    );
  }
}

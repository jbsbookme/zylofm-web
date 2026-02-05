import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zylofm-jwt-secret-key-2024';

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

// GET /api/admin/djs - Obtener todos los usuarios (DJs y Listeners)
export async function GET(request: NextRequest) {
  const auth = verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        photoUrl: true,
        instagram: true,
        soundcloud: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { mixes: true },
        },
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

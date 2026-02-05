import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

function verifyUser(req: NextRequest): { valid: boolean; userId?: string; error?: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Token no proporcionado' };
  }
  const token = authHeader.slice(7).trim();
  if (!token || token === 'null' || token === 'undefined') {
    return { valid: false, error: 'Token no proporcionado' };
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; id?: string; userId?: string };
    const userId = decoded.sub || decoded.id || decoded.userId;
    if (!userId) {
      return { valid: false, error: 'Token inválido' };
    }
    return { valid: true, userId };
  } catch {
    return { valid: false, error: 'Token inválido' };
  }
}

// GET /api/mixes/my-uploads-today - Obtener cantidad de subidas del usuario hoy
export async function GET(request: NextRequest) {
  const auth = verifyUser(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    // Obtener inicio del día actual (UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.mix.count({
      where: {
        userId: auth.userId,
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({
      success: true,
      count,
      date: today.toISOString(),
    });
  } catch (error: any) {
    console.error('Error counting uploads:', error);
    return NextResponse.json(
      { success: false, error: 'Error al contar subidas' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

function verifyUser(req: NextRequest): { valid: boolean; userId?: string; error?: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Token no proporcionado' };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { valid: true, userId: decoded.userId };
  } catch {
    return { valid: false, error: 'Token inválido' };
  }
}

// GET /api/mixes/my-count - Obtener cantidad total de mixes del usuario
export async function GET(request: NextRequest) {
  const auth = verifyUser(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const count = await prisma.mix.count({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching mix count:', error);
    return NextResponse.json(
      { success: true, count: 0, warning: 'DB_UNAVAILABLE' },
      { status: 200 }
    );
  }
}

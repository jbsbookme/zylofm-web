import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';
const JWT_REFRESH_SECRET = `${JWT_ACCESS_SECRET}-refresh`;
const JWT_ACCESS_TTL = 3600; // 1 hora
const JWT_REFRESH_TTL = 2592000; // 30 días

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = body?.refreshToken as string | undefined;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Refresh token requerido' } },
        { status: 400 }
      );
    }

    let decoded: { sub?: string; id?: string; userId?: string; role?: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as typeof decoded;
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido' } },
        { status: 401 }
      );
    }

    const userId = decoded.sub || decoded.id || decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_TTL }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_TTL }
    );

    return NextResponse.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresInSec: JWT_ACCESS_TTL,
        },
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const prismaClient = prisma as typeof prisma & { user: any; djProActivationLog: any };

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';
const PROMO_CODE = process.env.ADMIN_PROMO_CODE || '';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role?: string };
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { code } = body || {};

    if (!PROMO_CODE || code !== PROMO_CODE) {
      return NextResponse.json(
        { success: false, error: { message: 'Código inválido' } },
        { status: 403 }
      );
    }

    const result = await prismaClient.user.updateMany({
      where: { role: 'DJ' },
      data: { djPlan: 'PRO' },
    });

    let adminUserId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { sub?: string; id?: string };
        adminUserId = decoded.sub || decoded.id || null;
      } catch {
        adminUserId = null;
      }
    }

    await prismaClient.djProActivationLog?.create?.({
      data: {
        adminUserId: adminUserId || 'unknown',
        updatedCount: result.count,
      },
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
      message: 'DJ PRO activado para DJs existentes',
    });
  } catch (error) {
    console.error('Error activating DJ PRO:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

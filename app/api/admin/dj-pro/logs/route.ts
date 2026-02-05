import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

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

const prismaClient = prisma as typeof prisma & { djProActivationLog: any };

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const logs = await prismaClient.djProActivationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching DJ PRO logs:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

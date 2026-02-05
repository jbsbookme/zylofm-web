import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const prismaClient = prisma as typeof prisma & { djRequest: any };

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role?: string };
      return decoded.role === 'ADMIN';
    } catch {
      return false;
    }
  }

  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { role?: string } | undefined;
  return sessionUser?.role === 'ADMIN';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const action = body?.action as 'APPROVE' | 'REJECT' | undefined;

  if (!action) {
    return NextResponse.json(
      { success: false, error: { message: 'Acción requerida' } },
      { status: 400 }
    );
  }

  try {
    const existing = await prismaClient.djRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Solicitud no encontrada' } },
        { status: 404 }
      );
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { message: 'Solicitud ya procesada' } },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      const [updatedRequest] = await prisma.$transaction([
        prismaClient.djRequest.update({
          where: { id },
          data: { status: 'APPROVED', reviewedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: existing.userId },
          data: { role: 'DJ' },
        }),
      ]);

      return NextResponse.json({ success: true, data: updatedRequest });
    }

    const updated = await prismaClient.djRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error processing DJ request:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

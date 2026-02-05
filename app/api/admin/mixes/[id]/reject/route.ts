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

// POST /api/admin/mixes/[id]/reject - Rechazar mix con razón
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Verificar que el mix existe
    const mix = await prisma.mix.findUnique({ where: { id } });
    if (!mix) {
      return NextResponse.json(
        { success: false, error: 'Mix no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar estado a rechazado
    const updatedMix = await prisma.mix.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectReason: reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMix,
      message: 'Mix rechazado',
    });
  } catch (error: any) {
    console.error('Error rejecting mix:', error);
    return NextResponse.json(
      { success: false, error: 'Error al rechazar mix' },
      { status: 500 }
    );
  }
}

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

// PUT /api/admin/djs/[id] - Actualizar usuario/DJ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, bio, photoUrl, instagram, soundcloud, isActive, role } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(instagram !== undefined && { instagram }),
        ...(soundcloud !== undefined && { soundcloud }),
        ...(isActive !== undefined && { isActive }),
        ...(role !== undefined && { role }),
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

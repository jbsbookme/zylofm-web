import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

// Verificar usuario admin
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

// GET /api/banners/[id] - Obtener banner por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await prisma.banner.findUnique({ where: { id } });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener banner' },
      { status: 500 }
    );
  }
}

// PUT /api/banners/[id] - Actualizar banner (admin)
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
    const { title, imageUrl, linkUrl, position, sortOrder, isActive, startDate, endDate } = body;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
        ...(position !== undefined && { position }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });

    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar banner' },
      { status: 500 }
    );
  }
}

// DELETE /api/banners/[id] - Eliminar banner (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Banner eliminado' });
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar banner' },
      { status: 500 }
    );
  }
}

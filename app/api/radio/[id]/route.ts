import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch (err) {
    console.error('JWT verification error:', err);
    return false;
  }
}

// PUT - Actualizar estación de radio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, streamUrl, genre, coverUrl, description, isActive, isDefault } = body;

    // Si es default, quitar default de las demás
    if (isDefault) {
      await prisma.radioStation.updateMany({
        where: { isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    const station = await prisma.radioStation.update({
      where: { id: params.id },
      data: {
        name,
        streamUrl,
        genre,
        coverUrl,
        description,
        isActive,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: station,
    });
  } catch (error: any) {
    console.error('Error updating radio station:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar estación de radio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    await prisma.radioStation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Estación eliminada' },
    });
  } catch (error: any) {
    console.error('Error deleting radio station:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_ACCESS_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

// GET - Obtener un género con sus mixes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const genre = await prisma.genre.findUnique({
      where: { id: params.id },
      include: {
        mixes: {
          where: { status: 'PUBLISHED' },
          include: { user: { select: { id: true, name: true, email: true, photoUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!genre) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Género no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: genre });
  } catch (error) {
    console.error('Error fetching genre:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

// PUT - Actualizar género
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
    const { name, description, coverUrl, isActive, sortOrder } = body;

    const genre = await prisma.genre.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, data: genre });
  } catch (error) {
    console.error('Error updating genre:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar género
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
    // Verificar si tiene mixes
    const mixCount = await prisma.mix.count({ where: { genreId: params.id } });
    
    if (mixCount > 0) {
      // Solo desactivar, no eliminar
      await prisma.genre.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ 
        success: true, 
        message: `Género desactivado (tiene ${mixCount} canciones)` 
      });
    }

    await prisma.genre.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Género eliminado' });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

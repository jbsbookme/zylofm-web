import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';

export const dynamic = 'force-dynamic';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

// GET - Obtener DJ por ID con sus mixes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const dj = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        photoUrl: true,
        instagram: true,
        twitter: true,
        soundcloud: true,
        isActive: true,
        _count: {
          select: { mixes: true }
        }
      }
    });

    if (!dj) {
      return NextResponse.json(
        { success: false, error: { message: 'DJ no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dj,
        mixCount: dj._count.mixes,
      }
    });
  } catch (error) {
    console.error('Error fetching DJ:', error);
    try {
      const fallbackDJ = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: { mixes: true }
          },
        },
      });

      if (!fallbackDJ) {
        return NextResponse.json(
          { success: false, error: { message: 'DJ no encontrado' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...fallbackDJ,
          bio: null,
          photoUrl: null,
          instagram: null,
          twitter: null,
          soundcloud: null,
          isActive: true,
          mixCount: fallbackDJ._count.mixes,
        },
      });
    } catch (fallbackError) {
      console.error('Fallback fetching DJ failed:', fallbackError);
      return NextResponse.json(
        { success: false, error: { message: 'Error del servidor' } },
        { status: 500 }
      );
    }
  }
}

// PUT - Actualizar DJ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, bio, photoUrl, instagram, twitter, soundcloud, role, isActive } = body;

    const dj = await prisma.user.update({
      where: { id },
      data: {
        name,
        bio,
        photoUrl,
        instagram,
        twitter,
        soundcloud,
        role,
        isActive
      }
    });

    return NextResponse.json({ success: true, data: dj });
  } catch (error) {
    console.error('Error updating DJ:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar DJ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting DJ:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

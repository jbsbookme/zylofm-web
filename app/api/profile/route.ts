import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obtener perfil del usuario actual
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const userId = sessionUser?.id;
  const userRole = sessionUser?.role;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }
  if (userRole !== 'LISTENER') {
    return NextResponse.json(
      { success: false, error: { message: 'Perfil no disponible para este rol' } },
      { status: 403 }
    );
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
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
        createdAt: true,
        _count: { select: { mixes: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });

  } catch (error) {
    console.error('Error fetching profile:', error);
    try {
      const fallbackUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });

      if (!fallbackUser) {
        return NextResponse.json(
          { success: false, error: { message: 'Usuario no encontrado' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...fallbackUser,
          bio: null,
          photoUrl: null,
          instagram: null,
          twitter: null,
          soundcloud: null,
          isActive: true,
        },
      });
    } catch (fallbackError) {
      console.error('Fallback profile fetch failed:', fallbackError);
      return NextResponse.json({
        success: true,
        data: {
          id: userId,
          name: null,
          email: '',
          role: sessionUser?.role ?? 'LISTENER',
          bio: null,
          photoUrl: null,
          instagram: null,
          twitter: null,
          soundcloud: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          _count: { mixes: 0 },
        },
      });
    }
  }
}

// PUT - Actualizar perfil del usuario actual
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const userId = sessionUser?.id;
  const userRole = sessionUser?.role;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }
  if (userRole !== 'LISTENER') {
    return NextResponse.json(
      { success: false, error: { message: 'Perfil no disponible para este rol' } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { photoUrl, name, email } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { photoUrl, name, email },
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
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

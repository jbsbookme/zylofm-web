import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

  if (userRole !== 'DJ' && userRole !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
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
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching DJ profile:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

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

  if (userRole !== 'DJ' && userRole !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, bio, photoUrl, instagram, twitter, soundcloud } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, bio, photoUrl, instagram, twitter, soundcloud },
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
    console.error('Error updating DJ profile:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

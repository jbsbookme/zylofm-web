import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const prismaClient = prisma as typeof prisma & { djRequest: any };

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const userId = sessionUser?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const latest = await prismaClient.djRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: latest ?? null,
    });
  } catch (error) {
    console.error('Error fetching DJ request:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      { success: false, error: { message: 'Solo oyentes pueden solicitar ser DJ' } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      displayName,
      bio,
      location,
      phone,
      instagram,
      twitter,
      soundcloud,
      sampleLink,
    } = body || {};

    if (!displayName || String(displayName).trim().length < 2) {
      return NextResponse.json(
        { success: false, error: { message: 'Nombre artístico requerido' } },
        { status: 400 }
      );
    }

    const existing = await prismaClient.djRequest.findFirst({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const created = await prismaClient.djRequest.create({
      data: {
        userId,
        status: 'PENDING',
        displayName: String(displayName).trim(),
        bio: bio ? String(bio).trim() : null,
        location: location ? String(location).trim() : null,
        phone: phone ? String(phone).trim() : null,
        instagram: instagram ? String(instagram).trim() : null,
        twitter: twitter ? String(twitter).trim() : null,
        soundcloud: soundcloud ? String(soundcloud).trim() : null,
        sampleLink: sampleLink ? String(sampleLink).trim() : null,
      },
    });

    // TODO: enviar email al admin cuando esté configurado SMTP

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating DJ request:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

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

export async function GET(request: NextRequest) {
  const admin = await isAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: { message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const requests = await prismaClient.djRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching DJ requests:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

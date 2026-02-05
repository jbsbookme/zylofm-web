import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';

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

// GET - Obtener todas las estaciones de radio activas
export async function GET() {
  try {
    const stations = await prisma.radioStation.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: stations,
    });
  } catch (error: any) {
    console.error('Error fetching radio stations:', error);
    return NextResponse.json({
      success: true,
      data: [],
      error: { code: 'SERVER_ERROR', message: 'Error del servidor' },
    });
  }
}

// POST - Crear nueva estación de radio (solo admin)
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, streamUrl, genre, coverUrl, description, isDefault } = body;

    if (!name || !streamUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Nombre y URL son requeridos' } },
        { status: 400 }
      );
    }

    // Si es default, quitar default de las demás
    if (isDefault) {
      await prisma.radioStation.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const station = await prisma.radioStation.create({
      data: {
        name,
        streamUrl,
        genre: genre || null,
        coverUrl: coverUrl || null,
        description: description || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: station,
    });
  } catch (error: any) {
    console.error('Error creating radio station:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

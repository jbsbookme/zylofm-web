import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';

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

// GET - Obtener todos los géneros
export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { mixes: { where: { status: 'PUBLISHED' } } }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: genres.map(g => ({
        ...g,
        mixCount: g._count.mixes
      })),
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json({
      success: true,
      data: [],
      warning: 'DB_UNAVAILABLE',
    });
  }
}

// POST - Crear nuevo género (solo admin)
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, coverUrl } = body;

    // Nombre es opcional - usar "Sin nombre" si no se proporciona
    const finalName = name?.trim() || 'Sin nombre';

    // Crear slug desde el nombre
    const baseSlug = finalName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Agregar timestamp para evitar duplicados
    const slug = `${baseSlug}-${Date.now()}`;

    // Verificar si ya existe el nombre exacto (permitir duplicados de "Sin nombre")
    if (finalName !== 'Sin nombre') {
      const existing = await prisma.genre.findFirst({
        where: { name: finalName }
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Ya existe un género con ese nombre' } },
          { status: 400 }
        );
      }
    }

    const maxOrder = await prisma.genre.aggregate({ _max: { sortOrder: true } });

    const genre = await prisma.genre.create({
      data: {
        name: finalName,
        slug,
        description: description?.trim() || null,
        coverUrl: coverUrl?.trim() || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, data: genre });
  } catch (error) {
    console.error('Error creating genre:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

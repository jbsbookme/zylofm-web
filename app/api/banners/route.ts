import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zylofm-jwt-secret-key-2024';

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

// GET /api/banners - Obtener banners activos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const position = searchParams.get('position');

    const now = new Date();
    
    const where = all 
      ? {} 
      : {
          isActive: true,
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        };

    if (position) {
      Object.assign(where, { position });
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({
      success: true,
      data: [],
      warning: 'DB_UNAVAILABLE',
    });
  }
}

// POST /api/banners - Crear banner (admin)
export async function POST(request: NextRequest) {
  const auth = verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, imageUrl, linkUrl, position, sortOrder, isActive, startDate, endDate } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Título e imagen son obligatorios' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl || null,
        position: position || 'HOME',
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear banner' },
      { status: 500 }
    );
  }
}

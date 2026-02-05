import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ensurePresetExists, ensureFoldersExist, ZYLOFM_FOLDERS, ZYLOFM_PRESET } from '@/lib/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'zylofm-jwt-secret-key-2024';

export const dynamic = 'force-dynamic';

function verifyAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role: string };
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

// POST - Inicializar estructura de Cloudinary (preset + carpetas)
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  // Verificar credenciales
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cloudinary no configurado. Faltan variables de entorno: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
      },
      { status: 500 }
    );
  }

  try {
    // Crear preset
    const presetCreated = await ensurePresetExists();

    // Crear carpetas
    const foldersCreated = await ensureFoldersExist();

    return NextResponse.json({
      success: true,
      data: {
        preset: {
          name: ZYLOFM_PRESET,
          created: presetCreated,
        },
        folders: {
          list: Object.values(ZYLOFM_FOLDERS),
          created: foldersCreated,
        },
        message: 'Estructura de Cloudinary inicializada correctamente',
      },
    });
  } catch (error: any) {
    console.error('Error initializing Cloudinary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al inicializar Cloudinary' },
      { status: 500 }
    );
  }
}

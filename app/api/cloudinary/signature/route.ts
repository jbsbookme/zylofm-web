import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  generateUploadSignature,
  ensurePresetExists,
  ensureFoldersExist,
  isValidAudioFormat,
  ZYLOFM_FOLDERS,
  ALLOWED_AUDIO_FORMATS,
  type ZyloFMFolder,
} from '@/lib/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'zylofm-jwt-secret-key-2024';

export const dynamic = 'force-dynamic';

function verifyUser(req: NextRequest): { valid: boolean; userId?: string; role?: string; error?: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Token no proporcionado' };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return { valid: true, userId: decoded.userId, role: decoded.role };
  } catch {
    return { valid: false, error: 'Token inválido' };
  }
}

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const auth = verifyUser(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  // Solo DJ y ADMIN pueden subir
  if (auth.role !== 'DJ' && auth.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Solo DJs y Admins pueden subir archivos' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { filename, folder } = body;

    // Validar formato
    if (!filename || !isValidAudioFormat(filename)) {
      return NextResponse.json(
        {
          success: false,
          error: `Formato no permitido. Formatos válidos: ${ALLOWED_AUDIO_FORMATS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validar carpeta
    const validFolders = Object.values(ZYLOFM_FOLDERS);
    const targetFolder: ZyloFMFolder = folder && validFolders.includes(folder)
      ? folder
      : ZYLOFM_FOLDERS.ASSISTANT_LIBRARY;

    // Asegurar que el preset y carpetas existen
    await ensurePresetExists();
    await ensureFoldersExist();

    // Generar firma
    const signatureData = generateUploadSignature(targetFolder);

    return NextResponse.json({
      success: true,
      data: {
        ...signatureData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`,
        allowedFormats: ALLOWED_AUDIO_FORMATS,
      },
    });
  } catch (error: any) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar firma de upload' },
      { status: 500 }
    );
  }
}

// GET - Obtener información de configuración
export async function GET(request: NextRequest) {
  const auth = verifyUser(request);
  if (!auth.valid || (auth.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      folders: ZYLOFM_FOLDERS,
      allowedFormats: ALLOWED_AUDIO_FORMATS,
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    },
  });
}

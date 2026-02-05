import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { ensureFolderExists, ensurePresetExists, generateUploadSignature, ZYLOFM_FOLDERS } from '@/lib/cloudinary';
import { prisma } from '@/lib/db';

const AUTH_SECRETS = [
  process.env.JWT_SECRET,
  process.env.NEXTAUTH_SECRET,
  'zylofm-jwt-secret-key-2024',
].filter(Boolean) as string[];

function verifyToken(token: string): { sub: string; role: string } | null {
  for (const secret of AUTH_SECRETS) {
    try {
      return jwt.verify(token, secret) as { sub: string; role: string };
    } catch {
      continue;
    }
  }
  return null;
}

function verifyUser(request: NextRequest): { sub: string; role: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  return verifyToken(token);
}

export async function POST(request: NextRequest) {
  const user = verifyUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { fileName, contentType, isPublic = true, genre } = body;

    if (!fileName || !contentType || !genre) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'fileName, contentType y genre son requeridos' } },
        { status: 400 }
      );
    }

    // Solo permitir archivos de audio
    if (!contentType.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Solo se permiten archivos de audio' } },
        { status: 400 }
      );
    }

    const genreRecord = await prisma.genre.findUnique({ where: { slug: genre } });
    if (!genreRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_GENRE', message: 'Género inválido' } },
        { status: 400 }
      );
    }

    if (!process.env.AWS_BUCKET_NAME) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return NextResponse.json(
          { success: false, error: { code: 'UPLOAD_NOT_CONFIGURED', message: 'Storage no configurado' } },
          { status: 500 }
        );
      }

      await ensurePresetExists();
      await ensureFolderExists(ZYLOFM_FOLDERS.MIXES);
      const signatureData = generateUploadSignature(ZYLOFM_FOLDERS.MIXES);

      return NextResponse.json({
        success: true,
        provider: 'cloudinary',
        data: {
          ...signatureData,
          uploadUrl: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`,
        },
      });
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic,
      genre // Pasar género para organizar por carpetas
    );

    return NextResponse.json({
      success: true,
      provider: 's3',
      data: { uploadUrl, cloud_storage_path },
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}

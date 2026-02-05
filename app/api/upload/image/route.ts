import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateImageUploadSignature, ensureFolderExists, ZYLOFM_IMAGE_FOLDERS } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;
  if (!sessionUser?.id) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Nombre y tipo de archivo requeridos' },
        { status: 400 }
      );
    }

    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Solo se permiten imágenes' },
        { status: 400 }
      );
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Cloudinary no está configurado' },
        { status: 500 }
      );
    }

    const targetFolder = ZYLOFM_IMAGE_FOLDERS.PROFILE_PHOTOS;
    await ensureFolderExists(targetFolder);
    const signatureData = generateImageUploadSignature(targetFolder);

    return NextResponse.json({
      success: true,
      provider: 'cloudinary',
      data: {
        ...signatureData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
      },
    });
  } catch (error: any) {
    console.error('Error generating image upload URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar URL de subida',
        details: {
          message: error?.message || 'Unknown error',
          name: error?.name,
          code: error?.code,
        },
      },
      { status: 500 }
    );
  }
}

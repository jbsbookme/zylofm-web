import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Estructura de carpetas de ZyloFM
export const ZYLOFM_FOLDERS = {
  ASSISTANT_LIBRARY: 'zylofm/assistant_library',
  DJS: 'zylofm/djs',
  SHOWS: 'zylofm/shows',
  RADIO_IDS: 'zylofm/radio_ids',
  COVERS: 'zylofm/covers',
  MIXES: 'zylofm/mixes',
} as const;

export const ZYLOFM_IMAGE_FOLDERS = {
  PROFILE_PHOTOS: 'zylofm/profile_photos',
} as const;

export type ZyloFMFolder = typeof ZYLOFM_FOLDERS[keyof typeof ZYLOFM_FOLDERS];
export type ZyloFMImageFolder = typeof ZYLOFM_IMAGE_FOLDERS[keyof typeof ZYLOFM_IMAGE_FOLDERS];

// Formatos de audio permitidos
export const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'aac'];

// Preset name
export const ZYLOFM_PRESET = 'zylofm_audio';

// Crear o actualizar preset programáticamente
export async function ensurePresetExists(): Promise<boolean> {
  try {
    // Intentar obtener el preset existente
    const presets = await cloudinary.api.upload_presets();
    const existingPreset = presets.presets?.find((p: any) => p.name === ZYLOFM_PRESET);

    if (!existingPreset) {
      // Crear preset si no existe
      await cloudinary.api.create_upload_preset({
        name: ZYLOFM_PRESET,
        unsigned: false,
        folder: ZYLOFM_FOLDERS.MIXES,
        resource_type: 'video', // 'video' para archivos de audio en Cloudinary
        allowed_formats: ALLOWED_AUDIO_FORMATS.join(','),
        overwrite: false,
        unique_filename: true,
        use_filename: true,
      });
      console.log(`Preset "${ZYLOFM_PRESET}" creado exitosamente`);
    }
    return true;
  } catch (error: any) {
    // Si el preset ya existe, está bien
    if (error?.error?.http_code === 409) {
      return true;
    }
    console.error('Error al verificar/crear preset:', error);
    return false;
  }
}

// Crear carpetas en Cloudinary si no existen
export async function ensureFoldersExist(): Promise<boolean> {
  try {
    for (const folder of Object.values(ZYLOFM_FOLDERS)) {
      try {
        await cloudinary.api.create_folder(folder);
      } catch (err: any) {
        // Ignorar si la carpeta ya existe
        if (err?.error?.http_code !== 409) {
          console.log(`Carpeta ${folder} ya existe o creada`);
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error al crear carpetas:', error);
    return false;
  }
}

export async function ensureFolderExists(folder: string): Promise<boolean> {
  try {
    await cloudinary.api.create_folder(folder);
    return true;
  } catch (err: any) {
    if (err?.error?.http_code === 409) {
      return true;
    }
    console.error('Error al crear carpeta:', err);
    return false;
  }
}

// Generar firma para upload seguro desde el cliente
export function generateUploadSignature(folder: ZyloFMFolder, publicId?: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params: Record<string, any> = {
    timestamp,
    folder,
    upload_preset: ZYLOFM_PRESET,
  };

  if (publicId) {
    params.public_id = publicId;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
    uploadPreset: ZYLOFM_PRESET,
  };
}

export function generateImageUploadSignature(folder: ZyloFMImageFolder, publicId?: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const params: Record<string, any> = {
    timestamp,
    folder,
  };

  if (publicId) {
    params.public_id = publicId;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}

// Subir archivo directamente desde el servidor
export async function uploadAudio(
  filePath: string | Buffer,
  folder: ZyloFMFolder,
  options?: {
    publicId?: string;
    tags?: string[];
  }
) {
  try {
    const result = await cloudinary.uploader.upload(filePath as string, {
      resource_type: 'video',
      folder,
      public_id: options?.publicId,
      tags: options?.tags,
      allowed_formats: ALLOWED_AUDIO_FORMATS,
    });

    return {
      success: true,
      data: {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        url: result.url,
        format: result.format,
        duration: result.duration,
        bytes: result.bytes,
        folder: result.folder,
      },
    };
  } catch (error: any) {
    console.error('Error al subir audio:', error);
    return {
      success: false,
      error: error.message || 'Error al subir archivo',
    };
  }
}

// Eliminar archivo de Cloudinary
export async function deleteAudio(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
    return { success: result.result === 'ok' };
  } catch (error: any) {
    console.error('Error al eliminar audio:', error);
    return { success: false, error: error.message };
  }
}

// Obtener archivos de una carpeta
export async function getFilesFromFolder(folder: ZyloFMFolder, options?: {
  maxResults?: number;
  nextCursor?: string;
}) {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      prefix: folder,
      max_results: options?.maxResults || 50,
      next_cursor: options?.nextCursor,
    });

    return {
      success: true,
      data: {
        resources: result.resources,
        nextCursor: result.next_cursor,
        totalCount: result.rate_limit_allowed,
      },
    };
  } catch (error: any) {
    console.error('Error al obtener archivos:', error);
    return { success: false, error: error.message };
  }
}

// Validar formato de archivo
export function isValidAudioFormat(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_AUDIO_FORMATS.includes(ext) : false;
}

// Obtener URL segura de un archivo
export function getSecureUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
  });
}

export default cloudinary;

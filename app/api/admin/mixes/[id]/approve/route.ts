import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret';

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
      { status: 401 }
    );
  }

  const mixId = params.id;
  
  // En producción, aquí actualizarías el estado del mix en la DB
  console.log(`Mix ${mixId} aprobado`);

  return NextResponse.json({
    success: true,
    data: { id: mixId, status: 'PUBLISHED' },
  });
}

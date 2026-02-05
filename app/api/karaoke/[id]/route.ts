import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyAdmin(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') return null;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

type RouteContext = { params: Promise<{ id: string }> };

// GET - Get single karaoke track
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const track = await prisma.karaokeTrack.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error fetching karaoke track:', error);
    return NextResponse.json({ error: 'Error fetching track' }, { status: 500 });
  }
}

// PUT - Update karaoke track (Admin only)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const admin = verifyAdmin(token);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { title, artist, audioUrl, cloudStoragePath, coverUrl, lyrics, durationSec, sortOrder, isActive } = body;

    const track = await prisma.karaokeTrack.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(artist && { artist }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(cloudStoragePath !== undefined && { cloudStoragePath }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(lyrics !== undefined && { lyrics }),
        ...(durationSec !== undefined && { durationSec }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error updating karaoke track:', error);
    return NextResponse.json({ error: 'Error updating track' }, { status: 500 });
  }
}

// DELETE - Delete karaoke track (Admin only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const admin = verifyAdmin(token);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.karaokeTrack.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting karaoke track:', error);
    return NextResponse.json({ error: 'Error deleting track' }, { status: 500 });
  }
}

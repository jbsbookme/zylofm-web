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

// GET - List all karaoke tracks
export async function GET() {
  try {
    const tracks = await prisma.karaokeTrack.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching karaoke tracks:', error);
    return NextResponse.json({ error: 'Error fetching tracks' }, { status: 500 });
  }
}

// POST - Create new karaoke track (Admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, artist, audioUrl, cloudStoragePath, coverUrl, lyrics, durationSec, sortOrder } = body;

    if (!title || !artist) {
      return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 });
    }

    const track = await prisma.karaokeTrack.create({
      data: {
        title,
        artist,
        audioUrl,
        cloudStoragePath,
        coverUrl,
        lyrics,
        durationSec,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error('Error creating karaoke track:', error);
    return NextResponse.json({ error: 'Error creating track' }, { status: 500 });
  }
}

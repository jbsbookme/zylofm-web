import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 12, 50);
  const cursor = searchParams.get('cursor');

  try {
    const mixes = await prisma.mix.findMany({
      where: {
        userId: id,
      },
      include: {
        genre: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = mixes.length > limit;
    const items = hasMore ? mixes.slice(0, limit) : mixes;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      success: true,
      data: items.map((mix) => ({
        id: mix.id,
        title: mix.title,
        description: mix.description,
        audioUrl: mix.audioUrl,
        coverUrl: mix.coverUrl,
        durationSec: mix.durationSec,
        genre: mix.genre,
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching DJ mixes:', error);
    return NextResponse.json({
      success: true,
      data: [],
      nextCursor: null,
      hasMore: false,
      warning: 'DB_UNAVAILABLE',
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, searchSinglePlatform } from '@/lib/search';
import { Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getLimit(frequency: string): number {
  switch (frequency) {
    case '1h': return 10;
    case '6h': return 20;
    case '24h': return 30;
    case '7d': return 50;
    case '30d': return 80;
    default: return 10;
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'PERPLEXITY_API_KEY not configured', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;
  const frequency = searchParams.get('freq') || '1h';
  const limit = getLimit(frequency);

  try {
    const mentions = platform && platform !== 'all'
      ? await searchSinglePlatform(apiKey, platform)
      : await searchAllPlatforms(apiKey);

    return NextResponse.json({
      mentions: mentions.slice(0, limit),
      platform: platform || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mentions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentions', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

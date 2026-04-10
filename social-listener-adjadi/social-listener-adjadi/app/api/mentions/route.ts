import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, searchSinglePlatform } from '@/lib/search';
import { Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'TAVILY_API_KEY not configured', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;

  try {
    let mentions;
    if (platform && platform !== 'all') {
      mentions = await searchSinglePlatform(apiKey, platform);
    } else {
      mentions = await searchAllPlatforms(apiKey);
    }

    return NextResponse.json({
      mentions,
      platform: platform || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mentions API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mentions',
        mentions: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

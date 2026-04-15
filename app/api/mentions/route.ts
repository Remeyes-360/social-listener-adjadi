import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, searchSinglePlatform } from '@/lib/search';
import { Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'FIRECRAWL_API_KEY not configured', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  // Test Firecrawl directement
  const testRes = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query: 'Olushegun ADJADI BAKARI', limit: 2 }),
  });
  const testBody = await testRes.text();

  if (!testRes.ok) {
    return NextResponse.json({
      error: `Firecrawl test failed: ${testRes.status}`,
      detail: testBody,
      key_prefix: apiKey.slice(0, 8),
      mentions: [],
      timestamp: new Date().toISOString(),
    });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;

  try {
    const mentions = platform && platform !== 'all'
      ? await searchSinglePlatform(apiKey, platform)
      : await searchAllPlatforms(apiKey);

    return NextResponse.json({ mentions, platform: platform || 'all', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mentions', mentions: [], timestamp: new Date().toISOString() }, { status: 500 });
  }
}

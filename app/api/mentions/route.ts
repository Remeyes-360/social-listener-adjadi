import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, searchSinglePlatform } from '@/lib/search';
import { searchAllSocialPlatforms } from '@/lib/connectors';
import { Platform, RawMention } from '@/lib/types';

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

function deduplicateMentions(mentions: RawMention[]): RawMention[] {
  const seen = new Set<string>();
  return mentions.filter((m) => {
    const key = m.url || m.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
    // Lancer en parallele : Perplexity (web) + connecteurs natifs (API sociales)
    const [perplexityMentions, nativeMentions] = await Promise.allSettled([
      platform
        ? searchSinglePlatform(apiKey, platform)
        : searchAllPlatforms(apiKey),
      searchAllSocialPlatforms(platform || undefined),
    ]);

    const allMentions: RawMention[] = [
      ...(perplexityMentions.status === 'fulfilled' ? perplexityMentions.value : []),
      ...(nativeMentions.status === 'fulfilled' ? nativeMentions.value : []),
    ];

    // Deduplication par URL
    const unique = deduplicateMentions(allMentions);

    // Log des erreurs eventuelles
    if (perplexityMentions.status === 'rejected') {
      console.error('Perplexity search failed:', perplexityMentions.reason);
    }
    if (nativeMentions.status === 'rejected') {
      console.error('Native connectors failed:', nativeMentions.reason);
    }

    return NextResponse.json({
      mentions: unique.slice(0, limit * 5),
      timestamp: new Date().toISOString(),
      sources: {
        perplexity: perplexityMentions.status === 'fulfilled' ? perplexityMentions.value.length : 0,
        native: nativeMentions.status === 'fulfilled' ? nativeMentions.value.length : 0,
      },
    });
  } catch (error) {
    console.error('Mentions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

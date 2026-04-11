import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms, searchSinglePlatform } from '@/lib/search';
import { fetchAllPlatformMentions, fetchPlatformMentions, getConfiguredPlatforms } from '@/lib/connectors/index';
import { Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;
  const forceReal = searchParams.get('real') === 'true';

  // Détermine les plateformes configurées avec de vraies APIs
  const configuredPlatforms = getConfiguredPlatforms();
  const hasSocialApis = configuredPlatforms.length > 0;

  try {
    let mentions;
    let source: 'social-apis' | 'tavily-fallback';

    if (hasSocialApis && (forceReal || !process.env.TAVILY_API_KEY)) {
      // Mode APIs sociales réelles
      source = 'social-apis';
      if (platform && platform !== 'all') {
        mentions = await fetchPlatformMentions(platform, 20);
      } else {
        mentions = await fetchAllPlatformMentions(20);
      }
    } else if (process.env.TAVILY_API_KEY) {
      // Mode Tavily (fallback ou si pas d'APIs sociales)
      source = 'tavily-fallback';
      const apiKey = process.env.TAVILY_API_KEY;
      if (platform && platform !== 'all') {
        mentions = await searchSinglePlatform(apiKey, platform);
      } else {
        mentions = await searchAllPlatforms(apiKey);
      }
    } else {
      return NextResponse.json(
        {
          error: 'Aucune API configurée. Veuillez configurer TAVILY_API_KEY ou les APIs sociales.',
          configuredPlatforms,
          mentions: [],
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mentions,
      platform: platform || 'all',
      timestamp: new Date().toISOString(),
      source,
      configuredPlatforms,
    });
  } catch (error) {
    console.error('Mentions API error:', error);
    return NextResponse.json(
      {
        error: String(error),
        mentions: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

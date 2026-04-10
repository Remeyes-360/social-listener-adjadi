import { RawMention, Platform } from './types';
import { PLATFORMS, SUBJECT_NAME } from './platforms';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  url: string;
  title: string;
  content: string;
  published_date?: string;
  score?: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
}

function detectPlatform(url: string): Platform {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'twitter'; // fallback
}

async function searchPlatform(
  apiKey: string,
  platform: Platform,
  query: string
): Promise<RawMention[]> {
  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: 8,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Tavily error for ${platform}:`, err);
      return [];
    }

    const data: TavilyResponse = await response.json();

    return (data.results || []).map((result, idx) => ({
      id: `${platform}-${Date.now()}-${idx}`,
      url: result.url,
      title: result.title || 'Sans titre',
      content: result.content || '',
      platform: detectPlatform(result.url),
      publishedDate: result.published_date,
      score: result.score,
    }));
  } catch (error) {
    console.error(`Search error for ${platform}:`, error);
    return [];
  }
}

export async function searchAllPlatforms(apiKey: string): Promise<RawMention[]> {
  const platformSearches = PLATFORMS.map((p) => searchPlatform(apiKey, p.id, p.query));
  const results = await Promise.all(platformSearches);
  return results.flat();
}

export async function searchSinglePlatform(apiKey: string, platformId: Platform): Promise<RawMention[]> {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return [];
  return searchPlatform(apiKey, platform.id, platform.query);
}

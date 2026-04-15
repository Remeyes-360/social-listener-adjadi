import { RawMention, Platform } from './types';
import { PLATFORMS } from './platforms';

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/search';

interface FirecrawlResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
  publishedDate?: string;
  score?: number;
}

interface FirecrawlResponse {
  data: FirecrawlResult[];
  success: boolean;
}

function detectPlatform(url: string): Platform {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'twitter';
}

async function searchPlatform(apiKey: string, platform: Platform, query: string): Promise<RawMention[]> {
  try {
    const response = await fetch(FIRECRAWL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, limit: 8, lang: 'fr', scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!response.ok) { console.error(`Firecrawl error for ${platform}:`, await response.text()); return []; }
    const data: FirecrawlResponse = await response.json();
    if (!data.success || !data.data) return [];
    return data.data.map((result, idx) => ({
      id: `${platform}-${Date.now()}-${idx}`,
      url: result.url,
      title: result.title || 'Sans titre',
      content: result.description || result.markdown?.slice(0, 500) || '',
      platform: detectPlatform(result.url),
      publishedDate: result.publishedDate,
      score: result.score,
    }));
  } catch (error) { console.error(`Search error for ${platform}:`, error); return []; }
}

export async function searchAllPlatforms(apiKey: string): Promise<RawMention[]> {
  const results = await Promise.all(PLATFORMS.map((p) => searchPlatform(apiKey, p.id, p.query)));
  return results.flat();
}

export async function searchSinglePlatform(apiKey: string, platformId: Platform): Promise<RawMention[]> {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return [];
  return searchPlatform(apiKey, platform.id, platform.query);
}

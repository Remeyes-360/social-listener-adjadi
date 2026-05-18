import { RawMention, Platform } from './types';
import { PLATFORMS, SUBJECT_VARIANTS } from './platforms';

const PERPLEXITY_SEARCH_URL = 'https://api.perplexity.ai/search';

function detectPlatform(url: string): Platform {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'twitter';
}

/**
 * Verifie si un texte contient au moins une des variantes de nom a surveiller.
 * La comparaison est insensible a la casse.
 */
function isRelevantMention(text: string): boolean {
  const lower = text.toLowerCase();
  return SUBJECT_VARIANTS.some((variant) => lower.includes(variant.toLowerCase()));
}

async function searchPlatform(
  apiKey: string,
  platform: Platform,
  query: string
): Promise<RawMention[]> {
  try {
    const response = await fetch(PERPLEXITY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: 10,
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Perplexity search error for ${platform}:`, response.status, errText);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`No results for ${platform} query: ${query}`);
      return [];
    }

    // Filtrer: ne garder que les resultats qui mentionnent reellement l'une des variantes
    const filtered = results.filter((result: { url?: string; title?: string; snippet?: string }) => {
      const combinedText = `${result.title || ''} ${result.snippet || ''}`;
      return isRelevantMention(combinedText);
    });

    if (filtered.length === 0) {
      console.warn(`No relevant mentions for ${platform} after filtering.`);
      return [];
    }

    return filtered.slice(0, 8).map((result: { url?: string; title?: string; snippet?: string; date?: string }, idx: number) => ({
      id: `${platform}-${Date.now()}-${idx}`,
      url: result.url || `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
      title: result.title || 'Sans titre',
      content: result.snippet || '',
      platform: detectPlatform(result.url || ''),
      publishedDate: result.date,
      score: 1,
    }));
  } catch (error) {
    console.error(`Search error for ${platform}:`, error);
    return [];
  }
}

export async function searchAllPlatforms(apiKey: string): Promise<RawMention[]> {
  const results = await Promise.all(
    PLATFORMS.map((p) => searchPlatform(apiKey, p.id, p.query))
  );
  return results.flat();
}

export async function searchSinglePlatform(apiKey: string, platformId: Platform): Promise<RawMention[]> {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return [];
  return searchPlatform(apiKey, platform.id, platform.query);
}

import { RawMention, Platform, PlatformConfig } from './types';
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
 * Normalize a string by removing diacritics and lowercasing.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifie si un texte contient au moins une variante de nom.
 * Utilise normalize() pour comparer sans tenir compte des accents.
 */
function isRelevantMention(text: string): boolean {
  const normalizedText = normalize(text);
  return SUBJECT_VARIANTS.some((v) => normalizedText.includes(normalize(v)));
}

async function searchPlatform(
  apiKey: string,
  platform: PlatformConfig
): Promise<RawMention[]> {
  try {
    const body: Record<string, unknown> = {
      query: platform.query,
      max_results: 10,
      search_recency_filter: 'week',
    };

    // Utiliser search_domain_filter si des domaines sont definis
    if (platform.domains && platform.domains.length > 0) {
      body.search_domain_filter = platform.domains;
    }

    const response = await fetch(PERPLEXITY_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Perplexity search error for ${platform.id}:`, response.status, errText);
      return [];
    }

    const data = await response.json();
    const results: Array<{ url?: string; title?: string; snippet?: string; date?: string }> = data.results || [];

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`No results for ${platform.id}`);
      return [];
    }

    // Mapper les resultats en RawMention
    const mapped: RawMention[] = results.slice(0, 8).map((result, idx) => ({
      id: `${platform.id}-${Date.now()}-${idx}`,
      url: result.url || `https://perplexity.ai/search?q=${encodeURIComponent(platform.query)}`,
      title: result.title || 'Sans titre',
      content: result.snippet || '',
      platform: detectPlatform(result.url || ''),
      publishedDate: result.date,
      score: 1,
    }));

    // Post-filtrage : ne garder que les resultats qui mentionnent une variante
    // On accepte aussi les resultats sans snippet (titre seul) si le titre correspond
    const filtered = mapped.filter((m) => {
      const textToCheck = `${m.title || ''} ${m.content || ''}`;
      // Si le texte est trop court pour filtrer, on accepte (requete suffisamment ciblee)
      if (textToCheck.trim().length < 30) return true;
      return isRelevantMention(textToCheck);
    });

    console.log(`Platform ${platform.id}: ${results.length} results, ${filtered.length} after filter`);

    return filtered;
  } catch (error) {
    console.error(`Search error for ${platform.id}:`, error);
    return [];
  }
}

export async function searchAllPlatforms(apiKey: string): Promise<RawMention[]> {
  const results = await Promise.all(
    PLATFORMS.map((p) => searchPlatform(apiKey, p))
  );
  return results.flat();
}

export async function searchSinglePlatform(apiKey: string, platformId: Platform): Promise<RawMention[]> {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return [];
  return searchPlatform(apiKey, platform);
}

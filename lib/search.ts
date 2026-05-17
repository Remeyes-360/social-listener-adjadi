import { RawMention, Platform } from './types';
import { PLATFORMS } from './platforms';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

function detectPlatform(url: string): Platform {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'twitter';
}

interface PerplexitySearchResult {
  url: string;
  title?: string;
  snippet?: string;
}

async function searchPlatform(
  apiKey: string,
  platform: Platform,
  query: string
): Promise<RawMention[]> {
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are a social media monitoring assistant. Search for recent mentions and return results in JSON format only.',
          },
          {
            role: 'user',
            content: `Search for recent mentions of "${query}" on social media and news. Return a JSON array of up to 8 results. Each result must have: url (string), title (string), content (string with the relevant excerpt, max 500 chars), publishedDate (ISO date string or empty string). Return ONLY the JSON array, no explanation, no markdown.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        search_recency_filter: 'week',
        return_citations: true,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity search error for ${platform}:`, response.status, await response.text());
      return [];
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '[]';

    // Extract citations from Perplexity response
    const citations: PerplexitySearchResult[] = (data.citations || []).map(
      (url: string, idx: number) => ({ url, title: `Source ${idx + 1}`, snippet: '' })
    );

    // Try to parse the content as JSON array
    let results: Array<{ url: string; title: string; content: string; publishedDate?: string }> = [];
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        results = parsed;
      }
    } catch {
      // Fallback: use citations from Perplexity
      if (citations.length > 0) {
        results = citations.map((c) => ({
          url: c.url,
          title: c.title || 'Sans titre',
          content: c.snippet || raw.slice(0, 300),
        }));
      }
    }

    return results.slice(0, 8).map((result, idx) => ({
      id: `${platform}-${Date.now()}-${idx}`,
      url: result.url || `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
      title: result.title || 'Sans titre',
      content: result.content || '',
      platform: detectPlatform(result.url || ''),
      publishedDate: result.publishedDate,
      score: 1,
    }));
  } catch (error) {
    console.error(`Search error for ${platform}:`, error);
    return [];
  }
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

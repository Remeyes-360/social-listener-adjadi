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

function extractJSON(text: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Find the first [ and last ] to extract the array
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1);
  }
  return cleaned;
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
              'You are a social media monitoring assistant. You MUST respond with a valid JSON array only, no prose, no markdown, no explanation.',
          },
          {
            role: 'user',
            content: `Search for recent mentions of "${query}" on social media and news. Respond with ONLY a JSON array (no markdown, no code blocks, no explanation). Each element must have these exact fields: url (string), title (string), content (string, max 500 chars), publishedDate (ISO date string or empty string ""). Example format: [{"url":"https://example.com","title":"Title","content":"Content here","publishedDate":"2024-01-01"}]. Return up to 8 results.`,
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
      const cleaned = extractJSON(raw);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        results = parsed;
      } else if (citations.length > 0) {
        // Fallback: use citations from Perplexity
        results = citations.map((c) => ({
          url: c.url,
          title: c.title || 'Sans titre',
          content: c.snippet || raw.slice(0, 300),
        }));
      }
    } catch {
      // Fallback: use citations from Perplexity
      if (citations.length > 0) {
        results = citations.map((c) => ({
          url: c.url,
          title: c.title || 'Sans titre',
          content: c.snippet || raw.slice(0, 300),
        }));
      } else {
        console.error(`JSON parse failed for ${platform}. Raw:`, raw.slice(0, 200));
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

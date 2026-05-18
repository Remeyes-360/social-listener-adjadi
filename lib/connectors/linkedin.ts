import { RawMention } from '../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

/**
 * Obtient un access token via Client Credentials Flow.
 * Necessite que l'app LinkedIn ait le scope r_liteprofile autorise.
 */
async function getClientCredentialsToken(
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });
    const response = await fetch(LINKEDIN_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('LinkedIn token error:', err);
      return null;
    }
    const data = await response.json();
    return data.access_token || null;
  } catch (e) {
    console.error('LinkedIn token fetch failed:', e);
    return null;
  }
}

/**
 * Cherche des posts LinkedIn mentionnant le sujet.
 * Utilise un access token existant ou en genere un via client credentials.
 */
export async function searchLinkedIn(
  accessToken: string,
  clientId: string,
  clientSecret: string,
  query: string,
  limit: number = 20
): Promise<RawMention[]> {
  try {
    // Utiliser le token fourni ou en generer un nouveau
    let token = accessToken;
    if (!token && clientId && clientSecret) {
      token = (await getClientCredentialsToken(clientId, clientSecret)) || '';
    }
    if (!token) {
      console.warn('LinkedIn: no access token available');
      return [];
    }

    // Search posts via UGC Posts API
    const searchUrl = `${LINKEDIN_API_BASE}/posts?q=hashtag&hashtag=shegunbakari&count=${Math.min(limit, 50)}`;
    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LinkedIn search error:', response.status, errText);
      return [];
    }

    const data = await response.json();
    const elements: Array<{
      id?: string;
      commentary?: string;
      publishedAt?: number;
      content?: { article?: { title?: string; description?: string; source?: string } };
    }> = data.elements || [];

    return elements.slice(0, limit).map((post, idx) => ({
      id: `linkedin-${post.id || Date.now()}-${idx}`,
      url: post.content?.article?.source || `https://www.linkedin.com/feed/`,
      title: post.content?.article?.title || post.commentary?.substring(0, 100) || 'Post LinkedIn',
      content: post.commentary || post.content?.article?.description || '',
      platform: 'linkedin' as const,
      publishedDate: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      score: 1,
    }));
  } catch (error) {
    console.error('LinkedIn search error:', error);
    return [];
  }
}

// Conserve l'ancienne fonction pour compatibilite
export async function fetchLinkedInOrgPosts(
  organizationId: string,
  accessToken: string,
  count: number = 20
): Promise<RawMention[]> {
  return searchLinkedIn(accessToken, '', '', '', count);
}

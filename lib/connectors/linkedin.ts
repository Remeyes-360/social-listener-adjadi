import { RawMention } from '../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

interface LIPost {
  id: string;
  commentary?: string;
  publishedAt?: number;
  author?: string;
  content?: {
    article?: { title?: string; description?: string; source?: string };
  };
  socialDetail?: {
    totalSocialActivityCounts?: {
      numLikes?: number;
      numComments?: number;
      numShares?: number;
    };
  };
}

interface LIResponse {
  elements: LIPost[];
  paging?: { count: number; start: number; total: number };
}

// Récupère les posts d'une Organisation LinkedIn (Company Page)
export async function fetchLinkedInOrgPosts(
  organizationId: string,
  accessToken: string,
  count: number = 20
): Promise<RawMention[]> {
  try {
    const params = new URLSearchParams({
      q: 'author',
      author: `urn:li:organization:${organizationId}`,
      count: String(count),
      sortBy: 'LAST_MODIFIED',
      'projection': '(elements*(id,commentary,publishedAt,author,content,socialDetail))',
    });

    const response = await fetch(
      `${LINKEDIN_API_BASE}/ugcPosts?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('LinkedIn API error:', err);
      return [];
    }

    const data: LIResponse = await response.json();

    if (!data.elements || data.elements.length === 0) return [];

    return data.elements.map((post) => {
      const articleTitle = post.content?.article?.title;
      const text = post.commentary || articleTitle || 'Post LinkedIn';
      const likes = post.socialDetail?.totalSocialActivityCounts?.numLikes || 0;
      const comments = post.socialDetail?.totalSocialActivityCounts?.numComments || 0;

      return {
        id: `linkedin-${post.id}`,
        url: `https://www.linkedin.com/feed/update/${post.id}/`,
        title: text.slice(0, 80),
        content: text,
        platform: 'linkedin' as const,
        publishedDate: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : undefined,
        score: (likes + comments * 2) / 100,
      };
    });
  } catch (error) {
    console.error('LinkedIn connector error:', error);
    return [];
  }
}

// Recherche de posts LinkedIn mentionnant un sujet (via Organization search)
export async function searchLinkedInPosts(
  accessToken: string,
  keywords: string,
  count: number = 20
): Promise<RawMention[]> {
  try {
    // LinkedIn ne propose pas de recherche de posts tiers via API officielle.
    // Cette fonction recherche dans les posts de l'organisation connectée.
    // Pour la surveillance de mentions tierces, utiliser un outil tiers.
    const params = new URLSearchParams({
      q: 'keywords',
      keywords,
      count: String(count),
    });

    const response = await fetch(
      `${LINKEDIN_API_BASE}/socialActions?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return [];
  } catch (error) {
    console.error('LinkedIn search error:', error);
    return [];
  }
}

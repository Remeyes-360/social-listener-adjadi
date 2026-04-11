import { RawMention } from '../types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

interface FBPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  reactions?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
}

interface FBSearchResult {
  id: string;
  name?: string;
  message?: string;
  created_time?: string;
  link?: string;
}

interface FBResponse {
  data: FBPost[];
  paging?: { cursors: { after: string } };
}

// Recherche de posts publics mentionnant le sujet via Graph API
export async function searchFacebook(
  accessToken: string,
  query: string,
  limit: number = 20
): Promise<RawMention[]> {
  try {
    // Search public posts (requires pages_read_engagement permission)
    const params = new URLSearchParams({
      q: query,
      type: 'post',
      limit: String(limit),
      fields: 'id,message,story,created_time,permalink_url,reactions.summary(true),comments.summary(true)',
      access_token: accessToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/search?${params}`
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Facebook API error:', err);
      return [];
    }

    const data: FBResponse = await response.json();

    if (!data.data || data.data.length === 0) return [];

    return data.data.map((post, idx) => ({
      id: `facebook-${post.id}`,
      url: post.permalink_url || `https://facebook.com/${post.id}`,
      title: (post.message || post.story || 'Post Facebook').slice(0, 80),
      content: post.message || post.story || '',
      platform: 'facebook' as const,
      publishedDate: post.created_time,
      score: post.reactions
        ? (post.reactions.summary.total_count +
            (post.comments?.summary.total_count || 0) * 2) /
          100
        : undefined,
    }));
  } catch (error) {
    console.error('Facebook connector error:', error);
    return [];
  }
}

// Récupère les posts d'une Page Facebook spécifique
export async function fetchPagePosts(
  pageId: string,
  accessToken: string,
  limit: number = 20
): Promise<RawMention[]> {
  try {
    const params = new URLSearchParams({
      fields: 'id,message,story,created_time,permalink_url,reactions.summary(true),comments.summary(true)',
      limit: String(limit),
      access_token: accessToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${pageId}/posts?${params}`
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Facebook Page API error:', err);
      return [];
    }

    const data: FBResponse = await response.json();

    if (!data.data || data.data.length === 0) return [];

    return data.data.map((post) => ({
      id: `facebook-${post.id}`,
      url: post.permalink_url || `https://facebook.com/${post.id}`,
      title: (post.message || post.story || 'Post Page').slice(0, 80),
      content: post.message || post.story || '',
      platform: 'facebook' as const,
      publishedDate: post.created_time,
      score: post.reactions
        ? (post.reactions.summary.total_count +
            (post.comments?.summary.total_count || 0) * 2) /
          100
        : undefined,
    }));
  } catch (error) {
    console.error('Facebook Page connector error:', error);
    return [];
  }
}

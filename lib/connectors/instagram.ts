import { RawMention } from '../types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

interface IGMedia {
  id: string;
  caption?: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  username?: string;
}

interface IGResponse {
  data: IGMedia[];
  paging?: object;
}

// Récupère les médias récents d'un compte Instagram Business
export async function fetchInstagramMedia(
  igUserId: string,
  accessToken: string,
  limit: number = 20
): Promise<RawMention[]> {
  try {
    const params = new URLSearchParams({
      fields: 'id,caption,media_type,permalink,timestamp,like_count,comments_count,username',
      limit: String(limit),
      access_token: accessToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${igUserId}/media?${params}`
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Instagram API error:', err);
      return [];
    }

    const data: IGResponse = await response.json();

    if (!data.data || data.data.length === 0) return [];

    return data.data.map((media) => ({
      id: `instagram-${media.id}`,
      url: media.permalink,
      title: (media.caption || `Post Instagram ${media.media_type}`).slice(0, 80),
      content: media.caption || '',
      platform: 'instagram' as const,
      publishedDate: media.timestamp,
      score: media.like_count
        ? (media.like_count + (media.comments_count || 0) * 2) / 100
        : undefined,
    }));
  } catch (error) {
    console.error('Instagram connector error:', error);
    return [];
  }
}

// Recherche de hashtag sur Instagram (hashtag search API)
export async function searchInstagramHashtag(
  igUserId: string,
  accessToken: string,
  hashtag: string,
  limit: number = 20
): Promise<RawMention[]> {
  try {
    // Étape 1 : obtenir l'ID du hashtag
    const hashtagParams = new URLSearchParams({
      user_id: igUserId,
      q: hashtag.replace('#', ''),
      access_token: accessToken,
    });

    const hashtagRes = await fetch(
      `${GRAPH_API_BASE}/ig_hashtag_search?${hashtagParams}`
    );

    if (!hashtagRes.ok) return [];

    const hashtagData = await hashtagRes.json();
    const hashtagId = hashtagData.data?.[0]?.id;
    if (!hashtagId) return [];

    // Étape 2 : récupèrer les top media du hashtag
    const mediaParams = new URLSearchParams({
      user_id: igUserId,
      fields: 'id,caption,permalink,timestamp,like_count,comments_count',
      access_token: accessToken,
    });

    const mediaRes = await fetch(
      `${GRAPH_API_BASE}/${hashtagId}/top_media?${mediaParams}`
    );

    if (!mediaRes.ok) return [];

    const mediaData: IGResponse = await mediaRes.json();

    if (!mediaData.data) return [];

    return mediaData.data.slice(0, limit).map((media) => ({
      id: `instagram-hashtag-${media.id}`,
      url: media.permalink || `https://instagram.com/p/${media.id}`,
      title: (media.caption || `#${hashtag}`).slice(0, 80),
      content: media.caption || '',
      platform: 'instagram' as const,
      publishedDate: media.timestamp,
      score: media.like_count
        ? (media.like_count + (media.comments_count || 0) * 2) / 100
        : undefined,
    }));
  } catch (error) {
    console.error('Instagram hashtag connector error:', error);
    return [];
  }
}

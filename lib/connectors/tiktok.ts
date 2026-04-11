import { RawMention } from '../types';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_RESEARCH_BASE = 'https://open-api.tiktok.com/research/v2';

interface TikTokVideo {
  id: string;
  desc?: string;
  createTime?: number;
  author?: { uniqueId?: string; nickname?: string };
  stats?: {
    diggCount?: number;
    shareCount?: number;
    commentCount?: number;
    playCount?: number;
  };
  webVideoUrl?: string;
}

interface TikTokResearchVideo {
  id: string;
  video_description?: string;
  create_time?: number;
  username?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

interface TikTokResearchResponse {
  data?: {
    videos?: TikTokResearchVideo[];
    cursor?: number;
    search_id?: string;
    has_more?: boolean;
  };
  error?: { code: string; message: string };
}

// Recherche de vidéos TikTok via Research API (accès approuvé requis)
export async function searchTikTokVideos(
  clientKey: string,
  accessToken: string,
  keywords: string,
  maxCount: number = 20
): Promise<RawMention[]> {
  try {
    const body = {
      query: {
        and: [
          {
            operation: 'IN',
            field_name: 'keyword',
            field_values: [keywords],
          },
        ],
      },
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, ''),
      end_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      max_count: maxCount,
      fields:
        'id,video_description,create_time,username,like_count,comment_count,share_count,view_count',
    };

    const response = await fetch(`${TIKTOK_RESEARCH_BASE}/video/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('TikTok Research API error:', err);
      return [];
    }

    const data: TikTokResearchResponse = await response.json();

    if (!data.data?.videos || data.data.videos.length === 0) return [];

    return data.data.videos.map((video) => ({
      id: `tiktok-${video.id}`,
      url: `https://www.tiktok.com/@${video.username}/video/${video.id}`,
      title: (video.video_description || 'Vidéo TikTok').slice(0, 80),
      content: video.video_description || '',
      platform: 'tiktok' as const,
      publishedDate: video.create_time
        ? new Date(video.create_time * 1000).toISOString()
        : undefined,
      score: video.like_count
        ? (video.like_count + (video.comment_count || 0) * 2 + (video.share_count || 0) * 3) / 1000
        : undefined,
    }));
  } catch (error) {
    console.error('TikTok connector error:', error);
    return [];
  }
}

// Fallback: Récupère les vidéos du compte TikTok connecté (Display API)
export async function fetchMyTikTokVideos(
  accessToken: string,
  maxCount: number = 20
): Promise<RawMention[]> {
  try {
    const params = new URLSearchParams({
      fields: 'id,title,create_time,like_count,comment_count,share_count,view_count,share_url',
    });

    const response = await fetch(
      `${TIKTOK_API_BASE}/video/list/?${params}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: maxCount }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('TikTok Display API error:', err);
      return [];
    }

    const data = await response.json();
    const videos = data.data?.videos || [];

    return videos.map((video: { id: string; title?: string; create_time?: number; share_url?: string; like_count?: number; comment_count?: number; share_count?: number }) => ({
      id: `tiktok-${video.id}`,
      url: video.share_url || `https://www.tiktok.com/video/${video.id}`,
      title: (video.title || 'Vidéo TikTok').slice(0, 80),
      content: video.title || '',
      platform: 'tiktok' as const,
      publishedDate: video.create_time
        ? new Date(video.create_time * 1000).toISOString()
        : undefined,
      score: video.like_count
        ? (video.like_count + (video.comment_count || 0) * 2 + (video.share_count || 0) * 3) / 1000
        : undefined,
    }));
  } catch (error) {
    console.error('TikTok Display connector error:', error);
    return [];
  }
}

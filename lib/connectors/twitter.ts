import { RawMention } from '../types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

interface TwitterTweet {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

interface TwitterSearchResponse {
  data?: TwitterTweet[];
  meta?: { result_count: number };
}

export async function searchTwitter(
  bearerToken: string,
  query: string,
  maxResults: number = 20
): Promise<RawMention[]> {
  try {
    const params = new URLSearchParams({
      query: `${query} -is:retweet lang:fr`,
      max_results: String(Math.min(maxResults, 100)),
      'tweet.fields': 'created_at,author_id,public_metrics',
      expansions: 'author_id',
      'user.fields': 'username,name',
    });

    const response = await fetch(
      `${TWITTER_API_BASE}/tweets/search/recent?${params}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Twitter API error:', err);
      return [];
    }

    const data: TwitterSearchResponse = await response.json();

    if (!data.data || data.data.length === 0) return [];

    return data.data.map((tweet) => ({
      id: `twitter-${tweet.id}`,
      url: `https://x.com/i/web/status/${tweet.id}`,
      title: tweet.text.slice(0, 80),
      content: tweet.text,
      platform: 'twitter' as const,
      publishedDate: tweet.created_at,
      score: tweet.public_metrics
        ? (tweet.public_metrics.like_count +
            tweet.public_metrics.retweet_count * 2) /
          100
        : undefined,
    }));
  } catch (error) {
    console.error('Twitter connector error:', error);
    return [];
  }
}

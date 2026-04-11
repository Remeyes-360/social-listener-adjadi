export type Platform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'all';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

export type ImpressionLevel = ImportanceLevel; // alias for backwards compat

export type Context = 'political' | 'professional' | 'media' | 'personal' | 'customer_service' | 'product_feedback' | 'brand_mention' | 'crisis' | 'other';

export interface RawMention {
  id: string;
  url: string;
  title?: string;
  content: string;
  platform: Platform;
  author: string;
  publishedAt?: string;
  score?: number;
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface AnalyzedMention extends RawMention {
  analysis: {
    sentiment: Sentiment;
    confidence: number;
    summary: string;
    context: Context;
    importance: ImportanceLevel;
    language: string;
  };
  analyzedAt: string;
}

export interface PlatformConfig {
  id: Platform;
  label: string;
  query: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface StatsData {
  mentionsByPlatform: Record<string, number>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  timelineData: { time: string; count: number }[];
  topSources: { url: string; count: number }[];
  totalMentions: number;
}

export interface MentionsResponse {
  mentions: RawMention[];
  platform: Platform;
  timestamp: string;
  error?: string;
}

export interface AnalyzeResponse {
  mentions: AnalyzedMention[];
  timestamp: string;
}

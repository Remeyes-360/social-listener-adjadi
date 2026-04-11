'use client';
import React from 'react';
import { AnalyzedMention } from '@/lib/types';
import { getPlatformConfig } from '@/lib/platforms';
import { PlatformIcon } from './PlatformIcon';
import { SentimentBadge } from './SentimentBadge';
import { ImportanceBadge } from './ImportanceBadge';
import { ExternalLink, Clock, Globe, User, Heart, Share2, MessageCircle, Calendar } from 'lucide-react';

interface MentionCardProps {
  mention: AnalyzedMention;
  isNew?: boolean;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Date inconnue';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Date inconnue';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 30);
  }
}

const contextLabels: Record<string, string> = {
  political: '🏻️ Politique',
  professional: '💼 Professionnel',
  media: '📺 Médiatique',
  personal: '👤 Personnel',
  customer_service: '🎟️ Support',
  product_feedback: '📊 Feedback',
  brand_mention: '🌟 Marque',
  crisis: '⚠️ Crise',
  other: '🔗 Autre',
};

const languageLabels: Record<string, string> = {
  fr: '🇫🇷 FR',
  en: '🇬🇧 EN',
  es: '🇪🇸 ES',
  de: '🇩🇪 DE',
  pt: '🇵🇹 PT',
  ar: '🇸🇦 AR',
};

export function MentionCard({ mention, isNew = false }: MentionCardProps) {
  const platform = getPlatformConfig(mention.platform);
  const hasEngagement = mention.engagement && (mention.engagement.likes > 0 || mention.engagement.shares > 0 || mention.engagement.comments > 0);
  const dateSource = mention.publishedAt || mention.analyzedAt;
  const fullDate = formatDate(dateSource);
  const relativeDate = timeAgo(dateSource);

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-300 hover:border-opacity-60 group ${isNew ? 'animate-fade-in' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #12121a 0%, #0e0e18 100%)',
        borderColor:
          mention.analysis.importance === 'critical'
            ? 'rgba(239,68,68,0.4)'
            : mention.analysis.importance === 'high'
            ? 'rgba(245,158,11,0.3)'
            : 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Critical alert pulse */}
      {mention.analysis.importance === 'critical' && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {platform && (
            <PlatformIcon platform={mention.platform} size={16} />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-gray-500 shrink-0" />
              <span className="text-xs text-gray-300 font-medium truncate">
                {mention.author || getDomain(mention.url)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3 text-gray-600" />
              <span className="text-xs text-gray-500">{getDomain(mention.url)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SentimentBadge sentiment={mention.analysis.sentiment} />
          <ImportanceBadge importance={mention.analysis.importance} />
        </div>
      </div>
      {/* Content */}
      <p className="text-sm text-gray-200 leading-relaxed mb-3 line-clamp-3">
        {mention.content || mention.title || 'Aucun contenu'}
      </p>
      {/* Social Listening Summary */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 mb-3">
        <p className="text-xs text-purple-300">
          <span className="font-semibold text-purple-400">Social listening → </span>
          {mention.analysis.summary}
        </p>
      </div>
      {/* Badges row */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
          {contextLabels[mention.analysis.context] || mention.analysis.context}
        </span>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
          {languageLabels[mention.analysis.language] || mention.analysis.language?.toUpperCase()}
        </span>
        {mention.analysis.confidence > 0 && (
          <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
            {mention.analysis.confidence}% confidence
          </span>
        )}
      </div>
      {/* Engagement */}
      {hasEngagement && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {mention.engagement!.likes.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3 h-3" /> {mention.engagement!.shares.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> {mention.engagement!.comments.toLocaleString()}
          </span>
        </div>
      )}
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {fullDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{fullDate}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{relativeDate}</span>
          </span>
        </div>
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Voir l'original
        </a>
      </div>
    </div>
  );
}

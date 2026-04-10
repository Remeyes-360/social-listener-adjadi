'use client';

import React from 'react';
import { AnalyzedMention } from '@/lib/types';
import { getPlatformConfig } from '@/lib/platforms';
import { PlatformIcon } from './PlatformIcon';
import { SentimentBadge } from './SentimentBadge';
import { ImportanceBadge } from './ImportanceBadge';
import { ExternalLink, Clock, Globe } from 'lucide-react';

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

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 30);
  }
}

const contextLabels: Record<string, string> = {
  political: '🏛️ Politique',
  professional: '💼 Professionnel',
  media: '📺 Médiatique',
  personal: '👤 Personnel',
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

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-300 hover:border-opacity-60 group ${isNew ? 'animate-fade-in' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #12121a 0%, #0e0e18 100%)',
        borderColor: mention.analysis.importance === 'critical'
          ? 'rgba(239,68,68,0.4)'
          : platform
          ? `${platform.color}22`
          : '#1e1e2e',
      }}
    >
      {/* Critical alert pulse */}
      {mention.analysis.importance === 'critical' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse-red" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {platform && (
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: platform.bgColor }}
            >
              <PlatformIcon platform={mention.platform} size={16} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Globe size={10} />
              <span className="truncate max-w-[180px]">{getDomain(mention.url)}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
              <Clock size={9} />
              <span>{timeAgo(mention.publishedDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ImportanceBadge importance={mention.analysis.importance} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-200 mb-2 line-clamp-2 leading-snug">
        {mention.title}
      </h3>

      {/* AI Summary */}
      <div
        className="rounded-lg p-3 mb-3"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="flex items-start gap-2">
          <span className="text-xs text-indigo-400 font-bold flex-shrink-0 mt-0.5">AI →</span>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            {mention.analysis.summary}
          </p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <SentimentBadge
          sentiment={mention.analysis.sentiment}
          confidence={mention.analysis.confidence}
        />
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid rgba(100,116,139,0.2)',
            color: '#94a3b8',
          }}
        >
          {contextLabels[mention.analysis.context] || mention.analysis.context}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid rgba(100,116,139,0.2)',
            color: '#94a3b8',
          }}
        >
          {languageLabels[mention.analysis.language] || mention.analysis.language.toUpperCase()}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 truncate max-w-[200px]">{mention.url}</p>
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-indigo-400"
          style={{ color: platform?.color || '#6366f1' }}
        >
          Voir l&apos;original <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Sentiment } from '@/lib/types';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  confidence: number;
}

export function SentimentBadge({ sentiment, confidence }: SentimentBadgeProps) {
  const config = {
    positive: {
      icon: '🟢',
      label: 'Positif',
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.3)',
      text: '#4ade80',
    },
    neutral: {
      icon: '🟡',
      label: 'Neutre',
      bg: 'rgba(234,179,8,0.12)',
      border: 'rgba(234,179,8,0.3)',
      text: '#facc15',
    },
    negative: {
      icon: '🔴',
      label: 'Négatif',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.3)',
      text: '#f87171',
    },
  }[sentiment];

  return (
    <span
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    >
      {config.icon} {config.label}
      <span style={{ opacity: 0.7 }} className="text-[10px]">
        {confidence}%
      </span>
    </span>
  );
}

'use client';

import React from 'react';
import { ImportanceLevel } from '@/lib/types';

interface ImportanceBadgeProps {
  importance: ImportanceLevel;
}

export function ImportanceBadge({ importance }: ImportanceBadgeProps) {
  const config = {
    critical: {
      icon: '🔥',
      label: 'Critique',
      bg: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.4)',
      text: '#fca5a5',
      animate: true,
    },
    high: {
      icon: '⚡',
      label: 'Notable',
      bg: 'rgba(168,85,247,0.12)',
      border: 'rgba(168,85,247,0.3)',
      text: '#c084fc',
      animate: false,
    },
        medium: {
                icon: '📊',
                label: 'Moyen',
                bg: 'rgba(99,102,241,0.12)',
                border: 'rgba(99,102,241,0.3)',
                text: '#a5b4fc',
                animate: false,
              },
    low: {
      icon: '📌',
      label: 'Faible',
      bg: 'rgba(100,116,139,0.12)',
      border: 'rgba(100,116,139,0.3)',
      text: '#94a3b8',
      animate: false,
    },
  }[importance];

  return (
    <span
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        config.animate ? 'animate-pulse' : ''
      }`}
    >
      {config.icon} {config.label}
    </span>
  );
}

'use client';

import React from 'react';
import { Sentiment, ImportanceLevel, Context } from '@/lib/types';
import { SlidersHorizontal, X } from 'lucide-react';

export interface Filters {
  sentiment: Sentiment | 'all';
  importance: ImportanceLevel | 'all';
  context: Context | 'all';
  language: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const sentimentOptions: { value: Sentiment | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous sentiments' },
  { value: 'positive', label: '🟢 Positif' },
  { value: 'neutral', label: '🟡 Neutre' },
  { value: 'negative', label: '🔴 Négatif' },
];

const importanceOptions: { value: ImportanceLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Toute importance' },
  { value: 'critical', label: '🔥 Critique' },
  { value: 'high', label: '⚡ Notable' },
    { value: 'medium', label: '📊 Moyen' },
  { value: 'low', label: '📌 Faible' },
];

const contextOptions: { value: Context | 'all'; label: string }[] = [
  { value: 'all', label: 'Tout contexte' },
  { value: 'political', label: '🏛️ Politique' },
  { value: 'professional', label: '💼 Professionnel' },
  { value: 'media', label: '📺 Médiatique' },
  { value: 'personal', label: '👤 Personnel' },
  { value: 'other', label: '🔗 Autre' },
];

const selectStyle =
  'bg-[#12121a] border border-[#1e1e2e] text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 cursor-pointer appearance-none';

function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.sentiment !== 'all' ||
    filters.importance !== 'all' ||
    filters.context !== 'all' ||
    filters.language !== 'all'
  );
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const active = hasActiveFilters(filters);
  const reset = () =>
    onChange({ sentiment: 'all', importance: 'all', context: 'all', language: 'all' });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-slate-500">
        <SlidersHorizontal size={13} />
        <span className="text-xs">Filtres</span>
      </div>
      <select
        value={filters.sentiment}
        onChange={(e) => onChange({ ...filters, sentiment: e.target.value as Sentiment | 'all' })}
        className={selectStyle}
      >
        {sentimentOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={filters.importance}
        onChange={(e) => onChange({ ...filters, importance: e.target.value as ImportanceLevel | 'all' })}
        className={selectStyle}
      >
        {importanceOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={filters.context}
        onChange={(e) => onChange({ ...filters, context: e.target.value as Context | 'all' })}
        className={selectStyle}
      >
        {contextOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {active && (
        <button
          onClick={reset}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all"
        >
          <X size={11} />
          Réinitialiser
        </button>
      )}
    </div>
  );
}

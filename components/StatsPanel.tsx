'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { AnalyzedMention } from '@/lib/types';
import { PLATFORMS } from '@/lib/platforms';
import { TrendingUp, MessageSquare, BarChart2 } from 'lucide-react';

interface StatsPanelProps {
  mentions: AnalyzedMention[];
}

const SENTIMENT_COLORS = {
  positive: '#4ade80',
  neutral: '#facc15',
  negative: '#f87171',
};

export function StatsPanel({ mentions }: StatsPanelProps) {
  // Mentions by platform
  const byPlatform = PLATFORMS.map((p) => ({
    name: p.label.split(' / ')[0],
    count: mentions.filter((m) => m.platform === p.id).length,
    color: p.color,
  }));

  // Sentiment breakdown
  const sentimentData = [
    { name: 'Positif', value: mentions.filter((m) => m.analysis.sentiment === 'positive').length, color: SENTIMENT_COLORS.positive },
    { name: 'Neutre', value: mentions.filter((m) => m.analysis.sentiment === 'neutral').length, color: SENTIMENT_COLORS.neutral },
    { name: 'Négatif', value: mentions.filter((m) => m.analysis.sentiment === 'negative').length, color: SENTIMENT_COLORS.negative },
  ].filter((d) => d.value > 0);

  // Timeline (last 12 periods, each ~5min)
  const now = Date.now();
  const timelineData = Array.from({ length: 8 }, (_, i) => {
    const from = now - (8 - i) * 300000;
    const to = now - (7 - i) * 300000;
    return {
      time: new Date(from).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      count: mentions.filter((m) => {
        const t = m.analyzedAt ? new Date(m.analyzedAt).getTime() : 0;
        return t >= from && t < to;
      }).length,
    };
  });

  // Top sources
  const sourceCounts: Record<string, number> = {};
  mentions.forEach((m) => {
    try {
      const host = new URL(m.url).hostname.replace('www.', '');
      sourceCounts[host] = (sourceCounts[host] || 0) + 1;
    } catch {
      /* skip */
    }
  });
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const cardClass = 'rounded-xl border border-[#1e1e2e] p-4';
  const cardStyle = { background: 'linear-gradient(135deg, #12121a 0%, #0e0e18 100%)' };

  const tooltipStyle = {
    contentStyle: { background: '#1a1a2e', border: '1px solid #2e2e4e', borderRadius: 8, fontSize: 11 },
    labelStyle: { color: '#94a3b8' },
    itemStyle: { color: '#e2e8f0' },
  };

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={14} className="text-indigo-400" />
          <span className="text-xs text-slate-400 uppercase tracking-widest">Total Mentions</span>
        </div>
        <div className="text-3xl font-bold text-white">{mentions.length}</div>
        <div className="text-xs text-slate-500 mt-1">
          {mentions.filter((m) => m.analysis.importance === 'critical').length} critiques ·{' '}
          {mentions.filter((m) => m.analysis.importance === 'high').length} highs
        </div>
      </div>

      {/* By platform */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-indigo-400" />
          <span className="text-xs text-slate-400 uppercase tracking-widest">Par Plateforme</span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={byPlatform} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {byPlatform.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment pie */}
      {sentimentData.length > 0 && (
        <div className={cardClass} style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-400 uppercase tracking-widest">Sentiments</span>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                  {sentimentData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {sentimentData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                  <span className="text-slate-200 font-bold ml-auto pl-2">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-indigo-400" />
          <span className="text-xs text-slate-400 uppercase tracking-widest">Évolution</span>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={timelineData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top sources */}
      {topSources.length > 0 && (
        <div className={cardClass} style={cardStyle}>
          <span className="text-xs text-slate-400 uppercase tracking-widest block mb-3">Top Sources</span>
          <div className="space-y-2">
            {topSources.map(([source, count], i) => (
              <div key={source} className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 w-4">{i + 1}.</span>
                <span className="text-xs text-slate-300 truncate flex-1">{source}</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

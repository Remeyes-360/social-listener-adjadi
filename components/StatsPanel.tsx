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
import { TrendingUp, MessageSquare, BarChart as BarChartIcon } from 'lucide-react';

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
    { name: 'Negatif', value: mentions.filter((m) => m.analysis.sentiment === 'negative').length, color: SENTIMENT_COLORS.negative },
  ].filter((d) => d.value > 0);

  // Timeline (last 8 periods)
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
    if (m.url) {
      try {
        const host = new URL(m.url).hostname.replace('www.', '');
        sourceCounts[host] = (sourceCounts[host] || 0) + 1;
      } catch {
        // ignore invalid URLs
      }
    }
  });
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([url, count]) => ({ url, count }));

  const totalMentions = mentions.length;
  const positiveRate = totalMentions > 0
    ? Math.round((mentions.filter((m) => m.analysis.sentiment === 'positive').length / totalMentions) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* KPI Cards */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total mentions</p>
            <p className="text-2xl font-bold text-gray-900">{totalMentions}</p>
          </div>
          <MessageSquare className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Sentiment positif</p>
            <p className="text-2xl font-bold text-green-600">{positiveRate}%</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 col-span-2">
        <p className="text-sm text-gray-500 mb-2">Par plateforme</p>
        {byPlatform.filter((p) => p.count > 0).length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune donnee</p>
        ) : (
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={byPlatform.filter((p) => p.count > 0)}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byPlatform.filter((p) => p.count > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sentiment pie */}
      {sentimentData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500 mb-2">Sentiment</p>
          <ResponsiveContainer width="100%" height={80}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" cx="50%" cy="50%" outerRadius={35}>
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border p-4 col-span-2">
        <p className="text-sm text-gray-500 mb-2">Timeline (40 min)</p>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={timelineData}>
            <XAxis dataKey="time" tick={{ fontSize: 9 }} />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top sources */}
      {topSources.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500 mb-2">Top sources</p>
          <ul className="space-y-1">
            {topSources.map((s) => (
              <li key={s.url} className="flex justify-between text-xs">
                <span className="truncate text-gray-700">{s.url}</span>
                <span className="font-bold ml-2">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

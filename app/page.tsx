'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnalyzedMention, Platform } from '@/lib/types';
import { SUBJECT_NAME } from '@/lib/platforms';
import { MentionCard } from '@/components/MentionCard';
import { PlatformTabs } from '@/components/PlatformTabs';
import { FilterBar, Filters } from '@/components/FilterBar';
const StatsPanel = dynamic(() => import('@/components/StatsPanel').then(m => m.StatsPanel), { ssr: false });
import { LiveIndicator } from '@/components/LiveIndicator';
import { RefreshCw, Download, Radio, AlertTriangle, Zap } from 'lucide-react';

const POLL_INTERVAL = 3600; // 1 heure

const defaultFilters: Filters = {
  sentiment: 'all',
  importance: 'all',
  context: 'all',
  language: 'all',
};

export default function Dashboard() {
  const [mentions, setMentions] = useState<AnalyzedMention[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform>('all');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(POLL_INTERVAL);
  const [error, setError] = useState<string | null>(null);
  const [newMentionIds, setNewMentionIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAndAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mentionsRes = await fetch('/api/mentions');
      if (!mentionsRes.ok) throw new Error('Erreur lors de la recuperation des mentions');
      const mentionsData = await mentionsRes.json();
      const rawMentions = mentionsData.mentions || [];

      if (rawMentions.length === 0) {
        setLastRefresh(new Date());
        setIsLoading(false);
        return;
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentions: rawMentions }),
      });
      if (!analyzeRes.ok) throw new Error("Erreur lors de l'analyse Perplexity");
      const analyzeData = await analyzeRes.json();
      const analyzed: AnalyzedMention[] = analyzeData.mentions || [];

      const existingIds = new Set(mentions.map((m) => m.id));
      const newIds = new Set(analyzed.filter((m) => !existingIds.has(m.id)).map((m) => m.id));
      if (newIds.size > 0) {
        setNewMentionIds(newIds);
        setTimeout(() => setNewMentionIds(new Set()), 3000);
      }
      setMentions(analyzed);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [mentions]);

  useEffect(() => {
    fetchAndAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchAndAnalyze();
      setNextRefreshIn(POLL_INTERVAL);
    }, POLL_INTERVAL * 1000);
    countdownRef.current = setInterval(() => {
      setNextRefreshIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchAndAnalyze]);

  const handleManualRefresh = () => {
    fetchAndAnalyze();
    setNextRefreshIn(POLL_INTERVAL);
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timerRef.current = setInterval(() => {
      fetchAndAnalyze();
      setNextRefreshIn(POLL_INTERVAL);
    }, POLL_INTERVAL * 1000);
    countdownRef.current = setInterval(() => {
      setNextRefreshIn((prev) => Math.max(0, prev - 1));
    }, 1000);
  };

  const handleExport = () => {
    const data = JSON.stringify(filteredMentions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentions-adjadi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const platformCounts: Record<string, number> = {};
  mentions.forEach((m) => {
    platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
  });

  const filteredMentions = mentions.filter((m) => {
    if (activePlatform !== 'all' && m.platform !== activePlatform) return false;
    if (filters.sentiment !== 'all' && m.analysis.sentiment !== filters.sentiment) return false;
    if (filters.importance !== 'all' && m.analysis.importance !== filters.importance) return false;
    if (filters.context !== 'all' && m.analysis.context !== filters.context) return false;
    if (filters.language !== 'all' && m.analysis.language !== filters.language) return false;
    return true;
  });

  const criticalCount = mentions.filter((m) => m.analysis.importance === 'critical').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-blue-400 animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold text-white">{SUBJECT_NAME}</h1>
              <p className="text-sm text-gray-400">Surveillance active</p>
            </div>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 bg-red-900/50 text-red-400 text-xs px-2 py-1 rounded-full border border-red-800">
                <AlertTriangle className="w-3 h-3" />
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-blue-900/30 text-blue-400 text-xs px-3 py-1.5 rounded-full border border-blue-800/50">
              <Zap className="w-3 h-3" />
              Perplexity AI
            </span>
            {lastRefresh && (
              <span className="text-xs text-gray-500">{lastRefresh.toLocaleTimeString('fr-FR')}</span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Platform Tabs */}
        <PlatformTabs
          activePlatform={activePlatform}
          onPlatformChange={setActivePlatform}
          platformCounts={platformCounts}
        />

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Stats */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} affichee{filteredMentions.length !== 1 ? 's' : ''}
            {filteredMentions.length !== mentions.length && ` (sur ${mentions.length})`}
          </span>
          {isLoading && (
            <span className="text-xs text-blue-400 animate-pulse">Analyse Perplexity en cours…</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 font-medium">Erreur de recuperation</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredMentions.length === 0 && !error && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📡</div>
            <p className="text-lg font-medium">Aucune mention trouvee</p>
            <p className="text-sm mt-2">
              {mentions.length > 0
                ? 'Essayez de modifier vos filtres'
                : 'Configurez votre cle PERPLEXITY_API_KEY puis actualisez'}
            </p>
          </div>
        )}

        {/* Mention cards */}
        <div className="space-y-3">
          {filteredMentions.map((mention) => (
            <MentionCard
              key={mention.id}
              mention={mention}
              isNew={newMentionIds.has(mention.id)}
            />
          ))}
        </div>

        {/* Stats panel + Live */}
        {mentions.length > 0 && (
          <div className="mt-8">
            <StatsPanel mentions={mentions} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
          <span>Social Listener · Powered by Perplexity AI Sonar</span>
          <LiveIndicator nextRefreshIn={nextRefreshIn} />
          <span>Rafraichissement auto toutes les heures</span>
        </div>
      </div>
    </div>
  );
}

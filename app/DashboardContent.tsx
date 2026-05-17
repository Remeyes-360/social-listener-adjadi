'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyzedMention, Platform } from '@/lib/types';
import { SUBJECT_NAME } from '@/lib/platforms';
import { MentionCard } from '@/components/MentionCard';
import { PlatformTabs } from '@/components/PlatformTabs';
import { FilterBar, Filters } from '@/components/FilterBar';
import { StatsPanel } from '@/components/StatsPanel';
import { LiveIndicator } from '@/components/LiveIndicator';
import { RefreshCw, Download, Radio, AlertTriangle, Zap } from 'lucide-react';

const POLL_INTERVAL = 3600;

const defaultFilters: Filters = {
  sentiment: 'all',
  importance: 'all',
  context: 'all',
  language: 'all',
};

export default function Dashboard() {
  const [mentions, setMentions] = useState<AnalyzedMention[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-blue-400" />
              {SUBJECT_NAME}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Surveillance active</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 bg-red-900/50 border border-red-700 text-red-300 px-3 py-1.5 rounded-full text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-800 text-blue-300 px-3 py-1.5 rounded-full text-sm">
              <Zap className="w-4 h-4" /> Perplexity AI
            </span>
            {lastRefresh && (
              <span className="text-gray-500 text-xs">
                {lastRefresh.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
          counts={platformCounts}
        />

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm">
            {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} affichee{filteredMentions.length !== 1 ? 's' : ''}
            {filteredMentions.length !== mentions.length && ` (sur ${mentions.length})`}
          </p>
          {isLoading && (
            <p className="text-blue-400 text-sm flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Analyse Perplexity en cours…
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl">
            <p className="text-red-300 font-medium">Erreur de recuperation</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredMentions.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📡</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Aucune mention trouvee</h3>
            <p className="text-gray-500">
              {mentions.length > 0
                ? 'Essayez de modifier vos filtres'
                : 'Configurez votre cle PERPLEXITY_API_KEY puis actualisez'}
            </p>
          </div>
        )}

        {/* Mention cards */}
        <div className="grid gap-4">
          {filteredMentions.map((mention) => (
            <MentionCard key={mention.id} mention={mention} isNew={newMentionIds.has(mention.id)} />
          ))}
        </div>

        {/* Stats panel + Live */}
        {mentions.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <StatsPanel mentions={mentions} />
            <LiveIndicator nextRefreshIn={nextRefreshIn} totalMentions={mentions.length} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 text-center text-gray-600 text-xs">
          Social Listener &middot; Powered by Perplexity AI Sonar &nbsp;|&nbsp; Rafraichissement auto toutes les heures
        </footer>
      </div>
    </div>
  );
}

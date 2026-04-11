'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyzedMention, Platform } from '@/lib/types';
import { SUBJECT_NAME } from '@/lib/platforms';
import { MentionCard } from '@/components/MentionCard';
import { PlatformTabs } from '@/components/PlatformTabs';
import { FilterBar, Filters } from '@/components/FilterBar';
import { StatsPanel } from '@/components/StatsPanel';
import { LiveIndicator } from '@/components/LiveIndicator';
import { RefreshCw, Download, Radio, AlertTriangle, Activity } from 'lucide-react';

const POLL_INTERVAL = 3600; // 1 heure 

const defaultFilters: Filters = {
  sentiment: 'all',
  importance: 'all',
  context: 'all',
  language: 'all',
};

function sortByDateDesc(a: AnalyzedMention, b: AnalyzedMention): number {
  const dateA = new Date(a.publishedAt || a.analyzedAt || 0).getTime();
  const dateB = new Date(b.publishedAt || b.analyzedAt || 0).getTime();
  return dateB - dateA;
}

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
      // Step 1: Fetch raw mentions
      const mentionsRes = await fetch('/api/mentions');
      if (!mentionsRes.ok) throw new Error('Erreur lors de la r\u00e9cup\u00e9ration des mentions');
      const mentionsData = await mentionsRes.json();
      const rawMentions = mentionsData.mentions || [];
      if (rawMentions.length === 0) {
        setLastRefresh(new Date());
        setIsLoading(false);
        return;
      }
      // Step 2: Analyze
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentions: rawMentions }),
      });
      if (!analyzeRes.ok) throw new Error('Erreur lors de l\'analyse');
      const analyzeData = await analyzeRes.json();
      const analyzed: AnalyzedMention[] = analyzeData.mentions || [];
      // Mark new mentions
      const existingIds = new Set(mentions.map((m) => m.id));
      const newIds = new Set(analyzed.filter((m) => !existingIds.has(m.id)).map((m) => m.id));
      if (newIds.size > 0) {
        setNewMentionIds(newIds);
        setTimeout(() => setNewMentionIds(new Set()), 3000);
      }
      // Sort by date desc (most recent first)
      setMentions([...analyzed].sort(sortByDateDesc));
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [mentions]);

  // Initial load
  useEffect(() => {
    fetchAndAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-polling
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

  // Platform counts
  const platformCounts: Record<string, number> = {};
  mentions.forEach((m) => {
    platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
  });

  // Filter logic + sort by date desc
  const filteredMentions = mentions
    .filter((m) => {
      if (activePlatform !== 'all' && m.platform !== activePlatform) return false;
      if (filters.sentiment !== 'all' && m.analysis.sentiment !== filters.sentiment) return false;
      if (filters.importance !== 'all' && m.analysis.importance !== filters.importance) return false;
      if (filters.context !== 'all' && m.analysis.context !== filters.context) return false;
      if (filters.language !== 'all' && m.analysis.language !== filters.language) return false;
      return true;
    })
    .sort(sortByDateDesc);

  const criticalCount = mentions.filter((m) => m.analysis.importance === 'critical').length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: subject name */}
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Surveillance active</p>
              <h1 className="text-xl font-bold text-white">{SUBJECT_NAME}</h1>
            </div>
          </div>
          {/* Center: live + alerts */}
          <div className="flex items-center gap-3">
            <LiveIndicator />
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/30">
                <AlertTriangle className="w-4 h-4" />
                <span>{criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full text-xs border border-blue-500/30">
              <Activity className="w-3.5 h-3.5" />
              <span>Social listening</span>
            </div>
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                {lastRefresh.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Left: Feed */}
        <div className="flex-1 min-w-0">
          {/* Platform tabs */}
          <PlatformTabs
  active={activePlatform}
  onChange={setActivePlatform}
  counts={platformCounts}
/>
          {/* Filter bar */}
          <FilterBar filters={filters} onChange={setFilters} />
          {/* Results summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} affich\u00e9e{filteredMentions.length !== 1 ? 's' : ''}
              {filteredMentions.length !== mentions.length && ` (sur ${mentions.length})`}
            </p>
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Social listening\u2026</span>
              </div>
            )}
          </div>
          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl">
              <p className="text-red-400 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Erreur de r\u00e9cup\u00e9ration
              </p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}
          {/* Feed - trié du plus récent au plus ancien */}
          {!isLoading && filteredMentions.length === 0 && !error && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📡</div>
              <p className="text-lg font-medium">Aucune mention trouvée</p>
              <p className="text-sm mt-1">
                {mentions.length > 0
                  ? 'Essayez de modifier vos filtres'
                  : 'Configurez vos clés API puis actualisez'}
              </p>
            </div>
          )}
          <div className="space-y-3">
            {filteredMentions.map((mention) => (
              <MentionCard
                key={mention.id}
                mention={mention}
                isNew={newMentionIds.has(mention.id)}
              />
            ))}
          </div>
        </div>
        {/* Right: Stats sidebar */}
        <aside className="w-80 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Statistiques</h2>
            <LiveIndicator size="sm" label="Live" />
          </div>
          <StatsPanel mentions={mentions} />
        </aside>
      </main>
      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-600">
          <span>Social Listener · Social listening</span>
          <span>Rafra\u00eechissement auto toutes les heures</span>
        </div>
      </footer>
    </div>
  );
}

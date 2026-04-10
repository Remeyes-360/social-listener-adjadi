'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyzedMention, Platform } from '@/lib/types';
import { SUBJECT_NAME } from '@/lib/platforms';
import { MentionCard } from '@/components/MentionCard';
import { PlatformTabs } from '@/components/PlatformTabs';
import { FilterBar, Filters } from '@/components/FilterBar';
import { StatsPanel } from '@/components/StatsPanel';
import { LiveIndicator } from '@/components/LiveIndicator';
import { RefreshCw, Download, Radio, AlertTriangle, Cpu } from 'lucide-react';

const POLL_INTERVAL = 60;

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
      // Step 1: Fetch raw mentions
      const mentionsRes = await fetch('/api/mentions');
      if (!mentionsRes.ok) throw new Error('Erreur lors de la récupération des mentions');
      const mentionsData = await mentionsRes.json();
      const rawMentions = mentionsData.mentions || [];

      if (rawMentions.length === 0) {
        setLastRefresh(new Date());
        setIsLoading(false);
        return;
      }

      // Step 2: Analyze with Claude
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentions: rawMentions }),
      });

      if (!analyzeRes.ok) throw new Error('Erreur lors de l\'analyse Claude');
      const analyzeData = await analyzeRes.json();
      const analyzed: AnalyzedMention[] = analyzeData.mentions || [];

      // Mark new mentions
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

  // Filter logic
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: '#1e1e2e',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: subject name */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <Radio size={14} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
                  Surveillance active
                </span>
              </div>
              <h1 className="font-bold text-white text-sm sm:text-base truncate">
                {SUBJECT_NAME}
              </h1>
            </div>
          </div>

          {/* Center: live + alerts */}
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
                <AlertTriangle size={11} className="text-red-400" />
                <span className="text-xs font-bold text-red-400">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>
              </div>
            )}
            <LiveIndicator isLoading={isLoading} nextRefreshIn={nextRefreshIn} />
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
              <Cpu size={10} className="text-indigo-400" />
              <span>Claude AI</span>
            </div>
            {lastRefresh && (
              <span className="hidden md:block text-[10px] text-slate-600">
                {lastRefresh.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white border border-[#1e1e2e] hover:border-indigo-500/40 transition-all disabled:opacity-50"
              style={{ background: '#12121a' }}
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white border border-[#1e1e2e] hover:border-indigo-500/40 transition-all"
              style={{ background: '#12121a' }}
            >
              <Download size={12} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Left: Feed */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Platform tabs */}
          <div
            className="rounded-xl border p-3"
            style={{ background: '#12121a', borderColor: '#1e1e2e' }}
          >
            <PlatformTabs
              active={activePlatform}
              onChange={setActivePlatform}
              counts={platformCounts}
            />
          </div>

          {/* Filter bar */}
          <div
            className="rounded-xl border p-3"
            style={{ background: '#12121a', borderColor: '#1e1e2e' }}
          >
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-500">
              {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} affichée{filteredMentions.length !== 1 ? 's' : ''}
              {filteredMentions.length !== mentions.length && ` (sur ${mentions.length})`}
            </span>
            {isLoading && (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Analyse Claude en cours…
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Erreur de récupération</p>
                <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Feed */}
          {!isLoading && filteredMentions.length === 0 && !error && (
            <div
              className="rounded-xl border p-12 text-center"
              style={{ background: '#12121a', borderColor: '#1e1e2e' }}
            >
              <div className="text-4xl mb-3">📡</div>
              <p className="text-slate-400 text-sm font-medium">Aucune mention trouvée</p>
              <p className="text-slate-600 text-xs mt-1">
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
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
          <div className="sticky top-20">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-widest">Statistiques</span>
              <span className="text-[10px] text-slate-600">Live</span>
            </div>
            <StatsPanel mentions={mentions} />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2e] py-3 px-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between text-[10px] text-slate-600">
          <span>Social Listener · Powered by Claude AI + Tavily Search</span>
          <span>Rafraîchissement auto toutes les {POLL_INTERVAL}s</span>
        </div>
      </footer>
    </div>
  );
}

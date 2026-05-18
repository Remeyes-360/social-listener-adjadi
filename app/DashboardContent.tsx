'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnalyzedMention, Platform, RawMention } from '@/lib/types';
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

function rawToAnalyzed(raw: RawMention): AnalyzedMention {
  const content = raw.content || '';
  return {
    ...raw,
    analysis: {
      sentiment: 'neutral',
      confidence: 50,
      summary: content.slice(0, 120) + (content.length > 120 ? '...' : ''),
      context: 'other',
      importance: 'medium',
      language: 'fr',
    },
    analyzedAt: new Date().toISOString(),
  };
}

export default function Dashboard() {
  const [mentions, setMentions] = useState<AnalyzedMention[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(POLL_INTERVAL);
  const [error, setError] = useState<string | null>(null);
  const [newMentionIds, setNewMentionIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mentionsRef = useRef<AnalyzedMention[]>([]);

  const fetchAndAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mentions');
      if (!res.ok) throw new Error('Erreur lors de la recuperation des mentions');
      const data = await res.json();
      const rawMentions: RawMention[] = data.mentions || [];

      if (rawMentions.length === 0) {
        setLastRefresh(new Date());
        setIsLoading(false);
        return;
      }

      // Show raw mentions immediately
      const defaultAnalyzed = rawMentions.map(rawToAnalyzed);
      const existingIds = new Set(mentionsRef.current.map((m) => m.id));
      const newIds = new Set(
        defaultAnalyzed.filter((m) => !existingIds.has(m.id)).map((m) => m.id)
      );
      if (newIds.size > 0) {
        setNewMentionIds(newIds);
        setTimeout(() => setNewMentionIds(new Set()), 3000);
      }
      mentionsRef.current = defaultAnalyzed;
      setMentions(defaultAnalyzed);
      setLastRefresh(new Date());
      setIsLoading(false);

      // Analyze in background
      setIsAnalyzing(true);
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 50000);
        const aRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mentions: rawMentions }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (aRes.ok) {
          const aData = await aRes.json();
          const analyzed: AnalyzedMention[] = aData.mentions || [];
          if (analyzed.length > 0) {
            mentionsRef.current = analyzed;
            setMentions(analyzed);
          }
        }
      } catch {
        // Timeout or error - keep raw mentions
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyze();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    fetchAndAnalyze();
    setNextRefreshIn(POLL_INTERVAL);
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="text-blue-400" size={20} />
            <div>
              <h1 className="text-xl font-bold">{SUBJECT_NAME}</h1>
              <p className="text-xs text-gray-400">Surveillance active</p>
            </div>
            {criticalCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle size={10} />
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
              <Zap size={10} />
              Perplexity AI
            </span>
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                {lastRefresh.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded text-sm"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <PlatformTabs
          activePlatform={activePlatform}
          onPlatformChange={setActivePlatform}
          platformCounts={platformCounts}
        />
        <FilterBar filters={filters} onFiltersChange={setFilters} />
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} affichee{filteredMentions.length !== 1 ? 's' : ''}
            {filteredMentions.length !== mentions.length && ` (sur ${mentions.length})`}
          </span>
          {isAnalyzing && (
            <span className="flex items-center gap-2 text-xs text-purple-400">
              <RefreshCw size={12} className="animate-spin" />
              Analyse IA en cours...
            </span>
          )}
        </div>
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-4">
            <p className="text-red-400 font-medium">Erreur</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-400" />
          </div>
        )}
        {!isLoading && filteredMentions.length === 0 && !error && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">📡</p>
            <h3 className="font-semibold text-lg">Aucune mention trouvee</h3>
            <p className="text-sm">
              {mentions.length > 0 ? 'Modifiez vos filtres' : 'Configurez PERPLEXITY_API_KEY'}
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
        {mentions.length > 0 && (
          <div className="mt-8">
            <StatsPanel mentions={mentions} />
            <LiveIndicator
              lastRefresh={lastRefresh}
              nextRefreshIn={nextRefreshIn}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>
      <footer className="text-center text-xs text-gray-600 py-4">
        Social Listener · Powered by Perplexity AI Sonar
      </footer>
    </div>
  );
}

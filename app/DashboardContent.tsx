'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnalyzedMention, Platform, RawMention } from '@/lib/types';
import { SUBJECT_NAME } from '@/lib/platforms';
import { MentionCard } from '@/components/MentionCard';
import { PlatformTabs } from '@/components/PlatformTabs';
import { FilterBar, Filters } from '@/components/FilterBar';
import { StatsPanel } from '@/components/StatsPanel';
import { LiveIndicator } from '@/components/LiveIndicator';
import { RefreshCw, Download, Wifi, AlertTriangle, Zap } from 'lucide-react';

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
        setNextRefreshIn(POLL_INTERVAL);
        setIsLoading(false);
        return;
      }

      const initialMentions = rawMentions.map(rawToAnalyzed);
      const prevIds = new Set(mentionsRef.current.map((m) => m.id));
      const newIds = new Set(initialMentions.filter((m) => !prevIds.has(m.id)).map((m) => m.id));
      mentionsRef.current = initialMentions;
      setMentions(initialMentions);
      setNewMentionIds(newIds);
      setLastRefresh(new Date());
      setNextRefreshIn(POLL_INTERVAL);
      setIsLoading(false);

      // Background analysis
      setIsAnalyzing(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const aRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mentions: rawMentions }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (aRes.ok) {
          const aData = await aRes.json();
          const analyzed: AnalyzedMention[] = aData.mentions || initialMentions;
          mentionsRef.current = analyzed;
          setMentions(analyzed);
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
      setNextRefreshIn((n) => (n > 0 ? n - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const criticalCount = mentions.filter((m) => m.analysis.importance === 'critical').length;

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

  const handleManualRefresh = () => {
    fetchAndAnalyze();
    setNextRefreshIn(POLL_INTERVAL);
  };

  const handleExport = () => {
    const json = JSON.stringify(mentions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{SUBJECT_NAME}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LiveIndicator />
          <span>Surveillance active</span>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
              <AlertTriangle className="w-4 h-4" />
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <StatsPanel mentions={mentions} />

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <PlatformTabs
          active={activePlatform}
          onChange={setActivePlatform}
          counts={platformCounts}
        />
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400">
            Perplexity AI
            {lastRefresh && (
              <span className="block">Derniere mise a jour : {lastRefresh.toLocaleTimeString('fr-FR')}</span>
            )}
          </div>
          <button onClick={handleManualRefresh} className="p-2 hover:bg-gray-100 rounded-full">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1 space-y-4">
          <div className="text-sm text-gray-600">
            {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} affichee{filteredMentions.length !== 1 ? 's' : ''}
            {filteredMentions.length !== mentions.length && ` (sur ${mentions.length})`}
            {isAnalyzing && (
              <span className="ml-4 inline-flex items-center gap-2 text-indigo-600">
                <Zap className="w-4 h-4 animate-pulse" />
                Analyse IA en cours...
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle /> Erreur : {error}
            </div>
          )}

          {isLoading && <div className="text-center py-20 animate-pulse">Chargement...</div>}

          {!isLoading && filteredMentions.length === 0 && !error && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <Wifi className="mx-auto w-12 h-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">Aucune mention trouvee</h3>
              <p className="text-gray-500">{mentions.length > 0 ? 'Modifiez vos filtres' : 'Configurez PERPLEXITY_API_KEY'}</p>
            </div>
          )}

          {filteredMentions.map((mention) => (
            <MentionCard
              key={mention.id}
              mention={mention}
              isNew={newMentionIds.has(mention.id)}
            />
          ))}
        </div>
      </div>

      {mentions.length > 0 && (
        <footer className="text-center text-xs text-gray-400 py-8 border-t">
          Social Listener · Powered by Perplexity AI Sonar
        </footer>
      )}
    </div>
  );
}

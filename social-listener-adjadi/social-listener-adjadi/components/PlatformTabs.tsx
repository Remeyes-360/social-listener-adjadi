'use client';

import React from 'react';
import { Platform } from '@/lib/types';
import { PLATFORMS } from '@/lib/platforms';
import { PlatformIcon } from './PlatformIcon';
import { LayoutGrid } from 'lucide-react';

interface PlatformTabsProps {
  active: Platform;
  onChange: (platform: Platform) => void;
  counts: Record<string, number>;
}

export function PlatformTabs({ active, onChange, counts }: PlatformTabsProps) {
  const allCount = Object.values(counts).reduce((s, c) => s + c, 0);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {/* "All" tab */}
      <button
        onClick={() => onChange('all')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
          active === 'all'
            ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
            : 'text-slate-400 hover:text-slate-300 hover:bg-white/5 border border-transparent'
        }`}
      >
        <LayoutGrid size={14} />
        <span>Tout</span>
        {allCount > 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              active === 'all'
                ? 'bg-indigo-500/30 text-indigo-300'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {allCount}
          </span>
        )}
      </button>

      {/* Platform tabs */}
      {PLATFORMS.map((platform) => {
        const count = counts[platform.id] || 0;
        const isActive = active === platform.id;
        return (
          <button
            key={platform.id}
            onClick={() => onChange(platform.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300 hover:bg-white/5 border-transparent'
            }`}
            style={
              isActive
                ? {
                    background: platform.bgColor,
                    borderColor: `${platform.color}44`,
                    color: platform.textColor,
                  }
                : undefined
            }
          >
            <PlatformIcon platform={platform.id} size={14} />
            <span className="hidden sm:inline">{platform.label}</span>
            {count > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={
                  isActive
                    ? { background: `${platform.color}33`, color: platform.color }
                    : { background: 'rgb(51,65,85)', color: 'rgb(148,163,184)' }
                }
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

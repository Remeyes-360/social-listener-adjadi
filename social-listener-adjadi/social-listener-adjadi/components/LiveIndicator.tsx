'use client';

import React from 'react';

interface LiveIndicatorProps {
  isLoading?: boolean;
  nextRefreshIn?: number;
}

export function LiveIndicator({ isLoading = false, nextRefreshIn }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-xs font-bold text-yellow-400 tracking-widest">SYNC</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
          <div
            className="w-2 h-2 rounded-full bg-red-500"
            style={{
              boxShadow: '0 0 0 0 rgba(239,68,68,0.4)',
              animation: 'pulse-red 1.5s ease-in-out infinite',
            }}
          />
          <span className="text-xs font-bold text-red-400 tracking-widest">LIVE</span>
          {nextRefreshIn !== undefined && (
            <span className="text-[10px] text-red-400/60">
              {nextRefreshIn}s
            </span>
          )}
        </div>
      )}
    </div>
  );
}

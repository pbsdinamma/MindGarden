'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Shimmer({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-shimmer rounded', className)}
      aria-hidden="true"
    />
  );
}

/** Note card skeleton — mimics NoteCard shape */
export function SkeletonCard() {
  return (
    <div
      className="bg-card-bg border border-card-border/60 rounded-2xl p-5 h-60 flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading note..."
    >
      <div className="flex justify-between items-center">
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-6 w-8" />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-4/5" />
        <Shimmer className="h-3 w-3/5 mt-1" />
      </div>
      <div className="pt-3 border-t border-card-border/40 flex justify-between">
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/** Grid of skeleton note cards for initial load */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton for the note detail / editor panel */
export function SkeletonNoteDetail() {
  return (
    <div className="space-y-5 p-6" aria-busy="true" aria-label="Loading note...">
      <Shimmer className="h-7 w-3/4" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => <Shimmer key={i} className="h-6 w-6 rounded-full" />)}
      </div>
      <div className="space-y-2">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-5/6" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-4/5" />
        <Shimmer className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/** Pulsing AI summary skeleton — multi-line to approximate response shape */
export function SkeletonAiSummary() {
  return (
    <div className="space-y-2.5 p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30" aria-busy="true" aria-label="Generating AI summary...">
      <div className="flex items-center gap-2 mb-3">
        <Shimmer className="w-4 h-4 rounded-full" />
        <Shimmer className="h-3 w-32" />
      </div>
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-11/12" />
      <Shimmer className="h-3 w-4/5" />
      <Shimmer className="h-3 w-full mt-1" />
      <Shimmer className="h-3 w-3/4" />
    </div>
  );
}

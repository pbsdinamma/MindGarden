'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/types/database.types';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectNote: (id: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Highlight matched terms in a string by wrapping in <mark> */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function SearchModal({ open, onClose, onSelectNote }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/notes/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data.results ?? []);
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelectNote(id);
      onClose();
    },
    [onSelectNote, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      handleSelect(results[activeIndex].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-xl bg-card-bg border border-card-border rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search notes"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border/60">
            {loading ? (
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" aria-hidden="true" />
            ) : (
              <Search className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            )}
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-haspopup="listbox"
              aria-controls="search-results-list"
              aria-autocomplete="list"
              aria-activedescendant={results[activeIndex] ? `search-result-${results[activeIndex].id}` : undefined}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your notes..."
              className="flex-1 bg-transparent text-sm text-text-base placeholder:text-muted/50 focus:outline-none"
            />
            <button
              onClick={onClose}
              aria-label="Close search"
              className="p-1.5 rounded-lg text-muted hover:text-text-base hover:bg-muted-light smooth-hover"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Results */}
          <div
            id="search-results-list"
            ref={listRef}
            role="listbox"
            aria-label="Search results"
            aria-live="polite"
            className="max-h-80 overflow-y-auto"
          >
            {query && !loading && results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
                <FileText className="w-8 h-8 opacity-40" aria-hidden="true" />
                <p className="text-xs">No notes found for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              results.map((result, i) => (
                <button
                  key={result.id}
                  id={`search-result-${result.id}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => handleSelect(result.id)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-card-border/30 last:border-0 smooth-hover',
                    i === activeIndex
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/20'
                      : 'hover:bg-muted-light',
                  )}
                >
                  <p className="text-xs font-semibold text-text-base line-clamp-1 mb-0.5">
                    <HighlightedText text={result.title || 'Untitled'} query={debouncedQuery} />
                  </p>
                  {result.snippet && (
                    <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                      <HighlightedText text={result.snippet} query={debouncedQuery} />
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-card-border/40 flex items-center gap-4 text-[10px] text-muted/70 bg-muted-light/30">
            <span><kbd className="px-1 py-0.5 bg-card-bg border border-card-border rounded text-[9px]">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-card-bg border border-card-border rounded text-[9px]">Enter</kbd> open</span>
            <span><kbd className="px-1 py-0.5 bg-card-bg border border-card-border rounded text-[9px]">Esc</kbd> close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

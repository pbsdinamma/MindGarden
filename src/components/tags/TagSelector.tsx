'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tag as TagIcon, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagBadge from './TagBadge';
import type { Tag } from '@/types/database.types';
import { toast } from 'react-hot-toast';

interface TagSelectorProps {
  noteId: string;
  allTags: Tag[];
  assignedTagIds: string[];
  onAssign: (tagId: string) => Promise<void>;
  onRemove: (tagId: string) => Promise<void>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
}

/**
 * Combobox-style multi-select for assigning tags to a note.
 * Shows assigned tags as removable chips, allows typing to filter,
 * and offers inline tag creation if no match found.
 */
export default function TagSelector({
  noteId,
  allTags,
  assignedTagIds,
  onAssign,
  onRemove,
  onCreateTag,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const assignedTags = allTags.filter((t) => assignedTagIds.includes(t.id));
  const unassignedTags = allTags.filter((t) => !assignedTagIds.includes(t.id));

  const filteredTags = unassignedTags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()),
  );

  const showCreate =
    query.trim().length > 0 &&
    !allTags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase()) &&
    !!onCreateTag;

  const options = showCreate
    ? [...filteredTags, { id: '__create__', name: `Create "${query.trim()}"`, color: '#6366f1' } as Tag]
    : filteredTags;

  useEffect(() => { setActiveIndex(0); }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    async (tag: Tag) => {
      if (tag.id === '__create__') {
        if (!onCreateTag) return;
        const created = await onCreateTag(query.trim());
        if (created) {
          await onAssign(created.id);
          toast.success(`Tag "${created.name}" created and assigned`);
        }
      } else {
        await onAssign(tag.id);
      }
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
    },
    [onCreateTag, onAssign, query],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[activeIndex]) handleSelect(options[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Assigned tags row */}
      {assignedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2" aria-label="Assigned tags">
          {assignedTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} onRemove={() => onRemove(tag.id)} />
          ))}
        </div>
      )}

      {/* Combobox trigger */}
      <div className="relative">
        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="tag-listbox"
          aria-label="Search or create tags"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add or search tags..."
          className="w-full pl-9 pr-8 py-2 bg-muted-light/60 border border-card-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-text-base placeholder:text-muted/50"
        />
        <ChevronDown
          className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id="tag-listbox"
          ref={listRef}
          role="listbox"
          aria-label="Tag options"
          className="absolute z-50 mt-1 w-full bg-card-bg border border-card-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted italic">
              {query ? 'No matching tags.' : 'No more tags to add.'}
            </p>
          ) : (
            options.map((tag, i) => (
              <button
                key={tag.id}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => handleSelect(tag)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs text-left smooth-hover',
                  i === activeIndex
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-text-base hover:bg-muted-light',
                )}
              >
                {tag.id === '__create__' ? (
                  <>
                    <Plus className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{tag.name}</span>
                  </>
                ) : (
                  <>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden="true"
                    />
                    <span>{tag.name}</span>
                  </>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

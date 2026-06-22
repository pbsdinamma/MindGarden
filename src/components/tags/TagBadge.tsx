'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/database.types';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
}

/**
 * Pill badge displaying a tag name with a tinted background derived
 * from the tag's hex color. Uses low-opacity tint so text stays legible
 * in both light and dark mode.
 */
const TagBadge = memo(function TagBadge({ tag, onRemove, className }: TagBadgeProps) {
  // Convert hex to rgba for background tint
  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(99,102,241,${alpha})`;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const bg = hexToRgba(tag.color, 0.15);
  const border = hexToRgba(tag.color, 0.35);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 select-none',
        className,
      )}
      style={{ backgroundColor: bg, borderColor: border, border: `1px solid ${border}`, color: tag.color }}
      title={tag.name}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: tag.color }}
        aria-hidden="true"
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 12"
            className="w-2.5 h-2.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      )}
    </span>
  );
});

export default TagBadge;

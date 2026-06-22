'use client';

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, RotateCcw, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { Note } from '@/types/database.types';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onTrash: (id: string, isTrashed: boolean) => void;
  onDelete: (id: string) => void;
}

const NoteCard = memo(function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onTrash,
  onDelete,
}: NoteCardProps) {
  const { theme } = useTheme();

  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const getCardStyles = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const baseColor = note.color || '#f3f4f6';

    if (isDark) {
      const tintColor = baseColor.startsWith('#') ? `${baseColor}15` : 'rgba(255,255,255,0.02)';
      const borderTint = baseColor.startsWith('#') ? `${baseColor}40` : 'rgba(255,255,255,0.1)';
      return { backgroundColor: tintColor, borderColor: borderTint };
    } else {
      const isNeutral = baseColor === '#f3f4f6' || baseColor === '#ffffff';
      return {
        backgroundColor: isNeutral ? '#ffffff' : baseColor,
        borderColor: isNeutral ? '#e2e8f0' : `${baseColor}cc`,
      };
    }
  }, [note.color]);

  const cardStyles = getCardStyles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -4, boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}
      style={cardStyles}
      className={cn(
        'group relative flex flex-col h-60 rounded-2xl border p-5 cursor-pointer smooth-hover select-none',
        theme === 'dark' ? 'shadow-[0_4px_12px_rgba(0,0,0,0.4)]' : 'shadow-sm',
      )}
      onClick={() => onEdit(note)}
      tabIndex={0}
      role="button"
      aria-label={`Open note: ${note.title || 'Untitled Note'}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(note); } }}
    >
      {/* Pin indicator stripe */}
      {note.is_pinned && !note.is_trashed && !note.is_deleted && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" aria-hidden="true" />
      )}

      {/* Top row — title & actions */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-sm tracking-tight text-text-base line-clamp-1 flex-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 smooth-hover">
          {note.title || 'Untitled Note'}
        </h3>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {(note.is_trashed || note.is_deleted) ? (
            <>
              <button
                onClick={() => onTrash(note.id, false)}
                title="Restore Note"
                aria-label="Restore note from trash"
                className="p-1.5 rounded-lg bg-card-bg border border-card-border/50 text-emerald-500 hover:bg-emerald-500/10 active:scale-95 smooth-hover"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete this note? This action is irreversible.')) {
                    onDelete(note.id);
                  }
                }}
                title="Delete Permanently"
                aria-label="Delete note permanently"
                className="p-1.5 rounded-lg bg-card-bg border border-card-border/50 text-rose-500 hover:bg-rose-500/10 active:scale-95 smooth-hover"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onTogglePin(note.id, !note.is_pinned)}
                title={note.is_pinned ? 'Unpin Note' : 'Pin Note'}
                aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
                aria-pressed={note.is_pinned}
                className={cn(
                  'p-1.5 rounded-lg bg-card-bg border border-card-border/50 active:scale-95 smooth-hover',
                  note.is_pinned
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'text-muted hover:text-text-base',
                )}
              >
                <Pin className={cn('w-3.5 h-3.5', note.is_pinned && 'fill-indigo-600 dark:fill-indigo-400')} aria-hidden="true" />
              </button>
              <button
                onClick={() => onTrash(note.id, true)}
                title="Move to Trash"
                aria-label="Move note to trash"
                className="p-1.5 rounded-lg bg-card-bg border border-card-border/50 text-muted hover:text-rose-500 hover:bg-rose-500/5 active:scale-95 smooth-hover"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content preview */}
      <div className="flex-1 text-xs text-muted/90 overflow-hidden mb-4 leading-relaxed flex items-center justify-center">
        {note.content && note.content.startsWith('data:image/') ? (
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden rounded-lg border border-card-border/40 bg-white dark:bg-zinc-900/60 p-2">
            <img
              src={note.content}
              alt={note.title || 'Sketch'}
              className="max-w-full max-h-full object-contain smooth-hover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <p className="line-clamp-6 whitespace-pre-wrap w-full text-left">
            {note.content_text || note.content || (
              <span className="text-muted/40 italic">Empty note. Open to add ideas...</span>
            )}
          </p>
        )}
      </div>

      {/* Footer — tags & date */}
      <div className="mt-auto pt-3 border-t border-card-border/40 flex flex-col gap-2.5">
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" aria-label="Tags">
            <Tag className="w-3 h-3 text-muted shrink-0" aria-hidden="true" />
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 px-2 py-0.5 rounded-md shrink-0 select-none"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[9px] text-muted font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" aria-hidden="true" />
            <time dateTime={note.updated_at || note.created_at}>
              {formatDate(note.updated_at || note.created_at)}
            </time>
          </span>
          {note.is_pinned && !note.is_trashed && !note.is_deleted && (
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 uppercase tracking-wide" aria-label="Pinned">
              <Pin className="w-2.5 h-2.5 fill-indigo-600 dark:fill-indigo-400" aria-hidden="true" />
              Pinned
            </span>
          )}
          {(note.is_trashed || note.is_deleted) && (
            <span className="text-rose-500 font-semibold flex items-center gap-0.5" aria-label="In trash">
              <ShieldAlert className="w-2.5 h-2.5" aria-hidden="true" /> Trashed
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default NoteCard;

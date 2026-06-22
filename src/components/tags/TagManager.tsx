'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Pencil, Check, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagBadge from './TagBadge';
import type { Tag } from '@/types/database.types';
import { toast } from 'react-hot-toast';

// Preset color palette (10 colors)
export const TAG_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#64748b', // Slate
] as const;

interface TagManagerProps {
  tags: Tag[];
  onClose: () => void;
  onCreateTag: (name: string, color: string) => Promise<void>;
  onRenameTag: (id: string, name: string) => Promise<void>;
  onRecolorTag: (id: string, color: string) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
}

export default function TagManager({
  tags,
  onClose,
  onCreateTag,
  onRenameTag,
  onRecolorTag,
  onDeleteTag,
}: TagManagerProps) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) { toast.error('Tag name cannot be empty'); return; }
    await onCreateTag(name, newColor);
    setNewName('');
    setNewColor(TAG_COLORS[0]);
  }, [newName, newColor, onCreateTag]);

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const commitEdit = useCallback(async (id: string) => {
    const name = editName.trim();
    if (!name) { toast.error('Tag name cannot be empty'); return; }
    await onRenameTag(id, name);
    setEditingId(null);
  }, [editName, onRenameTag]);

  const handleDelete = useCallback(async (id: string) => {
    await onDeleteTag(id);
    setConfirmDeleteId(null);
  }, [onDeleteTag]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-manager-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-md bg-card-bg border border-card-border rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-card-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <h2 id="tag-manager-title" className="text-sm font-bold text-text-base">Tag Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-card-border/60 text-muted hover:text-text-base smooth-hover"
            aria-label="Close tag manager"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Create new tag */}
        <div className="px-5 py-4 border-b border-card-border/60 space-y-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Create New Tag</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Tag name..."
              maxLength={50}
              aria-label="New tag name"
              className="flex-1 px-3 py-2 bg-muted-light/60 border border-card-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-text-base"
            />
            <button
              onClick={handleCreate}
              aria-label="Create tag"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold smooth-hover flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create</span>
            </button>
          </div>
          {/* Color swatches */}
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Tag color selection">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                aria-label={`Select color ${color}`}
                aria-pressed={newColor === color}
                style={{ backgroundColor: color }}
                className={cn(
                  'w-6 h-6 rounded-full border-2 smooth-hover hover:scale-110',
                  newColor === color ? 'border-white shadow-md scale-110' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </div>

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {tags.length === 0 ? (
            <p className="text-xs text-muted italic py-4 text-center">No tags yet. Create your first one above!</p>
          ) : (
            <AnimatePresence>
              {tags.map((tag) => (
                <motion.div
                  key={tag.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2.5 p-2.5 bg-muted-light/30 rounded-xl border border-card-border/40 group"
                >
                  {editingId === tag.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(tag.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      aria-label={`Rename tag ${tag.name}`}
                      className="flex-1 px-2 py-1 bg-card-bg border border-indigo-500/50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-text-base"
                    />
                  ) : (
                    <TagBadge tag={tag} className="flex-1 justify-start" />
                  )}

                  {/* Color swatches for existing tag */}
                  <div className="hidden group-hover:flex gap-1" role="group" aria-label="Change tag color">
                    {TAG_COLORS.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onRecolorTag(tag.id, color)}
                        aria-label={`Change to color ${color}`}
                        style={{ backgroundColor: color }}
                        className="w-3.5 h-3.5 rounded-full border border-white/20 smooth-hover hover:scale-110"
                      />
                    ))}
                  </div>

                  {editingId === tag.id ? (
                    <button
                      onClick={() => commitEdit(tag.id)}
                      aria-label="Save tag name"
                      className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 smooth-hover"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(tag)}
                      aria-label={`Rename tag ${tag.name}`}
                      className="p-1.5 rounded-lg text-muted hover:text-text-base hover:bg-muted-light smooth-hover opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}

                  {confirmDeleteId === tag.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(tag.id)}
                        aria-label="Confirm delete"
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold smooth-hover"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Cancel delete"
                        className="px-2 py-1 bg-muted-light text-muted rounded-lg text-[10px] font-bold smooth-hover"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(tag.id)}
                      aria-label={`Delete tag ${tag.name}`}
                      className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/5 smooth-hover opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

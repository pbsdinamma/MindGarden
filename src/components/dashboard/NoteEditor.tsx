'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Pin, Tag, Plus, Check, Trash2, Save, Sparkles } from 'lucide-react';
import { NoteInput, Note } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import Sketchpad from './Sketchpad';

interface NoteEditorProps {
  note: Note | null; // Null means creating a new note
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: NoteInput) => void;
  onDelete?: (id: string) => void;
}

// Harmonious Pastel Colors list
const COLOR_PALETTE = [
  { hex: '#f3f4f6', name: 'Neutral Slate' },
  { hex: '#fef08a', name: 'Muted Amber' },
  { hex: '#bbf7d0', name: 'Mint Emerald' },
  { hex: '#bfdbfe', name: 'Clear Sky' },
  { hex: '#fbcfe8', name: 'Blossom Pink' },
  { hex: '#ddd6fe', name: 'Lilac Violet' },
  { hex: '#fecaca', name: 'Soft Coral' },
];

export default function NoteEditor({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#f3f4f6');
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  // Editor mode tab: write (standard text) vs sketch (drawing pad)
  const [activeEditorTab, setActiveEditorTab] = useState<'write' | 'sketch'>('write');
  const [aiLoading, setAiLoading] = useState(false);

  // Tag input temporary state
  const [tagInput, setTagInput] = useState('');

  // Hydrate fields if editing an existing note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color || '#f3f4f6');
      setTags(note.tags || []);
      setIsPinned(note.is_pinned || false);
      
      // Auto-toggle to sketch tab if note contains drawing data
      const isDrawing = note.content && note.content.startsWith('data:image/');
      setActiveEditorTab(isDrawing ? 'sketch' : 'write');
    } else {
      // Reset fields for new note
      setTitle('');
      setContent('');
      setColor('#f3f4f6');
      setTags([]);
      setIsPinned(false);
      setActiveEditorTab('write');
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const formattedTag = tagInput.trim().toLowerCase();
    if (!formattedTag) return;
    
    if (tags.includes(formattedTag)) {
      toast.error('Tag already exists on this note');
      return;
    }

    if (tags.length >= 8) {
      toast.error('Maximum 8 tags allowed per note');
      return;
    }

    setTags([...tags, formattedTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI Summarization Action
  const handleAiSummarize = async () => {
    if (!content || !content.trim()) {
      toast.error('Please write some content first before summarizing');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || 'Summarization failed');
      }

      const data = await response.json();
      if (data?.summary) {
        setContent((prev) => `${prev}${data.summary}`);
        toast.success('Note summarized successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during AI summarization');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    // Basic checks
    if (!title.trim() && !content.trim()) {
      toast.error('Cannot save empty note');
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      color,
      tags,
      is_pinned: isPinned,
      is_archived: note?.is_archived || false,
      is_trashed: note?.is_trashed || false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
      />

      {/* Editor Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-card-bg border border-card-border rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10 relative"
      >
        {/* Editor Top Bar */}
        <div className="px-6 py-4 border-b border-card-border/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted hidden sm:inline truncate shrink-0">
              {note ? 'Edit Note' : 'Create Note'}
            </span>

            {/* Mode Switch Tab Selector */}
            <div className="flex bg-muted-light p-1 rounded-xl relative w-48 text-center shrink-0 border border-card-border/30">
              <button
                type="button"
                onClick={() => setActiveEditorTab('write')}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold rounded-lg relative z-10 transition-all duration-200 smooth-hover",
                  activeEditorTab === 'write' ? "text-indigo-600 dark:text-indigo-400 bg-card-bg shadow-sm" : "text-muted hover:text-text-base"
                )}
              >
                Write Tab
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveEditorTab('sketch');
                  // Set default neutral background color if canvas is launched for a sketch
                  if (color === '#f3f4f6') {
                    setColor('#ffffff');
                  }
                }}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold rounded-lg relative z-10 transition-all duration-200 smooth-hover",
                  activeEditorTab === 'sketch' ? "text-indigo-600 dark:text-indigo-400 bg-card-bg shadow-sm" : "text-muted hover:text-text-base"
                )}
              >
                Sketchpad
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pin Toggle */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin Note' : 'Pin Note'}
              className={cn(
                'p-2.5 rounded-xl border border-card-border/60 smooth-hover active:scale-95',
                isPinned ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-muted hover:text-text-base'
              )}
            >
              <Pin className={cn('w-4 h-4', isPinned && 'fill-indigo-600 dark:fill-indigo-400')} />
            </button>

            {/* Permanent Delete inside editor (Only if note exists) */}
            {note && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete this note?')) {
                    onDelete(note.id);
                  }
                }}
                title="Delete Permanently"
                className="p-2.5 rounded-xl border border-card-border/60 text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 smooth-hover active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-card-border/60 text-muted hover:text-text-base smooth-hover active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Note Title Input */}
          <div className="space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              className="w-full text-xl font-bold bg-transparent border-0 focus:outline-none focus:ring-0 text-text-base placeholder:text-muted/40"
            />
          </div>

          {/* Color Selector row */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Background Color</label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTE.map((item) => {
                const isSelected = color === item.hex;
                return (
                  <button
                    key={item.hex}
                    type="button"
                    onClick={() => setColor(item.hex)}
                    title={item.name}
                    style={{ backgroundColor: item.hex }}
                    className={cn(
                      "w-8 h-8 rounded-full border shadow-sm relative flex items-center justify-center smooth-hover hover:scale-105 active:scale-95",
                      isSelected ? "border-indigo-600 dark:border-indigo-400 scale-105" : "border-card-border"
                    )}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-zinc-800" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag manager */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Tags Management</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add a tag..."
                  className="w-full pl-9 pr-4 py-2 bg-muted-light/60 border border-card-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-text-base"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl smooth-hover active:scale-95 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Render active tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 pl-2 pr-1.5 py-1 rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-950/80 text-muted hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Conditional Editor Input based on active tab */}
          {activeEditorTab === 'write' ? (
            <div className="space-y-3">
              {/* AI Summarize Actions */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAiSummarize}
                  disabled={aiLoading}
                  className={cn(
                    "py-1.5 px-3.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/65 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-xl smooth-hover flex items-center gap-1.5 active:scale-95 border border-indigo-100/50 dark:border-indigo-900/30 disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  {aiLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>AI Summarize</span>
                </button>
              </div>

              {/* Note Content TextArea */}
              <textarea
                value={content.startsWith('data:image/') ? '' : content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start capturing your amazing ideas here..."
                rows={12}
                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm leading-relaxed text-text-base placeholder:text-muted/40 resize-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Drawing Pad</label>
              <Sketchpad
                value={content.startsWith('data:image/') ? content : ''}
                onChange={(val) => setContent(val)}
              />
            </div>
          )}
        </div>

        {/* Action buttons footer */}
        <div className="px-6 py-4 bg-muted-light/40 border-t border-card-border flex items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-card-border/80 text-muted hover:text-text-base hover:bg-muted-light smooth-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 smooth-hover flex items-center gap-2 group"
          >
            <Save className="w-4 h-4" />
            <span>Save Note</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

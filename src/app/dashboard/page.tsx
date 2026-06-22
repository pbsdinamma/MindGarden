'use client';

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Note, NoteInput, SortOption } from '@/types/database.types';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import NoteCard from '@/components/dashboard/NoteCard';
import NoteEditor from '@/components/dashboard/NoteEditor';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import SearchModal from '@/components/search/SearchModal';
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import {
  Plus,
  Sparkles,
  FileText,
  Trash2,
  Inbox,
  Archive,
  SortAsc,
  SortDesc,
  ArrowDownAZ,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { extractPlainText } from '@/lib/utils/editor';

type ActiveTab = 'all' | 'pinned' | 'trash' | 'tag';

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'updated', label: 'Last Updated', icon: <SortDesc className="w-3.5 h-3.5" /> },
  { value: 'created', label: 'Date Created', icon: <SortAsc className="w-3.5 h-3.5" /> },
  { value: 'alpha', label: 'Alphabetical', icon: <ArrowDownAZ className="w-3.5 h-3.5" /> },
];

const SORT_LS_KEY = 'mindgarden-sort-order';

function getSortFromStorage(): SortOption {
  try {
    const saved = localStorage.getItem(SORT_LS_KEY) as SortOption | null;
    if (saved && ['updated', 'created', 'alpha'].includes(saved)) return saved;
  } catch { /* ignore */ }
  return 'updated';
}

export default function DashboardPage() {
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOption>('updated');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const { optimisticUpdate } = useOptimisticUpdate<Note[]>();

  // Load sort from localStorage on mount
  useEffect(() => {
    setSortOrder(getSortFromStorage());
  }, []);

  // Persist sort to localStorage and URL
  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOrder(sort);
    try { localStorage.setItem(SORT_LS_KEY, sort); } catch { /* ignore */ }
    const url = new URL(window.location.href);
    url.searchParams.set('sort', sort);
    window.history.replaceState({}, '', url.toString());
    setShowSortMenu(false);
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotes = useCallback(async (userId?: string) => {
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        uid = user.id;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', uid)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Error loading notes: ' + message);
    }
  }, [supabase]);

  useEffect(() => {
    async function initDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserName(user.user_metadata?.full_name || '');
          await fetchNotes(user.id);
        }
      } catch {
        toast.error('Failed to initialize workspace');
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [fetchNotes, supabase]);

  // ─── Tags ───────────────────────────────────────────────────────────────────
  const getTagsList = useCallback(() => {
    const allTags = notes
      .filter((n) => !n.is_trashed && !n.is_deleted)
      .flatMap((n) => n.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [notes]);

  const tags = getTagsList();

  // ─── Save note ──────────────────────────────────────────────────────────────
  const handleSaveNote = useCallback(async (noteData: NoteInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: noteData.title,
            content: noteData.content,
            content_text: noteData.content_text ?? extractPlainText(noteData.content),
            color: noteData.color,
            tags: noteData.tags,
            is_pinned: noteData.is_pinned,
            is_archived: noteData.is_archived,
            is_trashed: noteData.is_trashed,
            is_deleted: noteData.is_deleted,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success('Note updated');
      } else {
        const { error } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title: noteData.title,
            content: noteData.content,
            content_text: noteData.content_text ?? extractPlainText(noteData.content),
            color: noteData.color,
            tags: noteData.tags,
            is_pinned: noteData.is_pinned,
            is_archived: noteData.is_archived,
            is_trashed: false,
            is_deleted: false,
          });

        if (error) throw error;
        toast.success('Note created successfully!');
      }

      setEditorOpen(false);
      setEditingNote(null);
      await fetchNotes(user.id);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? JSON.stringify(err);
      console.error('[handleSaveNote] error:', err);
      toast.error('Failed to save note: ' + message);
    }
  }, [editingNote, fetchNotes, supabase]);

  // ─── Pin toggle — optimistic ─────────────────────────────────────────────
  const handleTogglePin = useCallback(async (id: string, isPinned: boolean) => {
    await optimisticUpdate(
      notes,
      (prev) => prev.map((n) => n.id === id ? { ...n, is_pinned: isPinned } : n),
      async () => {
        const { error } = await supabase
          .from('notes')
          .update({ is_pinned: isPinned, pinned_at: isPinned ? new Date().toISOString() : null })
          .eq('id', id);
        if (error) throw error;
        toast.success(isPinned ? 'Note pinned' : 'Note unpinned');
      },
      setNotes,
    );
  }, [notes, optimisticUpdate, supabase]);

  // ─── Trash — optimistic ──────────────────────────────────────────────────
  const handleTrashNote = useCallback(async (id: string, isTrashed: boolean) => {
    const toastId = isTrashed
      ? toast.loading('Moving to trash…')
      : toast.loading('Restoring note…');

    await optimisticUpdate(
      notes,
      (prev) => prev.map((n) =>
        n.id === id
          ? { ...n, is_trashed: isTrashed, is_deleted: isTrashed, is_pinned: isTrashed ? false : n.is_pinned }
          : n,
      ),
      async () => {
        const endpoint = isTrashed ? `/api/notes/${id}/trash` : `/api/notes/${id}/restore`;
        const r = await fetch(endpoint, { method: 'POST' });
        if (!r.ok) throw new Error('Action failed');
        toast.dismiss(toastId);
        if (isTrashed) {
          toast.success('Moved to trash', {
            id: 'trash-undo',
            duration: 5000,
          });
        } else {
          toast.success('Note restored from trash');
        }
      },
      setNotes,
    );
  }, [notes, optimisticUpdate]);

  // ─── Hard delete ─────────────────────────────────────────────────────────
  const handleDeleteNote = useCallback(async (id: string) => {
    await optimisticUpdate(
      notes,
      (prev) => prev.filter((n) => n.id !== id),
      async () => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
        toast.success('Note permanently deleted');
        setEditorOpen(false);
        setEditingNote(null);
      },
      setNotes,
    );
  }, [notes, optimisticUpdate, supabase]);

  // ─── Filter notes ────────────────────────────────────────────────────────
  const getFilteredNotes = useCallback(() => {
    let result = [...notes];

    if (activeTab === 'pinned') {
      result = result.filter((n) => n.is_pinned && !n.is_trashed && !n.is_deleted);
    } else if (activeTab === 'trash') {
      result = result.filter((n) => n.is_trashed || n.is_deleted);
    } else if (activeTab === 'tag') {
      result = result.filter((n) => !n.is_trashed && !n.is_deleted && selectedTag && n.tags?.includes(selectedTag));
    } else {
      result = result.filter((n) => !n.is_trashed && !n.is_deleted);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((n) =>
        n.title.toLowerCase().includes(query) ||
        (n.content_text || n.content).toLowerCase().includes(query) ||
        n.tags?.some((t) => t.toLowerCase().includes(query)),
      );
    }

    // Client-side sort (pinned always float to top)
    if (activeTab !== 'trash') {
      const pinned = result.filter((n) => n.is_pinned);
      const unpinned = result.filter((n) => !n.is_pinned);

      const sortFn = (a: Note, b: Note) => {
        if (sortOrder === 'alpha') return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
        if (sortOrder === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      };

      result = [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
    }

    return result;
  }, [notes, activeTab, selectedTag, searchQuery, sortOrder]);

  const filteredNotes = getFilteredNotes();

  // ─── Pinned / unpinned divider ────────────────────────────────────────────
  const pinnedCount = filteredNotes.filter((n) => n.is_pinned).length;
  const showDivider = pinnedCount > 0 && pinnedCount < filteredNotes.length && activeTab !== 'trash';

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setEditorOpen(true);
  }, []);

  const handleNewNote = useCallback(() => {
    setEditingNote(null);
    setEditorOpen(true);
  }, []);

  // Navigate to a note by ID (from search results)
  const handleSelectSearchNote = useCallback((id: string) => {
    const found = notes.find((n) => n.id === id);
    if (found) {
      handleEditNote(found);
    }
  }, [notes, handleEditNote]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => setSearchOpen(true) },
    { key: 'n', ctrl: true, handler: () => handleNewNote() },
    { key: 's', ctrl: true, allowInEditor: true, handler: () => { /* saveNow handled inside NoteEditor */ } },
    { key: '?', handler: () => setShortcutsOpen(true) },
    { key: 'Escape', handler: () => {
      setSearchOpen(false);
      setShortcutsOpen(false);
      if (editorOpen) { setEditorOpen(false); setEditingNote(null); }
    }},
  ]);

  const currentSortOption = SORT_OPTIONS.find((s) => s.value === sortOrder) ?? SORT_OPTIONS[0];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        tags={tags}
        onNewNote={handleNewNote}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        userEmail={userEmail}
        userName={userName}
      />

      {/* Main workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ErrorBoundary fallbackTitle="Header failed to load">
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setMobileOpen={setMobileOpen}
            userName={userName}
            userEmail={userEmail}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
        </ErrorBoundary>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Mobile greeting */}
          <div className="sm:hidden mb-6">
            <h1 className="text-xl font-bold flex items-center gap-1.5">
              Hi, {userName ? userName.split(' ')[0] : 'Creator'}
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" aria-hidden="true" />
            </h1>
            <p className="text-[10px] text-muted">MindGarden Sanctuary Space</p>
          </div>

          {/* List header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-text-base flex items-center gap-2">
                {activeTab === 'all' && (<><Inbox className="w-4 h-4 text-indigo-500" aria-hidden="true" /><span>All Notes</span></>)}
                {activeTab === 'pinned' && (<><Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" /><span>Pinned Notes</span></>)}
                {activeTab === 'trash' && (<><Trash2 className="w-4 h-4 text-rose-500" aria-hidden="true" /><span>Trash Sanctuary</span></>)}
                {activeTab === 'tag' && (<><Archive className="w-4 h-4 text-indigo-500" aria-hidden="true" /><span>Tag: #{selectedTag}</span></>)}
              </h2>
              <p className="text-xs text-muted">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} found
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort control */}
              {activeTab !== 'trash' && (
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortMenu((v) => !v)}
                    aria-label="Change sort order"
                    aria-haspopup="listbox"
                    aria-expanded={showSortMenu}
                    className="flex items-center gap-1.5 py-2 px-3 bg-muted-light/60 border border-card-border/80 rounded-xl text-xs text-muted hover:text-text-base smooth-hover"
                  >
                    {currentSortOption.icon}
                    <span className="hidden sm:inline">{currentSortOption.label}</span>
                  </button>
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1.5 w-44 bg-card-bg border border-card-border rounded-xl shadow-xl z-20 overflow-hidden"
                        role="listbox"
                        aria-label="Sort options"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            role="option"
                            aria-selected={sortOrder === opt.value}
                            onClick={() => handleSortChange(opt.value)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left smooth-hover',
                              sortOrder === opt.value
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                                : 'text-text-base hover:bg-muted-light',
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Quick note button */}
              {!loading && activeTab !== 'trash' && (
                <button
                  onClick={handleNewNote}
                  aria-label="Create quick note"
                  className="py-2 px-3.5 bg-indigo-600/10 hover:bg-indigo-600/20 dark:bg-indigo-400/10 dark:hover:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl smooth-hover flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Quick Note</span>
                </button>
              )}
            </div>
          </div>

          {/* Content area */}
          <ErrorBoundary fallbackTitle="Notes failed to load">
            {loading ? (
              <SkeletonGrid count={6} />
            ) : filteredNotes.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center"
                aria-live="polite"
              >
                <div className="p-4 bg-muted-light/50 border border-card-border/60 rounded-3xl mb-4 text-muted/80">
                  <FileText className="w-10 h-10" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-text-base">
                  {searchQuery
                    ? 'No matching notes'
                    : activeTab === 'trash'
                    ? 'Trash is empty'
                    : activeTab === 'tag'
                    ? `No notes tagged #${selectedTag}`
                    : 'Sanctuary is empty'}
                </h3>
                <p className="text-xs text-muted max-w-sm mt-2">
                  {searchQuery
                    ? `We couldn't find any notes matching "${searchQuery}". Try different keywords.`
                    : activeTab === 'trash'
                    ? 'Your trash is empty. Discarded notes will appear here.'
                    : activeTab === 'tag'
                    ? 'No notes have this tag yet. Clear the filter or add the tag to a note.'
                    : 'Start capturing your thoughts, structuring tasks, or organizing projects today.'}
                </p>
                {!searchQuery && activeTab !== 'trash' && activeTab !== 'tag' && (
                  <button
                    onClick={handleNewNote}
                    className="mt-6 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 smooth-hover flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Create Your First Note</span>
                  </button>
                )}
                {activeTab === 'tag' && (
                  <button
                    onClick={() => { setActiveTab('all'); setSelectedTag(null); }}
                    className="mt-4 text-xs text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Clear tag filter
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note, index) => (
                    <React.Fragment key={note.id}>
                      {/* Divider between pinned and unpinned */}
                      {showDivider && index === pinnedCount && (
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="col-span-full flex items-center gap-3 my-1"
                          aria-label="Other notes"
                        >
                          <div className="flex-1 h-px bg-card-border/60" />
                          <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Other Notes</span>
                          <div className="flex-1 h-px bg-card-border/60" />
                        </motion.div>
                      )}
                      <NoteCard
                        note={note}
                        onEdit={handleEditNote}
                        onTogglePin={handleTogglePin}
                        onTrash={handleTrashNote}
                        onDelete={handleDeleteNote}
                      />
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Note Editor drawer */}
      <AnimatePresence>
        {editorOpen && (
          <ErrorBoundary fallbackTitle="Editor failed to load">
            <NoteEditor
              note={editingNote}
              isOpen={editorOpen}
              onClose={() => { setEditorOpen(false); setEditingNote(null); }}
              onSave={handleSaveNote}
              onDelete={editingNote ? handleDeleteNote : undefined}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <ErrorBoundary fallbackTitle="Search failed to load">
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectNote={handleSelectSearchNote}
        />
      </ErrorBoundary>

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

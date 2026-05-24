'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Note, NoteInput } from '@/types/database.types';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import NoteCard from '@/components/dashboard/NoteCard';
import NoteEditor from '@/components/dashboard/NoteEditor';
import { 
  Plus, 
  Sparkles, 
  FileText, 
  Trash2, 
  Search, 
  Inbox, 
  HelpCircle,
  Archive,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

type ActiveTab = 'all' | 'pinned' | 'trash' | 'tag';

export default function DashboardPage() {
  const supabase = createClient();

  // User details
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout filter states
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Fetch current user details & notes
  useEffect(() => {
    async function initDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserName(user.user_metadata?.full_name || '');
          await fetchNotes(user.id);
        }
      } catch (err: any) {
        toast.error('Failed to initialize workspace');
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  const fetchNotes = async (userId?: string) => {
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
    } catch (err: any) {
      toast.error('Error loading notes: ' + err.message);
    }
  };

  // Extract distinct tag lists from notes
  const getTagsList = () => {
    const allTags = notes
      .filter((n) => !n.is_trashed) // exclude trashed notes from tag sidebar
      .flatMap((n) => n.tags || []);
    return Array.from(new Set(allTags)).sort();
  };

  const tags = getTagsList();

  // Create or Update Note Action
  const handleSaveNote = async (noteData: NoteInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingNote) {
        // Update Note
        const { error } = await supabase
          .from('notes')
          .update({
            title: noteData.title,
            content: noteData.content,
            color: noteData.color,
            tags: noteData.tags,
            is_pinned: noteData.is_pinned,
            is_archived: noteData.is_archived,
            is_trashed: noteData.is_trashed,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success('Note updated');
      } else {
        // Create Note
        const { error } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title: noteData.title,
            content: noteData.content,
            color: noteData.color,
            tags: noteData.tags,
            is_pinned: noteData.is_pinned,
            is_archived: noteData.is_archived,
            is_trashed: noteData.is_trashed
          });

        if (error) throw error;
        toast.success('Note created successfully!');
      }

      setEditorOpen(false);
      setEditingNote(null);
      await fetchNotes(user.id);
    } catch (err: any) {
      toast.error('Failed to save note: ' + err.message);
    }
  };

  // Toggle Pinned Status
  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: isPinned })
        .eq('id', id);

      if (error) throw error;
      toast.success(isPinned ? 'Note pinned' : 'Note unpinned');
      await fetchNotes();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  // Soft-Delete (Trash) & Restore Note Action
  const handleTrashNote = async (id: string, isTrashed: boolean) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          is_trashed: isTrashed,
          is_pinned: isTrashed ? false : undefined // unpin note when moving to trash
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(isTrashed ? 'Moved to trash' : 'Note restored from trash');
      await fetchNotes();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  // Hard-Delete Note Permanently Action
  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Note permanently deleted');
      setEditorOpen(false);
      setEditingNote(null);
      await fetchNotes();
    } catch (err: any) {
      toast.error('Deletion failed: ' + err.message);
    }
  };

  // Filter notes based on active sidebar tab & search queries
  const getFilteredNotes = () => {
    let result = [...notes];

    // Filter by Active Tab
    if (activeTab === 'pinned') {
      result = result.filter((n) => n.is_pinned && !n.is_trashed);
    } else if (activeTab === 'trash') {
      result = result.filter((n) => n.is_trashed);
    } else if (activeTab === 'tag') {
      result = result.filter((n) => !n.is_trashed && selectedTag && n.tags?.includes(selectedTag));
    } else {
      // 'all' notes tab - shows non-trashed notes
      result = result.filter((n) => !n.is_trashed);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((n) => 
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  };

  const filteredNotes = getFilteredNotes();

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  // Skeleton Loader for initial load state
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card-bg border border-card-border/60 rounded-2xl p-5 h-60 space-y-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted-light rounded w-2/3" />
            <div className="h-6 bg-muted-light rounded w-8" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted-light rounded w-full" />
            <div className="h-3 bg-muted-light rounded w-5/6" />
            <div className="h-3 bg-muted-light rounded w-4/5" />
          </div>
          <div className="pt-8 border-t border-card-border/40 space-y-2">
            <div className="h-3 bg-muted-light rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar Navigation */}
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

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setMobileOpen={setMobileOpen}
          userName={userName}
          userEmail={userEmail}
        />

        {/* Dynamic Inner Dashboard Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Dashboard greeting banner (Mobile welcome display) */}
          <div className="sm:hidden mb-6">
            <h1 className="text-xl font-bold flex items-center gap-1.5">
              Hi, {userName ? userName.split(' ')[0] : 'Creator'}
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            </h1>
            <p className="text-[10px] text-muted">MindGarden Sanctuary Space</p>
          </div>

          {/* List/Grid Header Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-text-base flex items-center gap-2">
                {activeTab === 'all' && (
                  <>
                    <Inbox className="w-4 h-4 text-indigo-500" />
                    <span>All Notes</span>
                  </>
                )}
                {activeTab === 'pinned' && (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Pinned Notes</span>
                  </>
                )}
                {activeTab === 'trash' && (
                  <>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Trash Sanctuary</span>
                  </>
                )}
                {activeTab === 'tag' && (
                  <>
                    <Archive className="w-4 h-4 text-indigo-500" />
                    <span>Tag: #{selectedTag}</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-muted">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} found
              </p>
            </div>
            
            {/* Quick Create Shortcut (Right Header side) */}
            {!loading && activeTab !== 'trash' && (
              <button
                onClick={handleNewNote}
                className="py-2 px-3.5 bg-indigo-600/10 hover:bg-indigo-600/20 dark:bg-indigo-400/10 dark:hover:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl smooth-hover flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Note</span>
              </button>
            )}
          </div>

          {/* Core Content Loading or Display grid */}
          {loading ? (
            renderSkeletons()
          ) : filteredNotes.length === 0 ? (
            /* Empty State Container */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center"
            >
              <div className="p-4 bg-muted-light/50 border border-card-border/60 rounded-3xl mb-4 text-muted/80">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-text-base">
                {searchQuery ? 'No matching notes' : 'Sanctuary is empty'}
              </h3>
              <p className="text-xs text-muted max-w-sm mt-2">
                {searchQuery 
                  ? 'We couldn\'t find any notes matching your keywords. Try refining your search queries.' 
                  : activeTab === 'trash'
                  ? 'Your trash is empty. Discarded notes will appear here.'
                  : 'Start capturing your thoughts, structuring tasks, or organizing projects today.'}
              </p>
              {!searchQuery && activeTab !== 'trash' && (
                <button
                  onClick={handleNewNote}
                  className="mt-6 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 smooth-hover flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Note</span>
                </button>
              )}
            </motion.div>
          ) : (
            /* Render active Notes Cards Grid */
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onTogglePin={handleTogglePin}
                    onTrash={handleTrashNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* Slide overlay Editor Dialogue Drawer */}
      <AnimatePresence>
        {editorOpen && (
          <NoteEditor
            note={editingNote}
            isOpen={editorOpen}
            onClose={() => {
              setEditorOpen(false);
              setEditingNote(null);
            }}
            onSave={handleSaveNote}
            onDelete={editingNote ? handleDeleteNote : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Pin, 
  Trash2, 
  Tag, 
  Plus, 
  LogOut, 
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

type ActiveTab = 'all' | 'pinned' | 'trash' | 'tag';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  tags: string[];
  onNewNote: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  userEmail: string;
  userName: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedTag,
  setSelectedTag,
  tags,
  onNewNote,
  mobileOpen,
  setMobileOpen,
  userEmail,
  userName
}: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error signing out');
    }
  };

  const navItems = [
    { id: 'all', label: 'All Notes', icon: FileText },
    { id: 'pinned', label: 'Pinned', icon: Pin },
    { id: 'trash', label: 'Trash / Archive', icon: Trash2 },
  ] as const;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card-bg border-r border-card-border p-5 text-text-base relative">
      {/* Brand Logo */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              MindGarden
            </h2>
            <span className="text-[10px] text-muted font-medium uppercase tracking-wider">Digital Sanctuary</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg bg-muted-light border border-card-border text-muted hover:text-text-base smooth-hover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Note Button */}
      <button
        onClick={() => {
          onNewNote();
          setMobileOpen(false);
        }}
        className="w-full mb-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        <span>Create Note</span>
      </button>

      {/* Navigation Tabs */}
      <div className="space-y-1 mb-8">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 block mb-2">Navigation</span>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedTag(null);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20" 
                  : "text-muted hover:text-text-base hover:bg-muted-light"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-indicator" 
                  className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tags section */}
      <div className="flex-1 overflow-y-auto mb-6 pr-1">
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Tags</span>
          <Layers className="w-3.5 h-3.5 text-muted" />
        </div>
        {tags.length === 0 ? (
          <p className="text-xs text-muted/60 italic px-2 py-1">No tags created yet. Add tags inside your notes!</p>
        ) : (
          <div className="space-y-1">
            {tags.map((tag) => {
              const isSelected = activeTab === 'tag' && selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTab('tag');
                    setSelectedTag(tag);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                    isSelected
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "text-muted hover:text-text-base hover:bg-muted-light"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tag}</span>
                  </div>
                  <span className="text-[10px] bg-muted-light px-1.5 py-0.5 rounded-md border border-card-border/50 text-muted group-hover:text-text-base">
                    #
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom User Area */}
      <div className="pt-4 border-t border-card-border mt-auto">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {userName ? userName.substring(0, 2).toUpperCase() : userEmail.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-base truncate">{userName || 'Sanctuary Explorer'}</p>
            <p className="text-[10px] text-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Framer Motion) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 max-w-[80vw] z-40"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

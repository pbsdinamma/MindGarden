'use client';

import React from 'react';
import { Menu, Sun, Moon, Sparkles, HelpCircle, Search } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setMobileOpen: (open: boolean) => void;
  userName: string;
  userEmail: string;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  setMobileOpen,
  userName,
  userEmail,
  onOpenSearch,
  onOpenShortcuts,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 glass-effect border-b border-card-border px-6 py-4 flex items-center justify-between gap-4">
      {/* Mobile sidebar trigger & Welcome message */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar navigation"
          className="lg:hidden p-2 rounded-xl bg-muted-light border border-card-border text-muted hover:text-text-base smooth-hover"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-base font-bold flex items-center gap-1.5">
            Hello, {userName ? userName.split(' ')[0] : 'Mindful Creator'}
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" aria-hidden="true" />
          </h1>
          <p className="text-[10px] text-muted font-medium">Welcome back to your workspace</p>
        </div>
      </div>

      {/* Search bar — clicking opens the modal, input also filters inline */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={onOpenSearch}
          placeholder="Search notes… (Ctrl+K)"
          aria-label="Search notes"
          readOnly
          onClick={onOpenSearch}
          className="w-full pl-10 pr-4 py-2.5 bg-muted-light/60 border border-card-border/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-text-base placeholder:text-muted/70 cursor-pointer"
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Keyboard shortcuts help button */}
        <button
          onClick={onOpenShortcuts}
          aria-label="View keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="p-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm text-muted hover:text-text-base smooth-hover hover:scale-105"
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title="Toggle Light/Dark Theme"
          className="p-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm text-text-base smooth-hover hover:scale-105"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" aria-hidden="true" />
          )}
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-card-border flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400"
          aria-label={`Logged in as ${userName || userEmail}`}
        >
          {userName ? userName.substring(0, 1).toUpperCase() : userEmail.substring(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

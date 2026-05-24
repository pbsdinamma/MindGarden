'use client';

import React from 'react';
import { Menu, Search, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setMobileOpen: (open: boolean) => void;
  userName: string;
  userEmail: string;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  setMobileOpen,
  userName,
  userEmail
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 glass-effect border-b border-card-border px-6 py-4 flex items-center justify-between gap-4">
      {/* Mobile Sidebar Trigger & Welcome message */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-muted-light border border-card-border text-muted hover:text-text-base smooth-hover"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-base font-bold flex items-center gap-1.5">
            Hello, {userName ? userName.split(' ')[0] : 'Mindful Creator'}
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-[10px] text-muted font-medium">Welcome back to your workspace</p>
        </div>
      </div>

      {/* Modern Search bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search note titles, content, or tags..."
          className="w-full pl-10 pr-4 py-2.5 bg-muted-light/60 border border-card-border/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-text-base placeholder:text-muted/70"
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm text-text-base smooth-hover hover:scale-105"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Small avatar display */}
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-card-border flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
          {userName ? userName.substring(0, 1).toUpperCase() : userEmail.substring(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

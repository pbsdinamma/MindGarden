'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { keys: [mod, 'S'], description: 'Save current note immediately' },
  { keys: [mod, 'N'], description: 'Create a new note' },
  { keys: [mod, 'K'], description: 'Open search' },
  { keys: ['Del / Backspace'], description: 'Move selected note to trash (list focused)' },
  { keys: ['Escape'], description: 'Close any open modal or panel' },
];

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm bg-card-bg border border-card-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-card-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h2 id="shortcuts-title" className="text-sm font-bold text-text-base">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close shortcuts"
                className="p-1.5 rounded-lg text-muted hover:text-text-base hover:bg-muted-light smooth-hover"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <p className="text-xs text-text-base">{s.description}</p>
                  <div className="flex gap-1 shrink-0">
                    {s.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-0.5 bg-muted-light border border-card-border rounded-md text-[10px] font-mono font-bold text-text-base"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-card-border/40 bg-muted-light/30">
              <p className="text-[10px] text-muted">Press <kbd className="px-1 bg-card-bg border border-card-border rounded text-[9px]">?</kbd> in the header to show this panel</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

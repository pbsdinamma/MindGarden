'use client';

import { useCallback, useEffect, useRef } from 'react';

type ShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  meta?: boolean;         // Cmd on Mac
  shift?: boolean;
  allowInEditor?: boolean; // If true, fires even inside contenteditable / textarea
  handler: ShortcutHandler;
}

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isInEditor(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  return (
    INPUT_TAGS.has(el.tagName) ||
    el.isContentEditable ||
    el.closest('[contenteditable="true"]') !== null
  );
}

function matchesModifier(e: KeyboardEvent, def: ShortcutDefinition): boolean {
  const needsCtrlOrMeta = def.ctrl || def.meta;
  if (needsCtrlOrMeta && !(e.ctrlKey || e.metaKey)) return false;
  if (!needsCtrlOrMeta && (e.ctrlKey || e.metaKey)) return false;
  if (def.shift !== undefined && def.shift !== e.shiftKey) return false;
  return e.key === def.key || e.key.toLowerCase() === def.key.toLowerCase();
}

/**
 * Register global keyboard shortcuts with proper cleanup.
 *
 * Usage:
 *   useKeyboardShortcuts([
 *     { key: 'k', ctrl: true, handler: openSearch },
 *     { key: 's', ctrl: true, allowInEditor: true, handler: save },
 *   ]);
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]): void {
  const shortcutsRef = useRef<ShortcutDefinition[]>(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const inEditor = isInEditor(e.target);

    for (const def of shortcutsRef.current) {
      if (inEditor && !def.allowInEditor) continue;
      if (matchesModifier(e, def)) {
        e.preventDefault();
        def.handler(e);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Detect if user is on macOS for platform-aware shortcut labels.
 */
export function useIsMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

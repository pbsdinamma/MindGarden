'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  value: string;
  noteId: string;
  enabled: boolean;
  onSave: (value: string) => Promise<void>;
  debounceMs?: number;
}

interface UseAutosaveReturn {
  saveStatus: SaveStatus;
  saveNow: () => void;
}

/**
 * Debounced autosave hook.
 * - Debounces saves by `debounceMs` (default 1000ms) after last change.
 * - Only fires when value actually changed since last successful save.
 * - Cancels pending debounce on noteId change.
 * - Warns user on unmount with unsaved changes via beforeunload.
 * - Returns saveStatus and an imperative saveNow() bypass.
 */
export function useAutosave({
  value,
  noteId,
  enabled,
  onSave,
  debounceMs = 1000,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Track the last successfully saved value to avoid redundant saves
  const lastSavedValueRef = useRef<string>(value);
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingValueRef = useRef<string>(value);

  // Keep pending value in sync
  pendingValueRef.current = value;

  const performSave = useCallback(
    async (valueToSave: string) => {
      if (!enabled || isSavingRef.current) return;
      if (valueToSave === lastSavedValueRef.current) return;

      isSavingRef.current = true;
      if (isMountedRef.current) setSaveStatus('saving');

      try {
        await onSave(valueToSave);
        lastSavedValueRef.current = valueToSave;
        if (isMountedRef.current) {
          setSaveStatus('saved');
          // Auto-reset to idle after 2 seconds
          setTimeout(() => {
            if (isMountedRef.current) setSaveStatus('idle');
          }, 2000);
        }
      } catch {
        if (isMountedRef.current) setSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    },
    [enabled, onSave],
  );

  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    performSave(pendingValueRef.current);
  }, [performSave]);

  // Reset last saved ref when noteId changes and cancel any pending debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    lastSavedValueRef.current = value;
    setSaveStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  // Schedule debounced save on value change
  useEffect(() => {
    if (!enabled) return;
    if (value === lastSavedValueRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(pendingValueRef.current);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, enabled, debounceMs, performSave]);

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        enabled &&
        pendingValueRef.current !== lastSavedValueRef.current
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled]);

  return { saveStatus, saveNow };
}

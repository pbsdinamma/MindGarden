'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface UseOptimisticUpdateOptions<T> {
  onError?: (error: Error, previous: T) => void;
  errorMessage?: string;
}

interface UseOptimisticUpdateReturn<T> {
  optimisticUpdate: (
    current: T,
    applyOptimistic: (prev: T) => T,
    performAction: () => Promise<void>,
    setStateFn: (value: T) => void,
  ) => Promise<void>;
  isUpdating: boolean;
}

/**
 * Generic optimistic update utility.
 * 1. Immediately applies the optimistic state change via `applyOptimistic`.
 * 2. Performs the async action.
 * 3. On error: reverts to the previous state and shows a toast.
 */
export function useOptimisticUpdate<T>(
  options: UseOptimisticUpdateOptions<T> = {},
): UseOptimisticUpdateReturn<T> {
  const [isUpdating, setIsUpdating] = useState(false);
  const { onError, errorMessage = 'Action failed. Changes reverted.' } = options;
  const activeRef = useRef(false);

  const optimisticUpdate = useCallback(
    async (
      current: T,
      applyOptimistic: (prev: T) => T,
      performAction: () => Promise<void>,
      setStateFn: (value: T) => void,
    ) => {
      if (activeRef.current) return;
      activeRef.current = true;
      setIsUpdating(true);

      // Snapshot previous state for rollback
      const previous = current;

      // Apply optimistic change immediately
      setStateFn(applyOptimistic(current));

      try {
        await performAction();
      } catch (err) {
        // Revert on failure
        setStateFn(previous);
        const error = err instanceof Error ? err : new Error(String(err));
        toast.error(errorMessage);
        onError?.(error, previous);
      } finally {
        activeRef.current = false;
        setIsUpdating(false);
      }
    },
    [onError, errorMessage],
  );

  return { optimisticUpdate, isUpdating };
}

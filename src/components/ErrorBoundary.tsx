'use client';

import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class-based error boundary.
 * Catches rendering errors in its subtree and shows a user-friendly fallback.
 * Each boundary is scoped so an error in one section does not crash the whole app.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development; replace with error reporter in production
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message ?? 'An unexpected error occurred.';
      // Sanitize: only show the first 200 chars, no stack trace
      const safe = message.length > 200 ? message.slice(0, 200) + '…' : message;

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[200px]">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-rose-500">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-base mb-1">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h3>
            <p className="text-xs text-muted max-w-sm">{safe}</p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold smooth-hover active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Try again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

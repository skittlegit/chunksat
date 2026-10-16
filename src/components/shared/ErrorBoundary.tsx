"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** What this boundary protects, e.g. "Coverage map". Shown in fallback. */
  label: string;
  /** Optional retry action. */
  onRetry?: () => void;
}

interface State {
  err: Error | null;
}

/**
 * Local error boundary. Wraps risky leaf components (Leaflet, Recharts) so
 * one crashing widget can't take the entire tab down. Without this, an
 * unhandled SVG-layer error from a third-party lib bubbles up to React's
 * root and detonates the page — which is exactly the symptom we kept
 * misdiagnosing as "this page couldn't load".
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[${this.props.label}]`, err, info);
  }

  reset = () => {
    this.setState({ err: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.err) {
      return (
        <div
          className="flex h-full min-h-[160px] flex-col items-start justify-center gap-3 border border-dashed border-[var(--danger)] bg-[var(--danger-soft)] p-5"
          style={{ borderRadius: 4 }}
        >
          <span className="kbd text-[var(--danger)]">
            {this.props.label} — widget crashed
          </span>
          <code className="mono break-words text-[11px] text-[var(--fg-mute)]">
            {this.state.err.message}
          </code>
          <button
            type="button"
            onClick={this.reset}
            className="mono mt-1 border border-[var(--line-bright)] bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--fg-mute)] transition-colors hover:border-[var(--phos)] hover:text-[var(--phos)]"
            style={{ borderRadius: 2 }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

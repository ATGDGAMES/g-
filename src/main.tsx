import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#121826] border border-slate-800 p-6 text-center space-y-4">
            <h1 className="font-display text-2xl font-extrabold italic uppercase text-yellow-400">
              CLUTCH U7 Recovery
            </h1>
            <p className="text-sm text-slate-300">
              {this.state.error.message || 'An unexpected display error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-yellow-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
            >
              Reload Arcade
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);

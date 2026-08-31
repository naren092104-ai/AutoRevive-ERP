import React, { useState, useEffect, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setError(event.error || new Error(event.message));
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
            <h2 className="text-xl font-bold">AutoRevive Workspace Error</h2>
          </div>
          <p className="text-sm text-slate-300">
            An unexpected error occurred while rendering the document.
          </p>
          <div className="bg-slate-950 p-3 rounded font-mono text-xs text-red-400 overflow-x-auto border border-red-900/40">
            {error.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Reload Workspace
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

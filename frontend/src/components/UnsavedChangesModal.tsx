import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onContinueEditing: () => void;
  onDiscardChanges: () => void;
}

export const UnsavedChangesModal: React.FC<Props> = ({
  isOpen,
  onContinueEditing,
  onDiscardChanges,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-100 text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Unsaved Changes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              You have unsaved changes. Are you sure you want to leave?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onContinueEditing}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Continue Editing
          </button>
          <button
            type="button"
            onClick={onDiscardChanges}
            className="px-3.5 py-1.5 rounded-md text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { ClassData } from '../types';

interface DeleteClassModalProps {
  classToDelete: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (classId: string) => void;
}

export const DeleteClassModal: React.FC<DeleteClassModalProps> = ({
  classToDelete,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !classToDelete) return null;

  const handleConfirm = () => {
    onConfirmDelete(classToDelete.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 text-sm">
                Smazat třídu „{classToDelete.name}“?
              </h3>
              <p className="text-[11px] text-rose-600">
                Počet žáků v této třídě: {classToDelete.students.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Opravdu si přejete smazat třídu{' '}
            <strong className="text-slate-900 font-bold">„{classToDelete.name}“</strong>{' '}
            včetně jejího seznamu žáků a rozpracovaného zasedacího pořádku?
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            Tato akce je nevratná. Pokud budete chtít třídu vrátit, můžete ji znovu načíst z GitHubu nebo nahrát ze souboru.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Smazat třídu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

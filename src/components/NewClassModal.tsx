import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, X, Plus } from 'lucide-react';

interface NewClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: (className: string) => void;
  existingClassNames: string[];
}

export const NewClassModal: React.FC<NewClassModalProps> = ({
  isOpen,
  onClose,
  onCreateClass,
  existingClassNames,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Suggest next class name
      const defaultName = getSuggestedClassName(existingClassNames);
      setName(defaultName);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, existingClassNames]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Zadejte prosím název třídy.');
      return;
    }

    const alreadyExists = existingClassNames.some(
      (n) => n.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setError(`Třída „${trimmed}“ již existuje. Zvolte jiný název.`);
      return;
    }

    onCreateClass(trimmed);
    onClose();
  };

  const suggestions = ['1.A', '1.B', '2.A', '2.B', '3.A', '3.B', '4.A', 'Prima', 'Sekunda'].filter(
    (s) => !existingClassNames.some((e) => e.trim().toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

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
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Vytvořit novou třídu</h3>
              <p className="text-[11px] text-slate-500">
                Přidá novou záložku třídy do horní lišty
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Název třídy:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="např. 2.A, 4.B, Kvarta..."
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-slate-800 font-medium"
            />
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1.5">{error}</p>
            )}
          </div>

          {/* Quick suggestions */}
          {suggestions.length > 0 && (
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5">
                Rychlé návrhy:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setName(sug);
                      if (error) setError(null);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Vytvořit třídu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function getSuggestedClassName(existing: string[]): string {
  const defaults = ['1.A', '2.A', '3.A', '4.A', '1.B', '2.B', '3.B', '4.B'];
  for (const candidate of defaults) {
    if (!existing.some((e) => e.trim().toLowerCase() === candidate.toLowerCase())) {
      return candidate;
    }
  }
  return `Třída ${existing.length + 1}`;
}

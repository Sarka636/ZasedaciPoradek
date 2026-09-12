import React, { useState } from 'react';
import {
  X,
  Github,
  Check,
  AlertCircle,
  Download,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface GitHubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveAndFetch: (url: string) => Promise<boolean>;
  onDownloadTemplate: () => void;
  lastSyncedAt?: string | null;
}

export const GitHubSettingsModal: React.FC<GitHubSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveAndFetch,
  onDownloadTemplate,
  lastSyncedAt,
}) => {
  const GITHUB_REPO_URL = 'https://raw.githubusercontent.com/Sarka636/ZasedaciPoradek/main/public/tridy.xlsx';
  const [urlInput, setUrlInput] = useState(currentUrl || GITHUB_REPO_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const success = await onSaveAndFetch(urlInput.trim());
    setIsLoading(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        text: 'Soubor byl úspěšně načten z GitHubu a třídy byly importovány!',
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Nepodařilo se načíst soubor z této adresy. Zkontrolujte, zda je repozitář veřejný (public) a adresa je správná.',
      });
    }
  };

  const handleUseDefault = () => {
    setUrlInput(GITHUB_REPO_URL);
    setStatusMessage({
      type: 'info',
      text: 'Nastavena adresa aktuálního souboru tridy.xlsx na Vašem GitHubu.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Načítání tříd z GitHubu
              </h3>
              <p className="text-xs text-slate-500">
                Automatické čtení souboru Excel online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Principle Explanation: Jedna lišta jedna třída */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 text-xs text-indigo-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Pravidlo: „Jedna lišta = jedna třída“</span>
            </div>
            <p className="leading-relaxed">
              V Excelu pojmenujte jednotlivé listy podle tříd (např. <strong>1.A</strong>, <strong>1.B</strong>, <strong>Sekunda</strong>). 
              Aplikace automaticky vytvoří záložku pro každou třídu i se samostatným zasedacím pořádkem.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                URL adresa souboru Excel na GitHubu:
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://github.com/uzivatel/repozitar/blob/main/tridy.xlsx nebo ./tridy.xlsx"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Můžete vložit běžný odkaz z GitHubu (aplikace si ho automaticky převede na raw odkaz), nebo relativní cestu <code>./tridy.xlsx</code>.
              </p>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleUseDefault}
                className="text-xs text-slate-600 hover:text-indigo-600 font-medium py-1.5 text-left"
              >
                Obnovit výchozí (./tridy.xlsx)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Zavřít
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Ověřuji...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Uložit a načíst třídy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Download Template Banner */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Nemáte ještě soubor tridy.xlsx?</p>
              <p className="text-[11px] text-slate-500">Stáhněte si hotový vzor s více třídami a nahrajte jej do svého GitHubu.</p>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Stáhnout vzor</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

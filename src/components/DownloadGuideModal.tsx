import React from 'react';
import {
  Download,
  FolderDown,
  Monitor,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Keyboard,
  HardDrive,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';

interface DownloadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDownload: () => void;
}

export const DownloadGuideModal: React.FC<DownloadGuideModalProps> = ({
  isOpen,
  onClose,
  onTriggerDownload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-100">
              <FolderDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Návod: Jak stáhnout a uložit zasedací pořádek do počítače
              </h3>
              <p className="text-xs text-slate-600">
                Jednoduchý průvodce pro uložení a otevření v Excelu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
          
          {/* Action Trigger Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-900 text-sm">
                Připraveno ke stažení
              </div>
              <div className="text-xs text-emerald-700">
                Kliknutím na tlačítko níže zahájíte okamžité stažení souboru .xlsx.
              </div>
            </div>
            <button
              onClick={() => {
                onTriggerDownload();
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-emerald-200 active:scale-95 transition-all whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Stáhnout Excel nyní</span>
            </button>
          </div>

          {/* 4 Steps Guide */}
          <div className="space-y-3.5">
            
            {/* Step 1 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Klikněte na zelené tlačítko „Stáhnout Excel (.xlsx)“
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Váš internetový prohlížeč (Chrome, Edge, Firefox nebo Safari) soubor automaticky vygeneruje a stáhne do počítače.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">
                  Kde stažený soubor v počítači najdete?
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Soubor se ve výchozím nastavení ukládá do vaší systémové složky <strong>Stažené soubory (Downloads)</strong>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md font-mono text-[11px] text-slate-800 shadow-2xs">
                    <Keyboard className="h-3 w-3 text-slate-500" />
                    <strong>Ctrl + J</strong> (Windows)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md font-mono text-[11px] text-slate-800 shadow-2xs">
                    <Keyboard className="h-3 w-3 text-slate-500" />
                    <strong>Cmd + Option + L</strong> (Mac)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tato klávesová zkratka v prohlížeči ihned otevře panel stažených souborů.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Uložení do stálé složky nebo na Plochu
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  V panelu stažených souborů klikněte na <strong>„Zobrazit ve složce“</strong> (nebo ikonu lupy/složky). Soubor poté můžete jednoduše přetáhnout na <strong>Plochu</strong>, na flash disk nebo do své složky pro danou třídu (např. <em>Dokumenty &gt; Škola &gt; Zasedací pořádky</em>).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Otevření a tisk v tabulkovém procesoru
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Soubor obsahuje 2 listy: <strong>Mapa učebny</strong> (se 3 sloupci a uličkami) a <strong>Abecední seznam žáků</strong>. Můžete jej otevřít v:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-semibold text-slate-800">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-[11px]">
                    Microsoft Excel
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-[11px]">
                    LibreOffice Calc
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-[11px]">
                    Google Tabulky
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Formát souboru: Microsoft Excel Workbook (.xlsx)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Rozumím, zavřít
          </button>
        </div>

      </div>
    </div>
  );
};

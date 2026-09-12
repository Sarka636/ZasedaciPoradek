import React from 'react';
import {
  Shuffle,
  FileSpreadsheet,
  HelpCircle,
  Printer,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import { ClassroomConfig, getTotalSeatsForLayout, LAYOUT_CONFIGS, Student } from '../types';

interface HeaderProps {
  config: ClassroomConfig;
  onChangeConfig: (newConfig: ClassroomConfig) => void;
  students: Student[];
  assignedCount: number;
  totalSeats: number;
  onOpenUpload: () => void;
  onGenerateRandom: () => void;
  onDownloadPdf: () => void;
  onOpenGuide: () => void;
  onOpenPrint: () => void;
  onOpenStudentList: () => void;
  isGenerating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onChangeConfig,
  students,
  assignedCount,
  totalSeats,
  onOpenUpload,
  onGenerateRandom,
  onDownloadPdf,
  onOpenGuide,
  onOpenPrint,
  onOpenStudentList,
  isGenerating,
}) => {
  const currentCapacity = getTotalSeatsForLayout(config.layoutType);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Class Info */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Generátor zasedacího pořádku
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {currentCapacity} míst
                </span>
              </div>
              
              {/* Editable Class & Subject Title */}
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 transition-colors px-2 py-0.5 rounded-md text-slate-700">
                  <span className="font-medium text-slate-500">Třída:</span>
                  <input
                    type="text"
                    value={config.className}
                    onChange={(e) => onChangeConfig({ ...config, className: e.target.value })}
                    placeholder="1.A"
                    className="bg-transparent font-semibold text-slate-900 focus:outline-none w-20 border-b border-transparent focus:border-indigo-500 text-xs"
                    title="Klikněte pro změnu názvu třídy"
                  />
                </div>

                <button
                  onClick={onOpenStudentList}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>{students.length} žáků ({assignedCount} usazeno)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Upload Excel Button */}
            <button
              onClick={onOpenUpload}
              id="btn-upload-excel"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
              title="Nahrát seznam studentů z Excelu (.xlsx, .xls, .csv)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Nahrát Excel</span>
            </button>

            {/* Random Seating Button */}
            <button
              onClick={onGenerateRandom}
              id="btn-generate-random"
              disabled={students.length === 0 || isGenerating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${
                students.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-indigo-200'
              }`}
              title="Náhodně vylosovat nový zasedací pořádek ze stejného seznamu žáků"
            >
              <Shuffle className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Nový náhodný pořádek</span>
            </button>

            {/* Save PDF Button */}
            <button
              onClick={onDownloadPdf}
              id="btn-download-pdf"
              disabled={students.length === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${
                students.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95 shadow-rose-200'
              }`}
              title="Uložit výsledek i s grafikou jako PDF soubor"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Uložit jako PDF</span>
            </button>

            {/* Help / Guide to saving */}
            <button
              onClick={onOpenGuide}
              id="btn-guide-help"
              className="inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Návod, jak soubor stáhnout a uložit do počítače"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden md:inline">Návod k uložení</span>
            </button>

            {/* Print */}
            <button
              onClick={onOpenPrint}
              id="btn-print-view"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Tiskový náhled"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};


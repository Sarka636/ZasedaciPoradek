import React, { useState } from 'react';
import {
  ClassroomBlock,
  ClassroomConfig,
  getSeatKey,
  getTotalSeatsForLayout,
  LAYOUT_CONFIGS,
  SeatingPlan,
  Student,
  TOTAL_ROWS,
} from '../types';
import { Printer, X, FileText, Check } from 'lucide-react';
import { exportGraphicPlanToPdf } from '../utils/pdfExporter';

interface PrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SeatingPlan;
  students: Student[];
  config: ClassroomConfig;
}

export const PrintView: React.FC<PrintViewProps> = ({
  isOpen,
  onClose,
  plan,
  students,
  config,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const layoutType = config.layoutType || 'classic_3cols';
  const totalCapacity = getTotalSeatsForLayout(layoutType);
  const blocks: ClassroomBlock[] = ['okno', 'prostredka', 'dvere'];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportGraphicPlanToPdf('printable-classroom-sheet', config);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error('Chyba při exportu PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Screen Header (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between p-4 bg-slate-100 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Grafický náhled a export zasedacího pořádku
            </h3>
            <p className="text-xs text-slate-500">
              Připraveno pro stažení PDF nebo tisk na A4 ({LAYOUT_CONFIGS[layoutType]?.name})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs sm:text-sm shadow-sm transition-colors"
            >
              {pdfSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>PDF staženo!</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>{isExportingPdf ? 'Generuji PDF...' : 'Stáhnout PDF'}</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs sm:text-sm transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Vytisknout</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div
          id="printable-classroom-sheet"
          className="p-6 sm:p-8 space-y-5 text-slate-900 bg-white print:p-4"
        >
          
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-end justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Zasedací pořádek
              </h1>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 mt-1">
                {config.className && <span>Třída: <strong>{config.className}</strong></span>}
                {config.subject && <span>Předmět: <strong>{config.subject}</strong></span>}
                <span>Rozestavení: <strong>{LAYOUT_CONFIGS[layoutType]?.name}</strong></span>
                <span>Datum: <strong>{config.date || new Date().toLocaleDateString('cs-CZ')}</strong></span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-medium">
              Obsazeno: {Object.values(plan).filter(Boolean).length} / {totalCapacity} míst
            </div>
          </div>

          {/* Model: 2 Columns (4 rows with 8 seats per row = 32 seats) */}
          {layoutType === 'two_columns_8' && (
            <div className="flex flex-col space-y-3.5">
              {[4, 3, 2, 1].map((rowNum) => {
                const l1 = plan[getSeatKey('col1', rowNum, 1)] ? studentMap.get(plan[getSeatKey('col1', rowNum, 1)]!)?.name : '';
                const l2 = plan[getSeatKey('col1', rowNum, 2)] ? studentMap.get(plan[getSeatKey('col1', rowNum, 2)]!)?.name : '';
                const l3 = plan[getSeatKey('col1', rowNum, 3)] ? studentMap.get(plan[getSeatKey('col1', rowNum, 3)]!)?.name : '';
                const l4 = plan[getSeatKey('col1', rowNum, 4)] ? studentMap.get(plan[getSeatKey('col1', rowNum, 4)]!)?.name : '';

                const r1 = plan[getSeatKey('col2', rowNum, 1)] ? studentMap.get(plan[getSeatKey('col2', rowNum, 1)]!)?.name : '';
                const r2 = plan[getSeatKey('col2', rowNum, 2)] ? studentMap.get(plan[getSeatKey('col2', rowNum, 2)]!)?.name : '';
                const r3 = plan[getSeatKey('col2', rowNum, 3)] ? studentMap.get(plan[getSeatKey('col2', rowNum, 3)]!)?.name : '';
                const r4 = plan[getSeatKey('col2', rowNum, 4)] ? studentMap.get(plan[getSeatKey('col2', rowNum, 4)]!)?.name : '';

                return (
                  <div key={`print-row-${rowNum}`} className="flex items-center justify-between gap-4">
                    {/* Left column (4 seats) */}
                    <div className="flex-1 grid grid-cols-2 gap-2 border-2 border-slate-700 rounded-lg p-1.5 bg-slate-50">
                      <div className="grid grid-cols-2 gap-1 text-xs text-center font-bold text-slate-900">
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {l1 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {l2 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-center font-bold text-slate-900">
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {l3 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {l4 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                      </div>
                    </div>

                    {/* Middle empty aisle */}
                    <div className="w-10 shrink-0 flex items-center justify-center">
                      <div className="h-6 w-px border-r-2 border-dashed border-slate-300" />
                    </div>

                    {/* Right column (4 seats) */}
                    <div className="flex-1 grid grid-cols-2 gap-2 border-2 border-slate-700 rounded-lg p-1.5 bg-slate-50">
                      <div className="grid grid-cols-2 gap-1 text-xs text-center font-bold text-slate-900">
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {r1 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {r2 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-center font-bold text-slate-900">
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {r3 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                        <div className="p-1.5 bg-white border border-slate-300 rounded truncate">
                          {r4 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Model 1: 3 Columns */}
          {layoutType === 'classic_3cols' && (
            <div className="grid grid-cols-3 gap-5">
              {blocks.map((blockId) => (
                <div key={blockId} className="space-y-2.5">
                  {Array.from({ length: TOTAL_ROWS }).map((_, rIdx) => {
                    const rowNum = rIdx + 1;
                    const s1Key = getSeatKey(blockId, rowNum, 1);
                    const s2Key = getSeatKey(blockId, rowNum, 2);

                    const s1 = plan[s1Key] ? studentMap.get(plan[s1Key]!)?.name : '';
                    const s2 = plan[s2Key] ? studentMap.get(plan[s2Key]!)?.name : '';

                    return (
                      <div
                        key={rowNum}
                        className="border-2 border-slate-700 rounded-lg p-1.5 bg-slate-50 min-h-[54px] flex flex-col justify-center"
                      >
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-center font-bold text-slate-900">
                          <div className="p-1.5 bg-white border border-slate-300 rounded shadow-2xs truncate">
                            {s1 || <span className="text-slate-300 font-normal">—</span>}
                          </div>
                          <div className="p-1.5 bg-white border border-slate-300 rounded shadow-2xs truncate">
                            {s2 || <span className="text-slate-300 font-normal">—</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Model 2: U-Shape with Center */}
          {layoutType === 'u_shape_center' && (
            <div className="flex flex-col space-y-3">
              {/* Back Row */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((desk) => {
                  const s1Key = getSeatKey('u_back', desk, 1);
                  const s2Key = getSeatKey('u_back', desk, 2);
                  const s1 = plan[s1Key] ? studentMap.get(plan[s1Key]!)?.name : '';
                  const s2 = plan[s2Key] ? studentMap.get(plan[s2Key]!)?.name : '';

                  return (
                    <div
                      key={`uback-${desk}`}
                      className="border-2 border-amber-800 rounded-lg p-1.5 bg-amber-50/60 flex flex-col justify-center"
                    >
                      <div className="grid grid-cols-2 gap-1 text-xs text-center font-bold text-slate-900">
                        <div className="p-1 bg-white border border-amber-300 rounded truncate">
                          {s1 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                        <div className="p-1 bg-white border border-amber-300 rounded truncate">
                          {s2 || <span className="text-slate-300 font-normal">—</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Wings (rotated 90° along wall) + Center Rows */}
              <div className="grid grid-cols-12 gap-3 items-stretch">
                {/* Left Wing (Rotated 90° along wall: 2 seats stacked vertically) */}
                <div className="col-span-3 flex flex-col justify-between space-y-2 bg-amber-50/40 p-1.5 rounded-lg border border-amber-300">
                  {[3, 2, 1].map((desk) => {
                    const s1Key = getSeatKey('u_left', desk, 1);
                    const s2Key = getSeatKey('u_left', desk, 2);
                    const s1 = plan[s1Key] ? studentMap.get(plan[s1Key]!)?.name : '';
                    const s2 = plan[s2Key] ? studentMap.get(plan[s2Key]!)?.name : '';

                    return (
                      <div
                        key={`uleft-${desk}`}
                        className="flex-1 border-2 border-amber-800 rounded-lg p-1 bg-amber-50/80 flex flex-col justify-center"
                      >
                        <div className="grid grid-rows-2 gap-1 text-[11px] text-center font-bold text-slate-900">
                          <div className="p-1 bg-white border border-amber-300 rounded truncate">
                            {s1 || <span className="text-slate-300 font-normal">—</span>}
                          </div>
                          <div className="p-1 bg-white border border-amber-300 rounded truncate">
                            {s2 || <span className="text-slate-300 font-normal">—</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center 3x3 */}
                <div className="col-span-6 flex flex-col justify-between space-y-2 bg-slate-100/70 p-2 rounded-xl border border-slate-300">
                  {[3, 2, 1].map((row) => (
                    <div key={`crow-${row}`} className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((desk) => {
                        const s1Key = getSeatKey(`center_r${row}_d${desk}`, 1, 1);
                        const s2Key = getSeatKey(`center_r${row}_d${desk}`, 1, 2);
                        const s1 = plan[s1Key] ? studentMap.get(plan[s1Key]!)?.name : '';
                        const s2 = plan[s2Key] ? studentMap.get(plan[s2Key]!)?.name : '';

                        return (
                          <div
                            key={`c-r${row}-d${desk}`}
                            className="border border-slate-700 rounded p-1 bg-white"
                          >
                            <div className="grid grid-cols-2 gap-0.5 text-[10px] text-center font-bold text-slate-900">
                              <div className="p-0.5 bg-slate-50 border border-slate-200 rounded truncate">
                                {s1 || <span className="text-slate-300 font-normal">—</span>}
                              </div>
                              <div className="p-0.5 bg-slate-50 border border-slate-200 rounded truncate">
                                {s2 || <span className="text-slate-300 font-normal">—</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Right Wing (Rotated 90° along wall: 2 seats stacked vertically) */}
                <div className="col-span-3 flex flex-col justify-between space-y-2 bg-amber-50/40 p-1.5 rounded-lg border border-amber-300">
                  {[3, 2, 1].map((desk) => {
                    const s1Key = getSeatKey('u_right', desk, 1);
                    const s2Key = getSeatKey('u_right', desk, 2);
                    const s1 = plan[s1Key] ? studentMap.get(plan[s1Key]!)?.name : '';
                    const s2 = plan[s2Key] ? studentMap.get(plan[s2Key]!)?.name : '';

                    return (
                      <div
                        key={`uright-${desk}`}
                        className="flex-1 border-2 border-amber-800 rounded-lg p-1 bg-amber-50/80 flex flex-col justify-center"
                      >
                        <div className="grid grid-rows-2 gap-1 text-[11px] text-center font-bold text-slate-900">
                          <div className="p-1 bg-white border border-amber-300 rounded truncate">
                            {s1 || <span className="text-slate-300 font-normal">—</span>}
                          </div>
                          <div className="p-1 bg-white border border-amber-300 rounded truncate">
                            {s2 || <span className="text-slate-300 font-normal">—</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Katedra / Tabule at the bottom */}
          <div className="w-full bg-slate-900 text-white text-center py-2.5 rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase">
            Katedra učitele &bull; Tabule
          </div>

          {/* Footer Notes */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span>Uspořádání: {LAYOUT_CONFIGS[layoutType]?.name}</span>
            <span>Pomocník pro pedagogy</span>
          </div>

        </div>

      </div>
    </div>
  );
};


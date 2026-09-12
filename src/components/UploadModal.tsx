import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  ClipboardPaste,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  Users,
} from 'lucide-react';
import {
  downloadMultiClassSampleExcel,
  downloadSampleExcelTemplate,
  parseStudentFile,
  parseTextList,
  SAMPLE_CLASSES,
} from '../utils/excelParser';
import { ClassData, Student } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadClasses: (classes: ClassData[]) => void;
  onLoadStudents?: (students: Student[], className?: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadClasses,
  onLoadStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'sample' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [detectedClassName, setDetectedClassName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await parseStudentFile(file);
      if (
        result.errors.length > 0 &&
        (!result.classes || result.classes.length === 0) &&
        (!result.students || result.students.length === 0)
      ) {
        setErrorMessage(result.errors.join(' '));
        setIsLoading(false);
        return;
      }

      // If workbook has sheets, load all sheets as classes with tab names
      if (result.classes && result.classes.length > 0) {
        onLoadClasses(result.classes);
        onClose();
        return;
      }

      // Fallback for simple CSV / single-sheet file
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_ -]/g, ' ');
      const singleClass: ClassData = {
        id: `class-${Date.now()}`,
        name: cleanFileName || 'Nová třída',
        students: result.students,
      };

      onLoadClasses([singleClass]);
      if (onLoadStudents) {
        onLoadStudents(result.students, cleanFileName);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Nepodařilo se zpracovat soubor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleSampleSelect = (sample: { name: string; students: string[] }) => {
    const students: Student[] = sample.students.map((name, index) => ({
      id: `student-sample-${Date.now()}-${index}`,
      name,
    }));
    const sampleClass: ClassData = {
      id: `class-${Date.now()}`,
      name: sample.name.split(' ')[0],
      students,
    };
    onLoadClasses([sampleClass]);
    if (onLoadStudents) {
      onLoadStudents(students, sample.name.split(' ')[0]);
    }
    onClose();
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const students = parseTextList(pastedText);
    if (students.length === 0) {
      setErrorMessage('Nebylo nalezeno žádné jméno žáka.');
      return;
    }
    const pastedClass: ClassData = {
      id: `class-${Date.now()}`,
      name: detectedClassName.trim() || 'Vložená třída',
      students,
    };
    onLoadClasses([pastedClass]);
    if (onLoadStudents) {
      onLoadStudents(students, detectedClassName || 'Moje třída');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Nahrát seznam studentů
              </h3>
              <p className="text-xs text-slate-500">
                Podporuje formáty Excel (.xlsx, .xls) a CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/30">
          <button
            onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Nahrát Excel soubor</span>
          </button>

          <button
            onClick={() => { setActiveTab('sample'); setErrorMessage(null); }}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sample'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Ukázková třída (rychlý test)</span>
          </button>

          <button
            onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            <span>Vložit textem</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6" />
                </div>

                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {isLoading ? 'Zpracovávám soubor...' : 'Přetáhněte soubor sem nebo klikněte'}
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Podporujeme .xlsx, .xls i .csv (ze systémů Bakaláři, EduPage, Škola OnLine atd.)
                </p>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Vybrat soubor z disku
                </span>
              </div>

              {/* Template download link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Nemáte připravený soubor?</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Jedna třída (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadMultiClassSampleExcel}
                    className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-800 font-semibold hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Více tříd na GitHub (tridy.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAMPLE CLASSES */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 mb-2">
                Zvolte jednu z předpřipravených tříd pro okamžité vyzkoušení generátoru:
              </p>
              {SAMPLE_CLASSES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleSelect(sample)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-900">
                      {sample.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {sample.students.slice(0, 4).join(', ')} a další...
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Načíst &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Název třídy (volitelné):
                </label>
                <input
                  type="text"
                  value={detectedClassName}
                  onChange={(e) => setDetectedClassName(e.target.value)}
                  placeholder="Např. 1.A nebo Dějepis"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vložte jména žáků (jedno jméno na řádek):
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Novák Jan&#10;Svobodová Eliška&#10;Dvořák Tomáš&#10;Černá Tereza..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-indigo-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Načíst seznam žáků
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

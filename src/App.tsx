/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ClassData,
  ClassroomConfig,
  getAllSeatDefinitions,
  getSeatKey,
  getTotalSeatsForLayout,
  LAYOUT_CONFIGS,
  LayoutType,
  SeatingPlan,
  Student,
  TOTAL_SEATS,
} from './types';
import {
  downloadMultiClassSampleExcel,
  fetchAndParseExcelFromUrl,
  SAMPLE_CLASSES,
} from './utils/excelParser';
import { generateSeatingPlan, swapSeats } from './utils/seatingGenerator';
import { exportSeatingPlanToExcel } from './utils/excelExporter';
import { exportGraphicPlanToPdf } from './utils/pdfExporter';
import { Header } from './components/Header';
import { ClassBar } from './components/ClassBar';
import { GitHubSettingsModal } from './components/GitHubSettingsModal';
import { ClassroomView } from './components/ClassroomView';
import { UploadModal } from './components/UploadModal';
import { DownloadGuideModal } from './components/DownloadGuideModal';
import { StudentManagerDrawer } from './components/StudentManagerDrawer';
import { PrintView } from './components/PrintView';
import { NewClassModal } from './components/NewClassModal';
import { DeleteClassModal } from './components/DeleteClassModal';
import {
  Shuffle,
  FileSpreadsheet,
  Download,
  HelpCircle,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default repository URL pointing to the user's actual tridy.xlsx
const DEFAULT_GITHUB_URL = 'https://raw.githubusercontent.com/Sarka636/ZasedaciPoradek/main/public/tridy.xlsx';

// Initial sample classes mapped to ClassData (pre-populated with school classes 3A, 1E, 3A_a, 3A_b)
const INITIAL_SAMPLE_CLASSES: ClassData[] = SAMPLE_CLASSES.map((sample, idx) => ({
  id: `class-sample-${idx + 1}`,
  name: sample.name,
  students: sample.students.map((name, sIdx) => ({
    id: `student-init-${idx}-${sIdx}`,
    name,
    isLocked: false,
  })),
}));

export default function App() {
  // Classes State ("Jedna lišta jedna třída")
  const [classes, setClasses] = useState<ClassData[]>(INITIAL_SAMPLE_CLASSES);
  const [activeClassId, setActiveClassId] = useState<string>(INITIAL_SAMPLE_CLASSES[0].id);
  const [classPlans, setClassPlans] = useState<Record<string, SeatingPlan>>({});

  // GitHub Auto-Fetch State
  const [gitHubUrl, setGitHubUrl] = useState<string>(() => {
    const saved = localStorage.getItem('github_excel_url');
    if (saved && saved !== './tridy.xlsx' && saved !== 'tridy.xlsx') {
      return saved;
    }
    return DEFAULT_GITHUB_URL;
  });
  const [isGitHubSettingsOpen, setIsGitHubSettingsOpen] = useState(false);
  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Classroom & Seating Configuration (Defaults to user requested 2 columns with 8 seats per row = 32 seats)
  const [config, setConfig] = useState<ClassroomConfig>({
    className: INITIAL_SAMPLE_CLASSES[0].name,
    schoolName: '',
    subject: '',
    date: new Date().toLocaleDateString('cs-CZ'),
    totalRows: 4,
    seatsPerRow: 4,
    layoutType: 'two_columns_8',
  });

  const [students, setStudents] = useState<Student[]>(INITIAL_SAMPLE_CLASSES[0].students);
  const [plan, setPlan] = useState<SeatingPlan>({});
  const [selectedSeatKey, setSelectedSeatKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);

  // Show toast notification
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  // Helper to load classes and seating from a given GitHub/server URL
  const loadClassesFromUrl = async (urlToFetch: string): Promise<boolean> => {
    setIsSyncingGitHub(true);
    try {
      const result = await fetchAndParseExcelFromUrl(urlToFetch);
      if (result.classes && result.classes.length > 0) {
        setClasses(result.classes);

        // Retain or select active class
        const matchedActive = result.classes.find((c) => c.id === activeClassId) || result.classes[0];
        setActiveClassId(matchedActive.id);
        setStudents(matchedActive.students);
        setConfig((prev) => ({ ...prev, className: matchedActive.name }));

        // Generate seating for this active class
        const initialResult = generateSeatingPlan(matchedActive.students, {}, {
          strategy: 'balanced',
          layoutType: config.layoutType || 'two_columns_8',
        });
        setPlan(initialResult.plan);
        setClassPlans((prev) => ({
          ...prev,
          [matchedActive.id]: initialResult.plan,
        }));

        const now = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        setLastSyncedAt(now);
        localStorage.setItem('github_excel_url', urlToFetch);
        setGitHubUrl(urlToFetch);

        showToast(
          `Z GitHubu načteno ${result.classes.length} tříd (${result.classes.map((c) => c.name).join(', ')})`,
          'success'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('GitHub Excel sync warning:', err);
      return false;
    } finally {
      setIsSyncingGitHub(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    // Attempt automatic read from repository or cached link
    loadClassesFromUrl(gitHubUrl);
  }, []);

  // Class Selection Handler ("Jedna lišta jedna třída")
  const handleSelectClass = (newClassId: string) => {
    if (newClassId === activeClassId) return;

    // 1. Save current plan to classPlans cache
    setClassPlans((prev) => ({
      ...prev,
      [activeClassId]: plan,
    }));

    // 2. Find target class
    const targetClass = classes.find((c) => c.id === newClassId);
    if (!targetClass) return;

    setActiveClassId(newClassId);
    setStudents(targetClass.students);
    setConfig((prev) => ({ ...prev, className: targetClass.name }));
    setSelectedSeatKey(null);

    // 3. Restore existing seating plan for that class or generate a fresh one
    if (classPlans[newClassId] && Object.keys(classPlans[newClassId]).length > 0) {
      setPlan(classPlans[newClassId]);
    } else {
      const result = generateSeatingPlan(targetClass.students, {}, {
        strategy: 'balanced',
        layoutType: config.layoutType || 'two_columns_8',
      });
      setPlan(result.plan);
      setClassPlans((prev) => ({
        ...prev,
        [newClassId]: result.plan,
      }));
    }

    showToast(`Přepnuto na třídu: ${targetClass.name} (${targetClass.students.length} žáků)`, 'info');
  };

  // Open dialog to add a new empty class
  const handleOpenNewClassModal = () => {
    setIsNewClassModalOpen(true);
  };

  // Create class confirmed from NewClassModal
  const handleCreateClass = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newClass: ClassData = {
      id: `class-${Date.now()}`,
      name: trimmed,
      students: [],
    };

    setClasses((prev) => [...prev, newClass]);
    handleSelectClass(newClass.id);
    showToast(`Vytvořena nová třída: ${trimmed}`, 'success');
  };

  // Request delete class (opens DeleteClassModal)
  const handleRequestDeleteClass = (classId: string) => {
    const clsToDelete = classes.find((c) => c.id === classId);
    if (!clsToDelete) return;
    setClassToDelete(clsToDelete);
  };

  // Confirmed delete from DeleteClassModal
  const handleConfirmDeleteClass = (classId: string) => {
    const clsToDelete = classes.find((c) => c.id === classId);
    if (!clsToDelete) return;

    const remaining = classes.filter((c) => c.id !== classId);

    // Remove deleted plan
    setClassPlans((prev) => {
      const copy = { ...prev };
      delete copy[classId];
      return copy;
    });

    if (remaining.length === 0) {
      // If user deleted the last class, create a fresh empty class so UI never crashes
      const freshClass: ClassData = {
        id: `class-${Date.now()}`,
        name: 'Nová třída',
        students: [],
      };
      setClasses([freshClass]);
      setActiveClassId(freshClass.id);
      setStudents([]);
      setConfig((prev) => ({ ...prev, className: freshClass.name }));
      setPlan({});
    } else {
      setClasses(remaining);
      if (activeClassId === classId) {
        const nextClass = remaining[0];
        setActiveClassId(nextClass.id);
        setStudents(nextClass.students);
        setConfig((prev) => ({ ...prev, className: nextClass.name }));
        setPlan(classPlans[nextClass.id] || {});
      }
    }

    showToast(`Třída „${clsToDelete.name}“ byla smazána.`, 'info');
  };

  // Download multi-class Excel template
  const handleDownloadTemplate = () => {
    downloadMultiClassSampleExcel();
    showToast('Vzorový soubor tridy.xlsx byl stažen do počítače', 'success');
  };

  // Switch classroom layout
  const handleLayoutChange = (newLayout: LayoutType) => {
    setConfig((prev) => ({ ...prev, layoutType: newLayout }));
    setSelectedSeatKey(null);

    const result = generateSeatingPlan(students, {}, {
      strategy: 'balanced',
      preserveLocked: true,
      layoutType: newLayout,
    });
    setPlan(result.plan);
    setClassPlans((prev) => ({
      ...prev,
      [activeClassId]: result.plan,
    }));

    const layoutName = LAYOUT_CONFIGS[newLayout]?.name || newLayout;
    showToast(`Rozestavení změněno na: ${layoutName}`, 'info');
  };

  // Generate seating plan
  const handleGenerateRandom = useCallback(() => {
    if (students.length === 0) return;

    setIsGenerating(true);

    setTimeout(() => {
      const result = generateSeatingPlan(students, plan, {
        strategy: 'balanced',
        preserveLocked: true,
        layoutType: config.layoutType || 'two_columns_8',
      });

      setPlan(result.plan);
      setClassPlans((prev) => ({
        ...prev,
        [activeClassId]: result.plan,
      }));
      setSelectedSeatKey(null);
      setIsGenerating(false);

      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.2 },
          colors: ['#4f46e5', '#059669', '#e11d48'],
        });
      } catch (e) {
        // ignore
      }

      showToast('Vygenerován nový zasedací pořádek pro tuto třídu!', 'success');
    }, 200);
  }, [students, plan, config.layoutType, activeClassId]);

  // Initial generation fallback
  useEffect(() => {
    if (Object.keys(plan).length === 0 && students.length > 0) {
      const result = generateSeatingPlan(students, {}, {
        strategy: 'balanced',
        layoutType: config.layoutType || 'two_columns_8',
      });
      setPlan(result.plan);
      setClassPlans((prev) => ({
        ...prev,
        [activeClassId]: result.plan,
      }));
    }
  }, []);

  // Handle loading multiple classes from Excel sheets ("Pri nahrani excelu z Aplikace má přidat tolik tříd, kolik je záložek v souboru a převzít jména podle jmen záložek")
  const handleLoadClasses = (newClasses: ClassData[]) => {
    if (!newClasses || newClasses.length === 0) return;

    // Determine whether to replace or merge
    setClasses((prev) => {
      // Check if current classes are only initial sample classes with no custom edits
      const isOnlyInitial = prev.every((c) => c.id.startsWith('class-sample-'));
      if (isOnlyInitial) {
        return newClasses;
      }

      // Otherwise merge or append
      const updated = [...prev];
      for (const newCls of newClasses) {
        const existingIdx = updated.findIndex(
          (c) => c.name.trim().toLowerCase() === newCls.name.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = newCls;
        } else {
          updated.push(newCls);
        }
      }
      return updated;
    });

    // Switch to first newly loaded class
    const firstCls = newClasses[0];
    setActiveClassId(firstCls.id);
    setStudents(firstCls.students);
    setConfig((prev) => ({ ...prev, className: firstCls.name }));
    setSelectedSeatKey(null);

    // Pre-generate seating plans for the loaded classes
    const freshPlans: Record<string, SeatingPlan> = {};
    for (const cls of newClasses) {
      const result = generateSeatingPlan(cls.students, {}, {
        strategy: 'balanced',
        layoutType: config.layoutType || 'two_columns_8',
      });
      freshPlans[cls.id] = result.plan;
    }

    setClassPlans((prev) => ({
      ...prev,
      ...freshPlans,
    }));
    setPlan(freshPlans[firstCls.id] || {});

    showToast(
      `Načteno ${newClasses.length} tříd ze záložek Excelu (${newClasses.map((c) => c.name).join(', ')})`,
      'success'
    );
  };

  // Handle single class or students load from upload modal
  const handleLoadStudents = (newStudents: Student[], newClassName?: string) => {
    const singleClass: ClassData = {
      id: `class-${Date.now()}`,
      name: newClassName || config.className || 'Moje třída',
      students: newStudents,
    };
    handleLoadClasses([singleClass]);
  };

  // Handle Download Excel
  const handleDownloadExcel = () => {
    if (students.length === 0) return;

    try {
      const result = exportSeatingPlanToExcel(plan, students, config);
      showToast(
        `Soubor „${result.filename}“ byl stažen do počítače.`,
        'success'
      );
    } catch (err: any) {
      showToast(`Chyba při exportu do Excelu: ${err?.message || 'Neznámá chyba'}`, 'warning');
    }
  };

  // Handle Download PDF with Graphics
  const handleDownloadPdf = async () => {
    if (students.length === 0) return;

    try {
      setIsExportingPdf(true);
      showToast('Připravuji grafické PDF ke stažení...', 'info');
      const filename = await exportGraphicPlanToPdf('classroom-graphic-sheet', config);
      showToast(`PDF soubor „${filename}“ byl úspěšně uložen!`, 'success');
    } catch (err: any) {
      showToast(`Chyba při exportu do PDF: ${err?.message || 'Neznámá chyba'}`, 'warning');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Seat Swap
  const handleSwapSeats = (seatKeyA: string, seatKeyB: string) => {
    const updatedPlan = swapSeats(plan, seatKeyA, seatKeyB);
    setPlan(updatedPlan);

    // Update locked status keys if any
    const studentAId = plan[seatKeyA];
    const studentBId = plan[seatKeyB];

    if (studentAId || studentBId) {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentAId && s.isLocked) {
            return { ...s, lockedSeatKey: seatKeyB };
          }
          if (s.id === studentBId && s.isLocked) {
            return { ...s, lockedSeatKey: seatKeyA };
          }
          return s;
        })
      );
    }

    showToast('Žáci byli úspěšně prohozeni', 'info');
  };

  // Toggle student pin/lock on seat
  const handleToggleLock = (studentId: string, seatKey: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const nextLocked = !s.isLocked;
          return {
            ...s,
            isLocked: nextLocked,
            lockedSeatKey: nextLocked ? seatKey : undefined,
          };
        }
        return s;
      })
    );

    const student = students.find((s) => s.id === studentId);
    const isNowLocked = !student?.isLocked;
    showToast(
      isNowLocked
        ? `Žák ${student?.name} byl připnut k tomuto místu`
        : `Připnutí žáka ${student?.name} zrušeno`,
      'info'
    );
  };

  // Remove student from seat
  const handleRemoveStudentFromSeat = (seatKey: string) => {
    setPlan((prev) => ({
      ...prev,
      [seatKey]: null,
    }));
  };

  // Assign student to seat
  const handleAssignStudentToSeat = (studentId: string, seatKey: string) => {
    setPlan((prev) => {
      const updated = { ...prev };
      for (const [k, v] of Object.entries(updated)) {
        if (v === studentId) {
          updated[k] = null;
        }
      }
      updated[seatKey] = studentId;
      return updated;
    });
  };

  // Add individual student
  const handleAddStudent = (name: string) => {
    const newStudent: Student = {
      id: `student-add-${Date.now()}`,
      name,
    };
    const updatedList = [...students, newStudent];
    setStudents(updatedList);

    const allDefs = getAllSeatDefinitions();
    let placed = false;
    for (const def of allDefs) {
      if (!plan[def.key]) {
        setPlan((prev) => ({ ...prev, [def.key]: newStudent.id }));
        placed = true;
        break;
      }
    }

    showToast(
      placed
        ? `Žák „${name}“ byl přidán a usazen na volné místo`
        : `Žák „${name}“ byl přidán do seznamu`,
      'success'
    );
  };

  // Remove individual student
  const handleRemoveStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setPlan((prev) => {
      const updated = { ...prev };
      for (const [k, v] of Object.entries(updated)) {
        if (v === studentId) {
          updated[k] = null;
        }
      }
      return updated;
    });
    showToast('Žák byl odebrán', 'info');
  };

  // Clear all
  const handleClearAll = () => {
    setStudents([]);
    setPlan({});
    setSelectedSeatKey(null);
    showToast('Seznam žáků byl smazán', 'info');
  };

  const currentCapacity = getTotalSeatsForLayout(config.layoutType);
  const layoutInfo = LAYOUT_CONFIGS[config.layoutType || 'classic_3cols'];
  const assignedCount = Object.values(plan).filter(Boolean).length;
  const unassignedCount = Math.max(0, students.length - assignedCount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header
        config={config}
        onChangeConfig={setConfig}
        students={students}
        assignedCount={assignedCount}
        totalSeats={currentCapacity}
        onOpenUpload={() => setIsUploadOpen(true)}
        onGenerateRandom={handleGenerateRandom}
        onDownloadPdf={handleDownloadPdf}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenStudentList={() => setIsStudentListOpen(true)}
        isGenerating={isGenerating}
      />

      {/* Class Bar: "Jedna lišta jedna třída" with GitHub Sync */}
      <ClassBar
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onAddClass={handleOpenNewClassModal}
        onDeleteClass={handleRequestDeleteClass}
        onSyncGitHub={() => loadClassesFromUrl(gitHubUrl)}
        onOpenGitHubSettings={() => setIsGitHubSettingsOpen(true)}
        onDownloadTemplate={handleDownloadTemplate}
        isSyncing={isSyncingGitHub}
        gitHubSource={gitHubUrl}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Quick Teacher Actions Banner */}
        <div className="mb-6 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {layoutInfo?.name || 'Zasedací pořádek'}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Kapacita: {currentCapacity} míst
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              {layoutInfo?.description || 'Kliknutím na dvě místa můžete žáky kdykoli prohodit.'} Výsledek lze stáhnout i s grafikou jako PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Primary Randomize Button */}
            <button
              onClick={handleGenerateRandom}
              disabled={students.length === 0 || isGenerating}
              id="btn-main-shuffle"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 active:scale-95 transition-all"
            >
              <Shuffle className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Vygenerovat nový pořádek</span>
            </button>

            {/* PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={students.length === 0 || isExportingPdf}
              id="btn-main-pdf"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-rose-200 active:scale-95 transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>{isExportingPdf ? 'Ukládám PDF...' : 'Uložit jako PDF'}</span>
            </button>

            {/* Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 transition-colors"
              title="Jak soubor stáhnout a uložit do počítače"
            >
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>Návod k uložení</span>
            </button>

          </div>
        </div>

        {/* Warning if unassigned students */}
        {unassignedCount > 0 && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                V seznamu je <strong>{students.length}</strong> žáků (kapacita tohoto rozestavení je {currentCapacity} míst). <strong>{unassignedCount}</strong> žáků se nevešlo do lavic.
              </span>
            </div>
            <button
              onClick={() => setIsStudentListOpen(true)}
              className="font-semibold text-amber-800 hover:text-amber-950 underline shrink-0 text-xs"
            >
              Spravovat žáky &rarr;
            </button>
          </div>
        )}

        {/* Classroom Interactive Map */}
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto my-8">
            <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-8 w-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Zatím nemáte načtený seznam žáků
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Nahrajte Excel se jmény studentů nebo načtěte ukázkovou třídu pro okamžité vygenerování zasedacího pořádku.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all"
              >
                Nahrát Excel soubor
              </button>
              <button
                onClick={() => {
                  const sample = SAMPLE_CLASSES[0];
                  handleLoadStudents(
                    sample.students.map((n, i) => ({ id: `sample-${i}`, name: n })),
                    '1.A'
                  );
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all"
              >
                Vyzkoušet ukázkovou 1.A
              </button>
            </div>
          </div>
        ) : (
          <ClassroomView
            plan={plan}
            students={students}
            config={config}
            onChangeLayout={handleLayoutChange}
            onSwapSeats={handleSwapSeats}
            onToggleLock={handleToggleLock}
            onRemoveStudentFromSeat={handleRemoveStudentFromSeat}
            onAssignStudentToSeat={handleAssignStudentToSeat}
            selectedSeatKey={selectedSeatKey}
            onSelectSeatKey={setSelectedSeatKey}
          />
        )}

      </main>

      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toastMessage.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-800'
                : 'bg-indigo-900 text-white border-indigo-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 text-indigo-300 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Drawers */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadClasses={handleLoadClasses}
        onLoadStudents={handleLoadStudents}
      />

      <DownloadGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onTriggerDownload={handleDownloadExcel}
      />

      <StudentManagerDrawer
        isOpen={isStudentListOpen}
        onClose={() => setIsStudentListOpen(false)}
        students={students}
        plan={plan}
        onAddStudent={handleAddStudent}
        onRemoveStudent={handleRemoveStudent}
        onClearAll={handleClearAll}
        onOpenUpload={() => {
          setIsStudentListOpen(false);
          setIsUploadOpen(true);
        }}
      />

      <PrintView
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        plan={plan}
        students={students}
        config={config}
      />

      <GitHubSettingsModal
        isOpen={isGitHubSettingsOpen}
        onClose={() => setIsGitHubSettingsOpen(false)}
        currentUrl={gitHubUrl}
        onSaveAndFetch={loadClassesFromUrl}
        onDownloadTemplate={handleDownloadTemplate}
        lastSyncedAt={lastSyncedAt}
      />

      <NewClassModal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
        onCreateClass={handleCreateClass}
        existingClassNames={classes.map((c) => c.name)}
      />

      <DeleteClassModal
        classToDelete={classToDelete}
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirmDelete={handleConfirmDeleteClass}
      />

    </div>
  );
}

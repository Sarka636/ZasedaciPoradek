import React from 'react';
import {
  GraduationCap,
  RefreshCw,
  Github,
  Plus,
  Settings,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { ClassData } from '../types';

interface ClassBarProps {
  classes: ClassData[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  onAddClass: () => void;
  onDeleteClass: (classId: string) => void;
  onSyncGitHub: () => void;
  onOpenGitHubSettings: () => void;
  onDownloadTemplate: () => void;
  isSyncing: boolean;
  gitHubSource?: string;
  lastSyncedAt?: string | null;
}

export const ClassBar: React.FC<ClassBarProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  onAddClass,
  onDeleteClass,
  onSyncGitHub,
  onOpenGitHubSettings,
  onDownloadTemplate,
  isSyncing,
  gitHubSource,
  lastSyncedAt,
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Left: Class Tabs ("Jedna lišta jedna třída") */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0 pr-1 select-none">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <span className="hidden md:inline">Třídy z Excelu:</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {classes.map((cls) => {
                const isActive = cls.id === activeClassId;
                return (
                  <div
                    key={cls.id}
                    className={`inline-flex items-center rounded-lg border transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border-slate-200/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectClass(cls.id)}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1.5 text-xs font-bold"
                    >
                      <span>{cls.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cls.students.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClass(cls.id);
                      }}
                      title={`Smazat třídu ${cls.name}`}
                      className={`p-1 mr-1 rounded-md transition-colors ${
                        isActive
                          ? 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                          : 'text-slate-400 hover:text-red-600 hover:bg-slate-300/60'
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={onAddClass}
                title="Vytvořit novou třídu"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nová třída</span>
              </button>
            </div>
          </div>

          {/* Right: GitHub Sync & Settings */}
          <div className="flex items-center justify-end gap-1.5 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={onSyncGitHub}
              disabled={isSyncing}
              title={
                lastSyncedAt
                  ? `Poslední načtení: ${lastSyncedAt}`
                  : 'Načíst třídy ze souboru tridy.xlsx na GitHubu'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 rounded-lg text-xs font-semibold shadow-2xs transition-all disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-indigo-600 ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              />
              <span>{isSyncing ? 'Načítám...' : 'GitHub načtení'}</span>
            </button>

            {/* GitHub Settings Modal Button */}
            <button
              type="button"
              onClick={onOpenGitHubSettings}
              title="Nastavit GitHub repozitář nebo URL Excel souboru"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium transition-colors"
            >
              <Github className="h-3.5 w-3.5 text-slate-800" />
              <Settings className="h-3 w-3 text-slate-500" />
            </button>

            {/* Download tridy.xlsx template */}
            <button
              type="button"
              onClick={onDownloadTemplate}
              title="Stáhnout vzorový soubor tridy.xlsx pro GitHub (s listy 1.A, 1.B, Sekunda)"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Vzor tridy.xlsx</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

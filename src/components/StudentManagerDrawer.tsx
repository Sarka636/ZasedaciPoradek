import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  X,
  Search,
  Pin,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { BLOCK_METADATA, ClassroomBlock, SeatingPlan, Student } from '../types';

interface StudentManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  plan: SeatingPlan;
  onAddStudent: (name: string) => void;
  onRemoveStudent: (studentId: string) => void;
  onClearAll: () => void;
  onOpenUpload: () => void;
}

export const StudentManagerDrawer: React.FC<StudentManagerDrawerProps> = ({
  isOpen,
  onClose,
  students,
  plan,
  onAddStudent,
  onRemoveStudent,
  onClearAll,
  onOpenUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newName, setNewName] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen) return null;

  // Map student ID to seat key
  const studentToSeat = new Map<string, string>();
  Object.entries(plan).forEach(([seatKey, studentId]) => {
    if (studentId && typeof studentId === 'string') {
      studentToSeat.set(studentId, seatKey);
    }
  });

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddStudent(newName.trim());
    setNewName('');
  };

  const getSeatDescription = (seatKey?: string) => {
    if (!seatKey) return 'Neusazen(a)';
    const parts = seatKey.split('-');
    const blockId: string = parts[0];
    const row = parts[1];
    const seatNum = parts[2];

    if (blockId === 'col1') {
      return `Levý sloupec, řada ${row} (${seatNum}. místo)`;
    }
    if (blockId === 'col2') {
      return `Pravý sloupec, řada ${row} (${seatNum}. místo)`;
    }
    if (blockId === 'u_back') {
      return `Zadní stěna, lavice ${row} (${seatNum}. místo)`;
    }
    if (blockId === 'u_left') {
      return `Levá zeď (podél zdi), lavice ${row} (${seatNum}. místo)`;
    }
    if (blockId === 'u_right') {
      return `Pravá zeď (podél zdi), lavice ${row} (${seatNum}. místo)`;
    }
    if (blockId.startsWith('center_r')) {
      const match = blockId.match(/center_r(\d+)_d(\d+)/);
      if (match) {
        return `Středová řada ${match[1]}, lavice ${match[2]} (${seatNum}. místo)`;
      }
    }

    const blockMetadata = (BLOCK_METADATA as Record<string, { title: string }>)[blockId];
    const blockTitle = blockMetadata?.title || blockId;
    return `${blockTitle}, ${row}. řada (${seatNum}. místo)`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Seznam žáků třídy ({students.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Kapacita učebny: 30 míst
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

        {/* Add Student Input */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Přidat jméno a příjmení..."
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-500"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Přidat</span>
            </button>
          </form>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat žáka..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={onOpenUpload}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
          >
            Nahrát Excel
          </button>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">Zatím nejsou načteni žádní žáci</p>
              <p className="text-[11px] mt-1">Nahrajte Excel nebo přidejte žáka formulářem výše</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Žádný žák neodpovídá hledání „{searchTerm}“
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const seatKey = studentToSeat.get(student.id);
              const isAssigned = !!seatKey;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-400 w-5 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        {isAssigned ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-emerald-700 font-medium truncate">
                              {getSeatDescription(seatKey)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span className="text-amber-700">Neusazen(a)</span>
                          </>
                        )}
                        {student.isLocked && (
                          <span className="text-indigo-600 font-semibold">• Připnuto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => onRemoveStudent(student.id)}
                      title="Odebrat žáka"
                      className="p-1 text-slate-300 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {students.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Celkem: {students.length} žáků
            </span>
            {isConfirmingClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setIsConfirmingClear(false);
                  }}
                  className="text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-[11px] font-bold transition-colors"
                >
                  Opravdu smazat všechny?
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="text-slate-500 hover:text-slate-700 text-[11px] underline"
                >
                  Zpět
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="text-red-600 hover:text-red-800 font-medium hover:underline text-[11px]"
              >
                Vymazat všechny žáky
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

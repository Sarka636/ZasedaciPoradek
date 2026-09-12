import React from 'react';
import {
  ClassroomBlock,
  ClassroomConfig,
  getSeatKey,
  getTotalSeatsForLayout,
  LAYOUT_CONFIGS,
  LayoutType,
  SeatingPlan,
  Student,
  TOTAL_ROWS,
} from '../types';
import {
  ArrowLeftRight,
  Pin,
  Sparkles,
  Check,
  Columns,
  LayoutTemplate,
  Info,
} from 'lucide-react';

interface ClassroomViewProps {
  plan: SeatingPlan;
  students: Student[];
  config: ClassroomConfig;
  onChangeLayout?: (layout: LayoutType) => void;
  onSwapSeats: (seatKeyA: string, seatKeyB: string) => void;
  onToggleLock: (studentId: string, seatKey: string) => void;
  onRemoveStudentFromSeat: (seatKey: string) => void;
  onAssignStudentToSeat: (studentId: string, seatKey: string) => void;
  selectedSeatKey: string | null;
  onSelectSeatKey: (seatKey: string | null) => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  plan,
  students,
  config,
  onChangeLayout,
  onSwapSeats,
  onToggleLock,
  selectedSeatKey,
  onSelectSeatKey,
}) => {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const layoutType = config.layoutType || 'two_columns_8';
  const totalCapacity = getTotalSeatsForLayout(layoutType);

  const handleSeatClick = (seatKey: string) => {
    if (!selectedSeatKey) {
      onSelectSeatKey(seatKey);
    } else if (selectedSeatKey === seatKey) {
      onSelectSeatKey(null);
    } else {
      onSwapSeats(selectedSeatKey, seatKey);
      onSelectSeatKey(null);
    }
  };

  const blocks: ClassroomBlock[] = ['okno', 'prostredka', 'dvere'];

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Top Layout Switcher & Swap Helper Banner */}
      <div className="w-full max-w-5xl mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Layout Selector Pills */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/70 shadow-2xs">
          <button
            type="button"
            onClick={() => onChangeLayout && onChangeLayout('two_columns_8')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              layoutType === 'two_columns_8'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Columns className="h-3.5 w-3.5 text-indigo-600" />
            <span>2 sloupce (4 řady po 8 žácích, 32 míst)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeLayout && onChangeLayout('u_shape_center')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              layoutType === 'u_shape_center'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <LayoutTemplate className="h-3.5 w-3.5 text-rose-600" />
            <span>Podkova U se středem (36 míst)</span>
          </button>
        </div>

        {/* Swap Helper & Cancel */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl text-indigo-900 font-medium text-xs">
            <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="hidden sm:inline">
              {selectedSeatKey
                ? 'Vyberte druhé místo pro prohození'
                : 'Klikněte na 2 místa pro prohození žáků'}
            </span>
            <span className="sm:hidden">
              {selectedSeatKey ? 'Klikněte na 2. místo' : 'Prohození: 2 kliknutí'}
            </span>
          </div>

          {selectedSeatKey && (
            <button
              onClick={() => onSelectSeatKey(null)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2.5 py-1.5 rounded-xl shadow-2xs shrink-0"
            >
              Zrušit
            </button>
          )}
        </div>
      </div>

      {/* Main Classroom Container (targeted for graphic PDF snapshot) */}
      <div
        id="classroom-graphic-sheet"
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col items-center"
      >
        {/* Printable / Graphic Header (Class & Subject Info) */}
        <div className="w-full border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Zasedací pořádek {config.className ? `– Třída ${config.className}` : ''}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {LAYOUT_CONFIGS[layoutType]?.name}
              </span>
            </div>
            {config.subject && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">{config.subject}</p>
            )}
          </div>
          <div className="text-right text-xs text-slate-400 font-medium">
            <span>{config.date || new Date().toLocaleDateString('cs-CZ')}</span>
          </div>
        </div>

        {/* ================= MODEL: 2 SLOUPEČKY (4 ŘADY PO 8 ŽÁCÍCH, UPROSTŘED VOLNO) ================= */}
        {layoutType === 'two_columns_8' && (
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[780px] flex flex-col space-y-4">
              {/* Rows 4 (back) down to 1 (front nearest teacher & blackboard) */}
              {[4, 3, 2, 1].map((rowNum) => {
                // Left Column: 4 seats
                const l1Key = getSeatKey('col1', rowNum, 1);
                const l2Key = getSeatKey('col1', rowNum, 2);
                const l3Key = getSeatKey('col1', rowNum, 3);
                const l4Key = getSeatKey('col1', rowNum, 4);

                // Right Column: 4 seats
                const r1Key = getSeatKey('col2', rowNum, 1);
                const r2Key = getSeatKey('col2', rowNum, 2);
                const r3Key = getSeatKey('col2', rowNum, 3);
                const r4Key = getSeatKey('col2', rowNum, 4);

                const stL1 = plan[l1Key] ? studentMap.get(plan[l1Key]!) : null;
                const stL2 = plan[l2Key] ? studentMap.get(plan[l2Key]!) : null;
                const stL3 = plan[l3Key] ? studentMap.get(plan[l3Key]!) : null;
                const stL4 = plan[l4Key] ? studentMap.get(plan[l4Key]!) : null;

                const stR1 = plan[r1Key] ? studentMap.get(plan[r1Key]!) : null;
                const stR2 = plan[r2Key] ? studentMap.get(plan[r2Key]!) : null;
                const stR3 = plan[r3Key] ? studentMap.get(plan[r3Key]!) : null;
                const stR4 = plan[r4Key] ? studentMap.get(plan[r4Key]!) : null;

                return (
                  <div
                    key={`row-${rowNum}`}
                    className="flex items-center justify-between gap-3 sm:gap-5"
                  >
                    {/* LEVÝ SLOUPEC (4 studenti v řadě - dvě dvojmístné lavice) */}
                    <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 bg-slate-50/70 border border-slate-200 rounded-xl p-2 shadow-2xs hover:border-slate-300 transition-all">
                      {/* Desk 1: seats 1 & 2 */}
                      <div className="grid grid-cols-2 gap-1.5 bg-white/70 border border-slate-200/80 rounded-lg p-1.5">
                        <SeatCard
                          seatKey={l1Key}
                          student={stL1}
                          isSelected={selectedSeatKey === l1Key}
                          onSelect={() => handleSeatClick(l1Key)}
                          onToggleLock={() => stL1 && onToggleLock(stL1.id, l1Key)}
                        />
                        <SeatCard
                          seatKey={l2Key}
                          student={stL2}
                          isSelected={selectedSeatKey === l2Key}
                          onSelect={() => handleSeatClick(l2Key)}
                          onToggleLock={() => stL2 && onToggleLock(stL2.id, l2Key)}
                        />
                      </div>

                      {/* Desk 2: seats 3 & 4 */}
                      <div className="grid grid-cols-2 gap-1.5 bg-white/70 border border-slate-200/80 rounded-lg p-1.5">
                        <SeatCard
                          seatKey={l3Key}
                          student={stL3}
                          isSelected={selectedSeatKey === l3Key}
                          onSelect={() => handleSeatClick(l3Key)}
                          onToggleLock={() => stL3 && onToggleLock(stL3.id, l3Key)}
                        />
                        <SeatCard
                          seatKey={l4Key}
                          student={stL4}
                          isSelected={selectedSeatKey === l4Key}
                          onSelect={() => handleSeatClick(l4Key)}
                          onToggleLock={() => stL4 && onToggleLock(stL4.id, l4Key)}
                        />
                      </div>
                    </div>

                    {/* UPROSTŘED: VOLNÉ MÍSTO (Středová ulička) */}
                    <div className="w-10 sm:w-16 shrink-0 flex items-center justify-center">
                      <div className="h-8 w-px border-r-2 border-dashed border-slate-200" />
                    </div>

                    {/* PRAVÝ SLOUPEC (4 studenti v řadě - dvě dvojmístné lavice) */}
                    <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 bg-slate-50/70 border border-slate-200 rounded-xl p-2 shadow-2xs hover:border-slate-300 transition-all">
                      {/* Desk 3: seats 1 & 2 */}
                      <div className="grid grid-cols-2 gap-1.5 bg-white/70 border border-slate-200/80 rounded-lg p-1.5">
                        <SeatCard
                          seatKey={r1Key}
                          student={stR1}
                          isSelected={selectedSeatKey === r1Key}
                          onSelect={() => handleSeatClick(r1Key)}
                          onToggleLock={() => stR1 && onToggleLock(stR1.id, r1Key)}
                        />
                        <SeatCard
                          seatKey={r2Key}
                          student={stR2}
                          isSelected={selectedSeatKey === r2Key}
                          onSelect={() => handleSeatClick(r2Key)}
                          onToggleLock={() => stR2 && onToggleLock(stR2.id, r2Key)}
                        />
                      </div>

                      {/* Desk 4: seats 3 & 4 */}
                      <div className="grid grid-cols-2 gap-1.5 bg-white/70 border border-slate-200/80 rounded-lg p-1.5">
                        <SeatCard
                          seatKey={r3Key}
                          student={stR3}
                          isSelected={selectedSeatKey === r3Key}
                          onSelect={() => handleSeatClick(r3Key)}
                          onToggleLock={() => stR3 && onToggleLock(stR3.id, r3Key)}
                        />
                        <SeatCard
                          seatKey={r4Key}
                          student={stR4}
                          isSelected={selectedSeatKey === r4Key}
                          onSelect={() => handleSeatClick(r4Key)}
                          onToggleLock={() => stR4 && onToggleLock(stR4.id, r4Key)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PŮVODNÍ MODEL: 3 SLOUPCE (ZACHOVÁNO PRO KOMPATIBILITU) ================= */}
        {layoutType === 'classic_3cols' && (
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[680px] grid grid-cols-3 gap-6 sm:gap-8 items-start">
              {blocks.map((blockId) => (
                <div key={blockId} className="flex flex-col space-y-3.5">
                  {Array.from({ length: TOTAL_ROWS }).map((_, rIdx) => {
                    const rowNum = rIdx + 1;
                    const seat1Key = getSeatKey(blockId, rowNum, 1);
                    const seat2Key = getSeatKey(blockId, rowNum, 2);

                    const student1Id = plan[seat1Key];
                    const student2Id = plan[seat2Key];
                    const student1 = student1Id ? studentMap.get(student1Id) : null;
                    const student2 = student2Id ? studentMap.get(student2Id) : null;

                    return (
                      <div
                        key={`${blockId}-row-${rowNum}`}
                        className="bg-slate-50/70 border border-slate-200 rounded-xl p-2 shadow-2xs hover:border-slate-300 transition-all"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <SeatCard
                            seatKey={seat1Key}
                            student={student1}
                            isSelected={selectedSeatKey === seat1Key}
                            onSelect={() => handleSeatClick(seat1Key)}
                            onToggleLock={() => student1 && onToggleLock(student1.id, seat1Key)}
                          />
                          <SeatCard
                            seatKey={seat2Key}
                            student={student2}
                            isSelected={selectedSeatKey === seat2Key}
                            onSelect={() => handleSeatClick(seat2Key)}
                            onToggleLock={() => student2 && onToggleLock(student2.id, seat2Key)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= MODEL 2: PODKOVA U S CENTRÁLNÍMI ŘADAMI ================= */}
        {layoutType === 'u_shape_center' && (
           <div className="w-full overflow-x-auto pb-2">
             <div className="min-w-[840px] flex flex-col items-center space-y-5">
              
              {/* TOP: Back perimeter row (3 desks along the back wall) */}
              <div className="w-full">
                <div className="grid grid-cols-3 gap-6 sm:gap-8">
                  {[1, 2, 3].map((desk) => {
                    const s1Key = getSeatKey('u_back', desk, 1);
                    const s2Key = getSeatKey('u_back', desk, 2);
                    const st1 = plan[s1Key] ? studentMap.get(plan[s1Key]!) : null;
                    const st2 = plan[s2Key] ? studentMap.get(plan[s2Key]!) : null;

                    return (
                      <div
                        key={`u_back-${desk}`}
                        className="bg-amber-50/70 border-2 border-amber-300/90 rounded-xl p-2 shadow-2xs hover:border-amber-400 transition-all"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <SeatCard
                            seatKey={s1Key}
                            student={st1}
                            isSelected={selectedSeatKey === s1Key}
                            onSelect={() => handleSeatClick(s1Key)}
                            onToggleLock={() => st1 && onToggleLock(st1.id, s1Key)}
                          />
                          <SeatCard
                            seatKey={s2Key}
                            student={st2}
                            isSelected={selectedSeatKey === s2Key}
                            onSelect={() => handleSeatClick(s2Key)}
                            onToggleLock={() => st2 && onToggleLock(st2.id, s2Key)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE SECTION: Left Wing (rotated 90°) + Center (3 rows x 3 desks) + Right Wing (rotated 90°) */}
              <div className="w-full grid grid-cols-12 gap-4 sm:gap-6 items-stretch">
                
                {/* Left Perimeter Wing: 3 desks rotated 90° along the wall (stacked vertically) */}
                <div className="col-span-3 flex flex-col justify-between space-y-3 bg-amber-50/30 p-2 rounded-2xl border border-amber-200/60">
                  {[3, 2, 1].map((desk) => {
                    const s1Key = getSeatKey('u_left', desk, 1);
                    const s2Key = getSeatKey('u_left', desk, 2);
                    const st1 = plan[s1Key] ? studentMap.get(plan[s1Key]!) : null;
                    const st2 = plan[s2Key] ? studentMap.get(plan[s2Key]!) : null;

                    return (
                      <div
                        key={`u_left-${desk}`}
                        className="flex-1 bg-amber-50/80 border-2 border-amber-300/90 rounded-xl p-2 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-center"
                      >
                        {/* Rotated 90°: 2 seats placed vertically along the wall */}
                        <div className="grid grid-rows-2 gap-1.5 flex-1">
                          <SeatCard
                            seatKey={s1Key}
                            student={st1}
                            isSelected={selectedSeatKey === s1Key}
                            onSelect={() => handleSeatClick(s1Key)}
                            onToggleLock={() => st1 && onToggleLock(st1.id, s1Key)}
                            compact
                          />
                          <SeatCard
                            seatKey={s2Key}
                            student={st2}
                            isSelected={selectedSeatKey === s2Key}
                            onSelect={() => handleSeatClick(s2Key)}
                            onToggleLock={() => st2 && onToggleLock(st2.id, s2Key)}
                            compact
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Area: 3 Rows x 3 Desks */}
                <div className="col-span-6 flex flex-col justify-between space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
                  {[3, 2, 1].map((row) => (
                    <div key={`center-row-${row}`} className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {[1, 2, 3].map((desk) => {
                        const s1Key = getSeatKey(`center_r${row}_d${desk}`, 1, 1);
                        const s2Key = getSeatKey(`center_r${row}_d${desk}`, 1, 2);
                        const st1 = plan[s1Key] ? studentMap.get(plan[s1Key]!) : null;
                        const st2 = plan[s2Key] ? studentMap.get(plan[s2Key]!) : null;

                        return (
                          <div
                            key={`center-r${row}-d${desk}`}
                            className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs hover:border-slate-300 transition-all"
                          >
                            <div className="grid grid-cols-2 gap-1">
                              <SeatCard
                                seatKey={s1Key}
                                student={st1}
                                isSelected={selectedSeatKey === s1Key}
                                onSelect={() => handleSeatClick(s1Key)}
                                onToggleLock={() => st1 && onToggleLock(st1.id, s1Key)}
                                compact
                              />
                              <SeatCard
                                seatKey={s2Key}
                                student={st2}
                                isSelected={selectedSeatKey === s2Key}
                                onSelect={() => handleSeatClick(s2Key)}
                                onToggleLock={() => st2 && onToggleLock(st2.id, s2Key)}
                                compact
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Right Perimeter Wing: 3 desks rotated 90° along the wall (stacked vertically) */}
                <div className="col-span-3 flex flex-col justify-between space-y-3 bg-amber-50/30 p-2 rounded-2xl border border-amber-200/60">
                  {[3, 2, 1].map((desk) => {
                    const s1Key = getSeatKey('u_right', desk, 1);
                    const s2Key = getSeatKey('u_right', desk, 2);
                    const st1 = plan[s1Key] ? studentMap.get(plan[s1Key]!) : null;
                    const st2 = plan[s2Key] ? studentMap.get(plan[s2Key]!) : null;

                    return (
                      <div
                        key={`u_right-${desk}`}
                        className="flex-1 bg-amber-50/80 border-2 border-amber-300/90 rounded-xl p-2 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-center"
                      >
                        {/* Rotated 90°: 2 seats placed vertically along the wall */}
                        <div className="grid grid-rows-2 gap-1.5 flex-1">
                          <SeatCard
                            seatKey={s1Key}
                            student={st1}
                            isSelected={selectedSeatKey === s1Key}
                            onSelect={() => handleSeatClick(s1Key)}
                            onToggleLock={() => st1 && onToggleLock(st1.id, s1Key)}
                            compact
                          />
                          <SeatCard
                            seatKey={s2Key}
                            student={st2}
                            isSelected={selectedSeatKey === s2Key}
                            onSelect={() => handleSeatClick(s2Key)}
                            onToggleLock={() => st2 && onToggleLock(st2.id, s2Key)}
                            compact
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Aisles indicator & Spacing */}
        <div className="w-full my-6 border-t border-dashed border-slate-200" />

        {/* Teacher Desk & Blackboard (Katedra a tabule) - POSITIONED AT THE VERY BOTTOM */}
        <div className="w-full max-w-2xl mt-1">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border border-slate-700 text-white py-3.5 px-6 shadow-md text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h3 className="text-sm sm:text-base font-bold tracking-wide uppercase text-slate-100">
                Katedra učitele &bull; Tabule
              </h3>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

interface SeatCardProps {
  seatKey: string;
  student: Student | null | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  compact?: boolean;
}

const SeatCard: React.FC<SeatCardProps> = ({
  seatKey,
  student,
  isSelected,
  onSelect,
  onToggleLock,
  compact,
}) => {
  return (
    <div
      onClick={onSelect}
      id={`seat-${seatKey}`}
      className={`group relative rounded-lg transition-all cursor-pointer border text-center flex flex-col justify-center items-center ${
        compact ? 'p-1.5 min-h-[58px]' : 'p-2 sm:p-2.5 min-h-[64px]'
      } ${
        isSelected
          ? 'bg-indigo-100 border-indigo-600 ring-2 ring-indigo-500/40 shadow-sm'
          : student
          ? 'bg-white hover:bg-indigo-50/50 border-slate-300/80 hover:border-indigo-300'
          : 'bg-slate-100/60 border-dashed border-slate-200 hover:border-indigo-300'
      }`}
    >
      {/* Pin button on student card */}
      {student && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          title={student.isLocked ? 'Odemknout místo' : 'Připnout žáka na toto místo (nevylosuje se jinam)'}
          className={`absolute top-0.5 right-0.5 p-0.5 rounded transition-colors ${
            student.isLocked
              ? 'text-indigo-600 bg-indigo-50'
              : 'text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100'
          }`}
        >
          {student.isLocked ? (
            <Pin className="h-2.5 w-2.5 fill-indigo-600" />
          ) : (
            <Pin className="h-2.5 w-2.5" />
          )}
        </button>
      )}

      {/* Student Name */}
      {student ? (
        <div className="w-full px-0.5">
          <div
            className={`font-semibold text-slate-800 leading-snug line-clamp-2 ${
              compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[13px]'
            }`}
          >
            {student.name}
          </div>
          {student.isLocked && (
            <span className="inline-block text-[8px] sm:text-[9px] font-medium text-indigo-600 mt-0.5">
              Připnuto
            </span>
          )}
        </div>
      ) : (
        <div className="text-slate-300 text-xs font-normal">
          —
        </div>
      )}

      {/* Visual selection dot */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-white" />
      )}
    </div>
  );
};


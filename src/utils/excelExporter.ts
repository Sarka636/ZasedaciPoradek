import * as XLSX from 'xlsx';
import {
  ClassroomConfig,
  getSeatKey,
  getTotalSeatsForLayout,
  LAYOUT_CONFIGS,
  SeatingPlan,
  Student,
  TOTAL_ROWS,
} from '../types';

export function exportSeatingPlanToExcel(
  plan: SeatingPlan,
  students: Student[],
  config: ClassroomConfig
): { filename: string; totalExported: number } {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const layoutType = config.layoutType || 'classic_3cols';
  const totalCapacity = getTotalSeatsForLayout(layoutType);
  const layoutInfo = LAYOUT_CONFIGS[layoutType];

  // 1. Build Sheet 1: Map Layout
  const mapData: any[][] = [];

  // Title & Metadata
  mapData.push(['ZASEDACÍ POŘÁDEK UČEBNY']);
  mapData.push([
    `Třída: ${config.className || 'Neuvedeno'}`,
    '',
    `Rozestavení: ${layoutInfo?.name || 'Učebna'}`,
  ]);
  mapData.push([
    `Datum: ${config.date || new Date().toLocaleDateString('cs-CZ')}`,
    '',
    `Obsazeno: ${Object.values(plan).filter(Boolean).length} / ${totalCapacity} míst`,
  ]);
  mapData.push([]); // empty line

  if (layoutType === 'two_columns_8') {
    // 4 rows: from row 4 (back) down to row 1 (front)
    for (let row = 4; row >= 1; row--) {
      const l1 = plan[getSeatKey('col1', row, 1)];
      const l2 = plan[getSeatKey('col1', row, 2)];
      const l3 = plan[getSeatKey('col1', row, 3)];
      const l4 = plan[getSeatKey('col1', row, 4)];

      const r1 = plan[getSeatKey('col2', row, 1)];
      const r2 = plan[getSeatKey('col2', row, 2)];
      const r3 = plan[getSeatKey('col2', row, 3)];
      const r4 = plan[getSeatKey('col2', row, 4)];

      const nameL1 = l1 ? studentMap.get(l1)?.name || '—' : '—';
      const nameL2 = l2 ? studentMap.get(l2)?.name || '—' : '—';
      const nameL3 = l3 ? studentMap.get(l3)?.name || '—' : '—';
      const nameL4 = l4 ? studentMap.get(l4)?.name || '—' : '—';

      const nameR1 = r1 ? studentMap.get(r1)?.name || '—' : '—';
      const nameR2 = r2 ? studentMap.get(r2)?.name || '—' : '—';
      const nameR3 = r3 ? studentMap.get(r3)?.name || '—' : '—';
      const nameR4 = r4 ? studentMap.get(r4)?.name || '—' : '—';

      mapData.push([
        nameL1,
        nameL2,
        nameL3,
        nameL4,
        '| ulička |',
        nameR1,
        nameR2,
        nameR3,
        nameR4,
      ]);
    }
    mapData.push([]);
    mapData.push(['', '', '', '[ TABULE / KATEDRA ]', '', '', '', '']);
  } else if (layoutType === 'classic_3cols') {
    // Rows 1 to 5 for 3 columns
    for (let row = 1; row <= TOTAL_ROWS; row++) {
      const okno1 = plan[getSeatKey('okno', row, 1)];
      const okno2 = plan[getSeatKey('okno', row, 2)];
      const mid1 = plan[getSeatKey('prostredka', row, 1)];
      const mid2 = plan[getSeatKey('prostredka', row, 2)];
      const dvere1 = plan[getSeatKey('dvere', row, 1)];
      const dvere2 = plan[getSeatKey('dvere', row, 2)];

      const nameO1 = okno1 ? studentMap.get(okno1)?.name || 'Neznámý' : '—';
      const nameO2 = okno2 ? studentMap.get(okno2)?.name || 'Neznámý' : '—';
      const nameM1 = mid1 ? studentMap.get(mid1)?.name || 'Neznámý' : '—';
      const nameM2 = mid2 ? studentMap.get(mid2)?.name || 'Neznámý' : '—';
      const nameD1 = dvere1 ? studentMap.get(dvere1)?.name || 'Neznámý' : '—';
      const nameD2 = dvere2 ? studentMap.get(dvere2)?.name || 'Neznámý' : '—';

      mapData.push([
        nameO1,
        nameO2,
        '|   |',
        nameM1,
        nameM2,
        '|   |',
        nameD1,
        nameD2,
      ]);
    }
  } else {
    // layoutType === 'u_shape_center'
    // 1. Top perimeter row (u_back 1, 2, 3)
    const b1_1 = plan[getSeatKey('u_back', 1, 1)];
    const b1_2 = plan[getSeatKey('u_back', 1, 2)];
    const b2_1 = plan[getSeatKey('u_back', 2, 1)];
    const b2_2 = plan[getSeatKey('u_back', 2, 2)];
    const b3_1 = plan[getSeatKey('u_back', 3, 1)];
    const b3_2 = plan[getSeatKey('u_back', 3, 2)];

    const nameB1_1 = b1_1 ? studentMap.get(b1_1)?.name || 'Neznámý' : '—';
    const nameB1_2 = b1_2 ? studentMap.get(b1_2)?.name || 'Neznámý' : '—';
    const nameB2_1 = b2_1 ? studentMap.get(b2_1)?.name || 'Neznámý' : '—';
    const nameB2_2 = b2_2 ? studentMap.get(b2_2)?.name || 'Neznámý' : '—';
    const nameB3_1 = b3_1 ? studentMap.get(b3_1)?.name || 'Neznámý' : '—';
    const nameB3_2 = b3_2 ? studentMap.get(b3_2)?.name || 'Neznámý' : '—';

    mapData.push(['[OBVOD VZADU]']);
    mapData.push([
      nameB1_1,
      nameB1_2,
      '|   |',
      nameB2_1,
      nameB2_2,
      '|   |',
      nameB3_1,
      nameB3_2,
    ]);
    mapData.push([]);

    // 2. Wings (u_left desk 3..1, u_right desk 3..1) + Center rows (3..1)
    // We display from back to front (row 3, row 2, row 1)
    for (let r = 3; r >= 1; r--) {
      const l1 = plan[getSeatKey('u_left', r, 1)];
      const l2 = plan[getSeatKey('u_left', r, 2)];
      const c1_1 = plan[getSeatKey(`center_r${r}_d1`, 1, 1)];
      const c1_2 = plan[getSeatKey(`center_r${r}_d1`, 1, 2)];
      const c2_1 = plan[getSeatKey(`center_r${r}_d2`, 1, 1)];
      const c2_2 = plan[getSeatKey(`center_r${r}_d2`, 1, 2)];
      const c3_1 = plan[getSeatKey(`center_r${r}_d3`, 1, 1)];
      const c3_2 = plan[getSeatKey(`center_r${r}_d3`, 1, 2)];
      const r1 = plan[getSeatKey('u_right', r, 1)];
      const r2 = plan[getSeatKey('u_right', r, 2)];

      const nameL1 = l1 ? studentMap.get(l1)?.name || '—' : '—';
      const nameL2 = l2 ? studentMap.get(l2)?.name || '—' : '—';
      const nameC1_1 = c1_1 ? studentMap.get(c1_1)?.name || '—' : '—';
      const nameC1_2 = c1_2 ? studentMap.get(c1_2)?.name || '—' : '—';
      const nameC2_1 = c2_1 ? studentMap.get(c2_1)?.name || '—' : '—';
      const nameC2_2 = c2_2 ? studentMap.get(c2_2)?.name || '—' : '—';
      const nameC3_1 = c3_1 ? studentMap.get(c3_1)?.name || '—' : '—';
      const nameC3_2 = c3_2 ? studentMap.get(c3_2)?.name || '—' : '—';
      const nameR1 = r1 ? studentMap.get(r1)?.name || '—' : '—';
      const nameR2 = r2 ? studentMap.get(r2)?.name || '—' : '—';

      mapData.push([
        nameL1,
        nameL2,
        '| ulička |',
        nameC1_1,
        nameC1_2,
        nameC2_1,
        nameC2_2,
        nameC3_1,
        nameC3_2,
        '| ulička |',
        nameR1,
        nameR2,
      ]);
    }
  }

  mapData.push([]); // empty line
  // Blackboard & Teacher's desk at the bottom
  mapData.push(['', '==================== KATEDRA UČITELE • TABULE ====================']);
  mapData.push([]);

  const wsMap = XLSX.utils.aoa_to_sheet(mapData);

  // Column width formatting for Map
  wsMap['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];

  // 2. Build Sheet 2: Alphabetical Roster
  const rosterData: any[][] = [];
  rosterData.push(['ABECEDNÍ SEZNAM ŽÁKŮ']);
  rosterData.push([
    `Třída: ${config.className || 'Neuvedeno'}`,
    `Rozestavení: ${layoutInfo?.name || 'Klasické'}`,
    `Datum: ${config.date || new Date().toLocaleDateString('cs-CZ')}`,
  ]);
  rosterData.push([]);
  rosterData.push(['Číslo', 'Jméno a příjmení', 'Stav usazení']);

  // Find position for each student
  const studentPositions: {
    student: Student;
    seatKey: string;
  }[] = [];

  students.forEach((student) => {
    let foundKey: string | null = null;
    for (const [k, sId] of Object.entries(plan)) {
      if (sId === student.id) {
        foundKey = k;
        break;
      }
    }

    if (foundKey) {
      studentPositions.push({
        student,
        seatKey: `Usazen(a)`,
      });
    } else {
      studentPositions.push({
        student,
        seatKey: 'Neusazen(a)',
      });
    }
  });

  // Sort alphabetically by student name (Czech locale)
  studentPositions.sort((a, b) =>
    a.student.name.localeCompare(b.student.name, 'cs', { sensitivity: 'base' })
  );

  studentPositions.forEach((item, idx) => {
    rosterData.push([
      idx + 1,
      item.student.name,
      item.seatKey,
    ]);
  });

  const wsRoster = XLSX.utils.aoa_to_sheet(rosterData);
  wsRoster['!cols'] = [
    { wch: 8 },  // Číslo
    { wch: 30 }, // Jméno
    { wch: 16 }, // Umístění
  ];

  // 3. Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsMap, 'Zasedací pořádek');
  XLSX.utils.book_append_sheet(workbook, wsRoster, 'Seznam žáků');

  // 4. Generate clean filename
  const cleanClassName = (config.className || 'trida')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');
  const layoutSlug = layoutType === 'u_shape_center' ? 'podkova_u' : 'klasicke_rady';
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `zasedaci_poradek_${cleanClassName}_${layoutSlug}_${dateStr}.xlsx`;

  // 5. Trigger download
  XLSX.writeFile(workbook, filename);

  return {
    filename,
    totalExported: students.length,
  };
}


export type ClassroomBlock = 'okno' | 'prostredka' | 'dvere' | 'col1' | 'col2';

export type LayoutType = 'two_columns_8' | 'u_shape_center' | 'classic_3cols';

export interface Student {
  id: string;
  name: string;
  isLocked?: boolean;
  lockedSeatKey?: string;
  note?: string;
  gender?: 'male' | 'female' | 'unknown';
}

export interface ClassData {
  id: string;
  name: string;
  students: Student[];
  plan?: SeatingPlan;
  lastModified?: string;
}

export interface SeatInfo {
  key: string; // e.g. "col1-1-1" or "col2-1-1"
  section: string; // section name
  row?: number;
  deskIndex?: number;
  seatNumber: number; // 1, 2, 3, 4
  label: string;
}

export type SeatingPlan = Record<string, string | null>; // seatKey -> studentId or null

export interface ClassroomConfig {
  className: string;
  schoolName: string;
  subject: string;
  date: string;
  layoutType: LayoutType;
  totalRows?: number;
  seatsPerRow?: number;
}

export const LAYOUT_CONFIGS: Record<
  LayoutType,
  {
    id: LayoutType;
    name: string;
    shortName: string;
    description: string;
    totalSeats: number;
    totalDesks: number;
  }
> = {
  two_columns_8: {
    id: 'two_columns_8',
    name: '2 sloupce (4 řady po 8 žácích)',
    shortName: '2 sloupce (4×8)',
    description: 'Dva sloupce po 4 studentech, uprostřed volné místo, 4 řady (kapacita 32 míst)',
    totalSeats: 32,
    totalDesks: 16,
  },
  u_shape_center: {
    id: 'u_shape_center',
    name: 'Podkovité U uspořádání s centrálními řadami',
    shortName: 'U-podkova se středem',
    description: 'Obvodové lavice + 3 centrální řady po 3 lavicích (kapacita 36 míst)',
    totalSeats: 36,
    totalDesks: 18,
  },
  classic_3cols: {
    id: 'classic_3cols',
    name: 'Klasické 3 sloupce (původní)',
    shortName: '3 sloupce',
    description: '3 sloupce lavic s uličkami, 5 řad po 2 místech (kapacita 30 míst)',
    totalSeats: 30,
    totalDesks: 15,
  },
};

export const BLOCK_METADATA: Record<
  ClassroomBlock,
  {
    id: ClassroomBlock;
    title: string;
    subtitle: string;
    iconName: string;
    color: string;
    accentBg: string;
    seat1Label: string;
    seat2Label: string;
  }
> = {
  okno: {
    id: 'okno',
    title: 'Okno',
    subtitle: 'Levý sloupec (u oken)',
    iconName: 'Sun',
    color: 'emerald',
    accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    seat1Label: 'Místo u okna (1)',
    seat2Label: 'Místo do uličky (2)',
  },
  prostredka: {
    id: 'prostredka',
    title: 'Prostředek',
    subtitle: 'Středový sloupec',
    iconName: 'LayoutGrid',
    color: 'indigo',
    accentBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    seat1Label: 'Levé místo (1)',
    seat2Label: 'Pravé místo (2)',
  },
  dvere: {
    id: 'dvere',
    title: 'Dveře',
    subtitle: 'Pravý sloupec (u dveří)',
    iconName: 'DoorOpen',
    color: 'amber',
    accentBg: 'bg-amber-50 border-amber-200 text-amber-800',
    seat1Label: 'Místo do uličky (1)',
    seat2Label: 'Místo u dveří (2)',
  },
  col1: {
    id: 'col1',
    title: 'Levý sloupec',
    subtitle: '4 žáci v řadě',
    iconName: 'Columns',
    color: 'indigo',
    accentBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    seat1Label: '1. místo',
    seat2Label: '2. místo',
  },
  col2: {
    id: 'col2',
    title: 'Pravý sloupec',
    subtitle: '4 žáci v řadě',
    iconName: 'Columns',
    color: 'indigo',
    accentBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    seat1Label: '1. místo',
    seat2Label: '2. místo',
  },
};

export const TOTAL_ROWS = 5;
export const SEATS_PER_DESK = 2;
export const TOTAL_SEATS = 30; // default for classic

export function getSeatKey(block: string, rowOrDesk: number, seatNumber: number): string {
  return `${block}-${rowOrDesk}-${seatNumber}`;
}

export function parseSeatKey(key: string): { block: string; row: number; seatNumber: number } {
  const parts = key.split('-');
  return {
    block: parts[0],
    row: parseInt(parts[1], 10),
    seatNumber: parseInt(parts[2], 10),
  };
}

export function getAllSeatDefinitions(layoutType: LayoutType = 'two_columns_8'): SeatInfo[] {
  const seats: SeatInfo[] = [];

  if (layoutType === 'two_columns_8') {
    // 4 rows, each with 2 columns of 4 seats (8 seats per row = 32 seats)
    // Row 1 is closest to chalkboard/teacher, Row 4 is in the back
    for (let row = 1; row <= 4; row++) {
      // Left column: 4 students
      for (let s = 1; s <= 4; s++) {
        seats.push({
          key: getSeatKey('col1', row, s),
          section: 'col1',
          row,
          seatNumber: s,
          label: `Levý sloupec, řada ${row} (${s}. místo)`,
        });
      }
      // Right column: 4 students
      for (let s = 1; s <= 4; s++) {
        seats.push({
          key: getSeatKey('col2', row, s),
          section: 'col2',
          row,
          seatNumber: s,
          label: `Pravý sloupec, řada ${row} (${s}. místo)`,
        });
      }
    }
  } else if (layoutType === 'classic_3cols') {
    const blocks: ClassroomBlock[] = ['okno', 'prostredka', 'dvere'];
    for (const block of blocks) {
      for (let row = 1; row <= TOTAL_ROWS; row++) {
        for (let seatNumber = 1; seatNumber <= SEATS_PER_DESK; seatNumber++) {
          const meta = BLOCK_METADATA[block];
          const label = seatNumber === 1 ? meta.seat1Label : meta.seat2Label;
          seats.push({
            key: getSeatKey(block, row, seatNumber),
            section: block,
            row,
            seatNumber,
            label,
          });
        }
      }
    }
  } else if (layoutType === 'u_shape_center') {
    // 1. Perimeter U-Shape:
    // Left side: 3 desks (6 seats)
    for (let desk = 1; desk <= 3; desk++) {
      seats.push({
        key: getSeatKey('u_left', desk, 1),
        section: 'u_left',
        deskIndex: desk,
        seatNumber: 1,
        label: `Obvod levá, lavice ${desk} (1)`,
      });
      seats.push({
        key: getSeatKey('u_left', desk, 2),
        section: 'u_left',
        deskIndex: desk,
        seatNumber: 2,
        label: `Obvod levá, lavice ${desk} (2)`,
      });
    }

    // Back side (top): 3 desks (6 seats)
    for (let desk = 1; desk <= 3; desk++) {
      seats.push({
        key: getSeatKey('u_back', desk, 1),
        section: 'u_back',
        deskIndex: desk,
        seatNumber: 1,
        label: `Obvod zadní, lavice ${desk} (1)`,
      });
      seats.push({
        key: getSeatKey('u_back', desk, 2),
        section: 'u_back',
        deskIndex: desk,
        seatNumber: 2,
        label: `Obvod zadní, lavice ${desk} (2)`,
      });
    }

    // Right side: 3 desks (6 seats)
    for (let desk = 1; desk <= 3; desk++) {
      seats.push({
        key: getSeatKey('u_right', desk, 1),
        section: 'u_right',
        deskIndex: desk,
        seatNumber: 1,
        label: `Obvod pravá, lavice ${desk} (1)`,
      });
      seats.push({
        key: getSeatKey('u_right', desk, 2),
        section: 'u_right',
        deskIndex: desk,
        seatNumber: 2,
        label: `Obvod pravá, lavice ${desk} (2)`,
      });
    }

    // 2. Center: 3 rows, each with 3 desks (6 seats per row = 18 seats)
    for (let row = 1; row <= 3; row++) {
      for (let desk = 1; desk <= 3; desk++) {
        const deskSection = `center_r${row}_d${desk}`;
        seats.push({
          key: getSeatKey(deskSection, 1, 1),
          section: `center_r${row}`,
          row,
          deskIndex: desk,
          seatNumber: 1,
          label: `Střed řada ${row}, lavice ${desk} (1)`,
        });
        seats.push({
          key: getSeatKey(deskSection, 1, 2),
          section: `center_r${row}`,
          row,
          deskIndex: desk,
          seatNumber: 2,
          label: `Střed řada ${row}, lavice ${desk} (2)`,
        });
      }
    }
  }

  return seats;
}

export function getTotalSeatsForLayout(layoutType: LayoutType): number {
  return LAYOUT_CONFIGS[layoutType]?.totalSeats || 30;
}


import {
  ClassroomBlock,
  getAllSeatDefinitions,
  getSeatKey,
  LayoutType,
  parseSeatKey,
  SeatingPlan,
  Student,
  TOTAL_ROWS,
} from '../types';

export type FillStrategy = 'balanced' | 'front_first' | 'random_all';

export interface GenerationOptions {
  strategy?: FillStrategy;
  preserveLocked?: boolean;
  layoutType?: LayoutType;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get ordered list of all seat keys according to fill strategy and layout type
 */
export function getSeatOrder(
  strategy: FillStrategy,
  layoutType: LayoutType = 'two_columns_8'
): string[] {
  if (layoutType === 'two_columns_8') {
    const keys: string[] = [];
    // Fill row 1 (closest to chalkboard/teacher), then row 2, 3, 4
    for (let row = 1; row <= 4; row++) {
      // Left column 4 seats
      for (let s = 1; s <= 4; s++) {
        keys.push(getSeatKey('col1', row, s));
      }
      // Right column 4 seats
      for (let s = 1; s <= 4; s++) {
        keys.push(getSeatKey('col2', row, s));
      }
    }
    return keys;
  }

  if (layoutType === 'classic_3cols') {
    const blocks: ClassroomBlock[] = ['okno', 'prostredka', 'dvere'];
    const keys: string[] = [];

    // Fill row 1 of all columns, then row 2, etc. (front to back)
    for (let row = 1; row <= TOTAL_ROWS; row++) {
      for (const block of blocks) {
        keys.push(getSeatKey(block, row, 1));
        keys.push(getSeatKey(block, row, 2));
      }
    }
    return keys;
  }

  // layoutType === 'u_shape_center'
  // Fill order: Center row 1, Center row 2, U-perimeter front desks, Center row 3, U-perimeter back desks
  const defs = getAllSeatDefinitions('u_shape_center');
  const keys: string[] = [];

  if (strategy === 'front_first' || strategy === 'balanced') {
    // 1. Center Row 1 (closest to teacher)
    for (let desk = 1; desk <= 3; desk++) {
      keys.push(getSeatKey(`center_r1_d${desk}`, 1, 1));
      keys.push(getSeatKey(`center_r1_d${desk}`, 1, 2));
    }
    // 2. Perimeter front desks (u_left desk 1, u_right desk 1)
    keys.push(getSeatKey('u_left', 1, 1));
    keys.push(getSeatKey('u_left', 1, 2));
    keys.push(getSeatKey('u_right', 1, 1));
    keys.push(getSeatKey('u_right', 1, 2));

    // 3. Center Row 2
    for (let desk = 1; desk <= 3; desk++) {
      keys.push(getSeatKey(`center_r2_d${desk}`, 1, 1));
      keys.push(getSeatKey(`center_r2_d${desk}`, 1, 2));
    }
    // 4. Perimeter middle desks (u_left desk 2, u_right desk 2)
    keys.push(getSeatKey('u_left', 2, 1));
    keys.push(getSeatKey('u_left', 2, 2));
    keys.push(getSeatKey('u_right', 2, 1));
    keys.push(getSeatKey('u_right', 2, 2));

    // 5. Center Row 3
    for (let desk = 1; desk <= 3; desk++) {
      keys.push(getSeatKey(`center_r3_d${desk}`, 1, 1));
      keys.push(getSeatKey(`center_r3_d${desk}`, 1, 2));
    }
    // 6. Perimeter back desks (u_left desk 3, u_right desk 3)
    keys.push(getSeatKey('u_left', 3, 1));
    keys.push(getSeatKey('u_left', 3, 2));
    keys.push(getSeatKey('u_right', 3, 1));
    keys.push(getSeatKey('u_right', 3, 2));

    // 7. Perimeter Back side (u_back desks 1, 2, 3)
    for (let desk = 1; desk <= 3; desk++) {
      keys.push(getSeatKey('u_back', desk, 1));
      keys.push(getSeatKey('u_back', desk, 2));
    }
  } else {
    defs.forEach((d) => keys.push(d.key));
  }

  return keys;
}

/**
 * Generates a random seating plan from students list
 */
export function generateSeatingPlan(
  students: Student[],
  currentPlan: SeatingPlan = {},
  options: GenerationOptions = { strategy: 'balanced', preserveLocked: true, layoutType: 'two_columns_8' }
): {
  plan: SeatingPlan;
  assignedStudentsCount: number;
  unassignedStudents: Student[];
} {
  const layoutType = options.layoutType || 'two_columns_8';
  const allSeatDefs = getAllSeatDefinitions(layoutType);
  const newPlan: SeatingPlan = {};

  // Initialize all valid seats for this layout to null
  allSeatDefs.forEach((seat) => {
    newPlan[seat.key] = null;
  });

  const validKeysSet = new Set(allSeatDefs.map((s) => s.key));

  const studentsToAssign: Student[] = [];
  const lockedStudentIds = new Set<string>();

  // If preserving locked positions, place locked students first
  if (options.preserveLocked) {
    students.forEach((student) => {
      if (
        student.isLocked &&
        student.lockedSeatKey &&
        validKeysSet.has(student.lockedSeatKey) &&
        newPlan[student.lockedSeatKey] === null
      ) {
        newPlan[student.lockedSeatKey] = student.id;
        lockedStudentIds.add(student.id);
      }
    });
  }

  // Filter out already locked students
  students.forEach((student) => {
    if (!lockedStudentIds.has(student.id)) {
      studentsToAssign.push(student);
    }
  });

  // Shuffle the remaining students
  const shuffledStudents = shuffleArray(studentsToAssign);

  // Determine seat order
  let orderedSeatKeys = getSeatOrder(options.strategy || 'balanced', layoutType);

  if (options.strategy === 'random_all') {
    orderedSeatKeys = shuffleArray(orderedSeatKeys);
  }

  // Filter available (not yet occupied by locked students) seat keys
  const availableSeatKeys = orderedSeatKeys.filter((key) => newPlan[key] === null);

  let assignIndex = 0;
  const unassigned: Student[] = [];

  shuffledStudents.forEach((student) => {
    if (assignIndex < availableSeatKeys.length) {
      const seatKey = availableSeatKeys[assignIndex];
      newPlan[seatKey] = student.id;
      assignIndex++;
    } else {
      // Classroom full
      unassigned.push(student);
    }
  });

  const assignedCount = Object.values(newPlan).filter(Boolean).length;

  return {
    plan: newPlan,
    assignedStudentsCount: assignedCount,
    unassignedStudents: unassigned,
  };
}

/**
 * Swaps two seats in the seating plan or moves a student to an empty seat
 */
export function swapSeats(
  plan: SeatingPlan,
  seatKeyA: string,
  seatKeyB: string
): SeatingPlan {
  const updated = { ...plan };
  const studentA = updated[seatKeyA] || null;
  const studentB = updated[seatKeyB] || null;

  updated[seatKeyA] = studentB;
  updated[seatKeyB] = studentA;

  return updated;
}


import * as XLSX from 'xlsx';
import { ClassData, Student } from '../types';

export const SAMPLE_CLASSES: { name: string; students: string[] }[] = [
  {
    name: '1.A (26 studentů)',
    students: [
      'Adámková Tereza',
      'Beneš Filip',
      'Černá Eliška',
      'Dvořák Jan',
      'Fialová Karolína',
      'Havel Jakub',
      'Horáková Natálie',
      'Janda Lukáš',
      'Kovářová Adéla',
      'Král David',
      'Kučera Matěj',
      'Lišková Veronika',
      'Mareš Tomáš',
      'Němcová Anna',
      'Novák Michal',
      'Pavlíková Kristýna',
      'Polák Ondřej',
      'Pospíšil Adam',
      'Procházková Viktorie',
      'Sedláček Daniel',
      'Svobodová Barbora',
      'Šimek Martin',
      'Urban Vojtěch',
      'Veselá Michaela',
      'Vlček Petr',
      'Zemanová Klára',
    ],
  },
  {
    name: 'Sekunda B (30 studentů - plná třída)',
    students: [
      'Bartoš Jan',
      'Blažková Lucie',
      'Čechová Michaela',
      'Doležal Marek',
      'Dušková Julie',
      'Holub Matyáš',
      'Hrušková Dominika',
      'Jelínek Šimon',
      'Kadlecová Sofie',
      'Kolář Patrik',
      'Konečný Tobiáš',
      'Kovář Štěpán',
      'Krejčí Ema',
      'Křížová Laura',
      'Mach Antonín',
      'Malá Tereza',
      'Moravec Oliver',
      'Navrátilová Stella',
      'Novotný František',
      'Pechová Vanessa',
      'Pokorný Richard',
      'Růžička Mikuláš',
      'Sedláková Nela',
      'Soukup Samuel',
      'Staněk Gabriel',
      'Strnadová Amálie',
      'Sýkora Teodor',
      'Tichá Sára',
      'Valenta Kristián',
      'Vávrová Elena',
    ],
  },
  {
    name: 'Jazyková skupina (16 studentů)',
    students: [
      'Bílý Denis',
      'Čermák Jan',
      'Horák David',
      'Janků Anna',
      'Klimeš Tomáš',
      'Kopecká Sára',
      'Kratochvíl Jan',
      'Křížová Eliška',
      'Matoušek Ondřej',
      'Novotná Pavla',
      'Pešek Matěj',
      'Richterová Lucie',
      'Říha Martin',
      'Smutná Kateřina',
      'Toman Vojtěch',
      'Žáková Tereza',
    ],
  },
];

export interface ClassParseResult {
  classes: ClassData[];
  errors: string[];
  source?: string;
}

/**
 * Parses a matrix of raw rows from an Excel worksheet into a list of Student objects
 */
export function parseRawRowsToStudents(rawRows: any[][]): Student[] {
  if (!rawRows || rawRows.length === 0) return [];

  const extractedNames: string[] = [];
  const headerKeywords = [
    'jméno',
    'jmeno',
    'příjmení',
    'prijmeni',
    'student',
    'žák',
    'zak',
    'name',
    'příjmení a jméno',
    'pořadí',
    'číslo',
    'cislo',
    'id',
  ];

  let startRowIdx = 0;
  const firstRowStr = (rawRows[0] || []).map((c) => String(c).toLowerCase().trim()).join(' ');
  const isHeaderRow = headerKeywords.some((kw) => firstRowStr.includes(kw));

  if (isHeaderRow) {
    startRowIdx = 1;
  }

  for (let i = startRowIdx; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row)) continue;

    const nonBlankCells = row
      .map((c) => (c !== undefined && c !== null ? String(c).trim() : ''))
      .filter((c) => c.length > 0);

    if (nonBlankCells.length === 0) continue;

    let candidate = '';

    if (nonBlankCells.length === 1) {
      candidate = nonBlankCells[0];
    } else if (nonBlankCells.length >= 2) {
      const firstIsNumber = /^\d+[\.\)]?$/.test(nonBlankCells[0]);
      if (firstIsNumber) {
        if (nonBlankCells.length === 2) {
          candidate = nonBlankCells[1];
        } else {
          candidate = `${nonBlankCells[1]} ${nonBlankCells[2]}`;
        }
      } else {
        candidate = `${nonBlankCells[0]} ${nonBlankCells[1]}`;
      }
    }

    candidate = candidate.replace(/\s+/g, ' ').trim();

    if (candidate && candidate.length >= 2 && !/^\d+$/.test(candidate)) {
      if (!headerKeywords.includes(candidate.toLowerCase())) {
        extractedNames.push(candidate);
      }
    }
  }

  return extractedNames.map((name, index) => ({
    id: `student-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    name,
  }));
}

/**
 * Parses all sheets in an Excel workbook ("jedna lišta = jedna třída")
 */
export function parseExcelWorkbook(workbook: XLSX.WorkBook): ClassParseResult {
  const result: ClassParseResult = {
    classes: [],
    errors: [],
  };

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    result.errors.push('Excel neobsahuje žádné listy.');
    return result;
  }

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
    const students = parseRawRowsToStudents(rawRows);

    if (students.length > 0) {
      result.classes.push({
        id: `class-${sheetName.trim().replace(/\s+/g, '_')}-${Date.now()}`,
        name: sheetName.trim(),
        students,
      });
    }
  }

  if (result.classes.length === 0) {
    result.errors.push('V žádném z listů se nepodařilo nalézt jména studentů.');
  }

  return result;
}

/**
 * Converts a regular GitHub web URL (e.g. github.com/user/repo/blob/main/tridy.xlsx)
 * to a direct raw link (raw.githubusercontent.com/user/repo/main/tridy.xlsx)
 */
export function convertGitHubUrlToRaw(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  if (!trimmed) return '';

  // Case 1: https://github.com/:owner/:repo/blob/:branch/:path...
  const blobRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i;
  const blobMatch = trimmed.match(blobRegex);
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  }

  // Case 2: https://github.com/:owner/:repo/raw/:branch/:path...
  const rawRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/raw\/([^\/]+)\/(.+)$/i;
  const rawMatch = trimmed.match(rawRegex);
  if (rawMatch) {
    const [, owner, repo, branch, filePath] = rawMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  }

  return trimmed;
}

/**
 * Fetches an Excel file from a URL (e.g. on GitHub) and parses all class sheets
 */
export async function fetchAndParseExcelFromUrl(url: string): Promise<ClassParseResult> {
  const rawUrl = convertGitHubUrlToRaw(url);

  try {
    const response = await fetch(rawUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Chyba stahování: HTTP ${response.status} (${response.statusText})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    const parseRes = parseExcelWorkbook(workbook);
    parseRes.source = url;
    return parseRes;
  } catch (err: any) {
    return {
      classes: [],
      errors: [
        `Nepodařilo se načíst soubor z GitHubu: ${err?.message || 'Zkontrolujte adresu a dostupnost repozitáře'}.`,
      ],
      source: url,
    };
  }
}

/**
 * Parse an Excel or CSV file uploaded from user disk
 */
export async function parseStudentFile(file: File): Promise<ClassParseResult & { students: Student[]; totalRowsFound: number; sheetName?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const multiRes = parseExcelWorkbook(workbook);
        const firstClass = multiRes.classes[0];

        resolve({
          classes: multiRes.classes,
          students: firstClass ? firstClass.students : [],
          errors: multiRes.errors,
          sheetName: firstClass ? firstClass.name : undefined,
          totalRowsFound: firstClass ? firstClass.students.length : 0,
        });
      } catch (err: any) {
        reject(new Error(`Chyba při čtení Excel souboru: ${err?.message || 'Neznámá chyba'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Nepodařilo se načíst soubor z počítače.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses raw text input (e.g. pasted list from clipboard)
 */
export function parseTextList(text: string): Student[] {
  const lines = text.split(/\r?\n/);
  const students: Student[] = [];

  lines.forEach((line, index) => {
    let clean = line.replace(/^\s*\d+[\.\)\-]?\s*/, '').trim(); // Remove leading numbering
    if (clean.length >= 2) {
      students.push({
        id: `student-pasted-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        name: clean,
      });
    }
  });

  return students;
}

/**
 * Downloads a sample Excel template for teachers to fill in
 */
export function downloadSampleExcelTemplate() {
  const data = [
    ['Příjmení', 'Jméno', 'Poznámka (volitelné)'],
    ['Novák', 'Jan', ''],
    ['Svobodová', 'Eliška', ''],
    ['Novotný', 'Tomáš', ''],
    ['Dvořáková', 'Tereza', ''],
    ['Černý', 'Matěj', ''],
    ['Procházková', 'Adéla', ''],
    ['Kučera', 'Filip', ''],
    ['Veselá', 'Barbora', ''],
    ['Horák', 'Lukáš', ''],
    ['Němcová', 'Karolína', ''],
    ['Marek', 'David', ''],
    ['Pospíšilová', 'Natálie', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Seznam žáků');

  XLSX.writeFile(wb, 'vzor_seznam_zaku.xlsx');
}

/**
 * Downloads a multi-sheet Excel template ("jedna lišta = jedna třída")
 * suitable for hosting on GitHub
 */
export function downloadMultiClassSampleExcel() {
  const wb = XLSX.utils.book_new();

  const classData: Record<string, string[][]> = {
    '1.A': [
      ['Příjmení', 'Jméno'],
      ['Adamec', 'Vojtěch'],
      ['Bartošová', 'Klára'],
      ['Černý', 'Ondřej'],
      ['Doležal', 'Matěj'],
      ['Dvořáková', 'Tereza'],
      ['Fiala', 'Jakub'],
      ['Hájková', 'Lucie'],
      ['Horák', 'David'],
      ['Jelínek', 'Adam'],
      ['Kolářová', 'Kateřina'],
      ['Kovář', 'Tomáš'],
      ['Kratochvíl', 'Jan'],
      ['Kučera', 'Lukáš'],
      ['Malá', 'Veronika'],
      ['Marek', 'Filip'],
      ['Moravec', 'Daniel'],
      ['Navrátilová', 'Eliška'],
      ['Němec', 'Martin'],
      ['Novák', 'Jan'],
      ['Novotná', 'Anna'],
      ['Pavlíková', 'Viktorie'],
      ['Pospíšil', 'Jiří'],
      ['Procházková', 'Adéla'],
      ['Sedláčková', 'Natálie'],
      ['Svoboda', 'Marek'],
      ['Veselá', 'Barbora'],
    ],
    '1.B': [
      ['Příjmení', 'Jméno'],
      ['Beneš', 'Kryštof'],
      ['Bláhová', 'Karolína'],
      ['Brož', 'Štěpán'],
      ['Čechová', 'Kristýna'],
      ['Dušek', 'Richard'],
      ['Holub', 'Matyáš'],
      ['Hrušková', 'Sofie'],
      ['Janda', 'Tobiáš'],
      ['Kopecký', 'Dominik'],
      ['Králová', 'Magdaléna'],
      ['Liška', 'Samuel'],
      ['Marešová', 'Julie'],
      ['Michálek', 'Patrik'],
      ['Musilová', 'Nikola'],
      ['Novák', 'Petr'],
      ['Polák', 'Václav'],
      ['Růžičková', 'Michaela'],
      ['Říha', 'Sebastián'],
      ['Soukupová', 'Nela'],
      ['Staněk', 'Jonáš'],
      ['Šimek', 'Oliver'],
      ['Šimková', 'Elena'],
      ['Urban', 'Denis'],
      ['Valenta', 'Miroslav'],
      ['Vlachová', 'Tereza'],
      ['Zeman', 'Mikuláš'],
    ],
    'Sekunda': [
      ['Příjmení', 'Jméno'],
      ['Bílý', 'Mikuláš'],
      ['Cibulková', 'Ema'],
      ['Čermák', 'Hugo'],
      ['Daněk', 'Tadeáš'],
      ['Eliášová', 'Stela'],
      ['Frank', 'Bruno'],
      ['Gottwaldová', 'Laura'],
      ['Hlaváček', 'Viktor'],
      ['Hrubý', 'Eduard'],
      ['Chalupa', 'Albert'],
      ['Janečková', 'Zora'],
      ['Kalous', 'Vilém'],
      ['Klementová', 'Alžběta'],
      ['Konečný', 'Maxmilián'],
      ['Mach', 'Artur'],
      ['Pilařová', 'Mia'],
      ['Richter', 'Robin'],
      ['Strnad', 'Kamil'],
      ['Sýkorová', 'Dorota'],
      ['Tichý', 'Oskar'],
      ['Vodička', 'Bohumil'],
      ['Wolfová', 'Agáta'],
      ['Zahrádka', 'František'],
      ['Žáková', 'Linda'],
    ],
  };

  Object.entries(classData).forEach(([sheetName, rows]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, 'tridy.xlsx');
}

import * as XLSX from 'xlsx';
import { ClassData, Student } from '../types';

export const SAMPLE_CLASSES: { name: string; students: string[] }[] = [
  {
    name: '3A',
    students: [
      'Adam Brož',
      'Anastasiia Balanets',
      'Antonín Povolný',
      'Daniel Horáček',
      'Dominik Pavelka',
      'Hynek Mayrhofer',
      'Jakub Suchánsky',
      'Jáchym Viták',
      'Karyna Kryvka',
      'Kubát Pavel',
      'Lukáš Jiránek',
      'Maksym Kravets',
      'Marek Miláček',
      'Marek Řehák',
      'Mark Nahornyi',
      'Matyáš Sauer',
      'Michael Bartuněk',
      'Michal Hron',
      'Mykola Mandziuk',
      'Ondřej Borovička',
      'Petr Škarvan',
      'Tomáš Filip',
      'Tomáš Jandák',
      'Tomáš Sunkovský',
      'Tomáš Štěpán',
      'Vincent Procházka',
      'Vitalii Fenynets',
      'Vojtěch Garčic',
      'Šimon Kreperát',
      'Šimon Kubala',
    ],
  },
  {
    name: '1E',
    students: [
      'David Sládeček',
      'Filip Rahbani',
      'Hugo Struček',
      'Jakub Zvěřina',
      'Jan Brandejs',
      'Lukáš Vojáček',
      'Maksym Pavlyk',
      'Martin Krkoška',
      'Martin Stržínek',
      'Michael Brychta',
      'Mikuláš Hejnyš',
      'Ondřej Vošahlík',
      'Samuel Hrabák',
      'Tereza Tichá',
      'Timotej Goliáš',
      'Tomáš Kučera',
      'Tomáš Vorel',
      'Viktor Bečka',
      'Vojtěch Mládek',
      'Vojtěch Valášek',
      'Yehor Sablin',
      'Zdeněk Dvořák',
    ],
  },
  {
    name: '3A_a',
    students: [
      'Anastasiia Balanets',
      'Michael Bartuněk',
      'Ondřej Borovička',
      'Adam Brož',
      'Vitalii Fenynets',
      'Tomáš Filip',
      'Vojtěch Garčic',
      'Daniel Horáček',
      'Michal Hron',
      'Tomáš Jandák',
      'Lukáš Jiránek',
      'Maksym Kravets',
      'Šimon Kreperát',
      'Karyna Kryvka',
      'Šimon Kubala',
      'Kubát Pavel',
    ],
  },
  {
    name: '3A_b',
    students: [
      'Mykola Mandziuk',
      'Hynek Mayrhofer',
      'Marek Miláček',
      'Mark Nahornyi',
      'Dominik Pavelka',
      'Antonín Povolný',
      'Vincent Procházka',
      'Marek Řehák',
      'Matyáš Sauer',
      'Jakub Suchánsky',
      'Tomáš Sunkovský',
      'Petr Škarvan',
      'Tomáš Štěpán',
      'Jáchym Viták',
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
 * Converts a GitHub or web URL to possible direct download candidates
 * (e.g. checking both public/tridy.xlsx and root tridy.xlsx, main or master branch)
 */
export function convertGitHubUrlToCandidates(inputUrl: string): string[] {
  const trimmed = inputUrl.trim();
  if (!trimmed) return [];

  const candidates: string[] = [];

  // Case 0: GitHub repository root URL (e.g. https://github.com/owner/repo or with trailing slash)
  const repoRootRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/i;
  const repoMatch = trimmed.match(repoRootRegex);
  if (repoMatch) {
    const [, owner, repo] = repoMatch;
    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/main/public/tridy.xlsx`);
    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/main/tridy.xlsx`);
    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/master/public/tridy.xlsx`);
    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/master/tridy.xlsx`);
    return candidates;
  }

  // Case 1: https://github.com/:owner/:repo/blob/:branch/:path...
  const blobRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i;
  const blobMatch = trimmed.match(blobRegex);
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch;
    const directRaw = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    candidates.push(directRaw);
    if (!filePath.startsWith('public/')) {
      candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/${filePath}`);
    } else {
      candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath.replace(/^public\//, '')}`);
    }
    return candidates;
  }

  // Case 2: https://github.com/:owner/:repo/raw/:branch/:path...
  const rawRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/raw\/([^\/]+)\/(.+)$/i;
  const rawMatch = trimmed.match(rawRegex);
  if (rawMatch) {
    const [, owner, repo, branch, filePath] = rawMatch;
    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`);
    if (!filePath.startsWith('public/')) {
      candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/${filePath}`);
    }
    return candidates;
  }

  // Case 3: https://raw.githubusercontent.com/:owner/:repo/:branch/:path...
  const directRawRegex = /^https?:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/i;
  const directRawMatch = trimmed.match(directRawRegex);
  if (directRawMatch) {
    const [, owner, repo, branch, filePath] = directRawMatch;
    candidates.push(trimmed);
    if (!filePath.startsWith('public/')) {
      candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/${filePath}`);
    } else {
      candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath.replace(/^public\//, '')}`);
    }
    return candidates;
  }

  candidates.push(trimmed);
  // Also provide direct repository candidates if pointing to relative tridy.xlsx
  if (trimmed === './tridy.xlsx' || trimmed === 'tridy.xlsx') {
    candidates.push('https://raw.githubusercontent.com/Sarka636/ZasedaciPoradek/main/public/tridy.xlsx');
    candidates.push('https://raw.githubusercontent.com/Sarka636/ZasedaciPoradek/main/tridy.xlsx');
  }

  return candidates;
}

export function convertGitHubUrlToRaw(inputUrl: string): string {
  const list = convertGitHubUrlToCandidates(inputUrl);
  return list[0] || inputUrl.trim();
}

/**
 * Fetches an Excel file from a URL (e.g. on GitHub) and parses all class sheets.
 * Includes cache-busting so updates on GitHub are immediately downloaded.
 */
export async function fetchAndParseExcelFromUrl(url: string): Promise<ClassParseResult> {
  const candidateUrls = convertGitHubUrlToCandidates(url);
  const errors: string[] = [];

  for (const candidate of candidateUrls) {
    try {
      const sep = candidate.includes('?') ? '&' : '?';
      const fetchUrl = `${candidate}${sep}_t=${Date.now()}`;

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*',
        },
      });

      if (!response.ok) {
        errors.push(`${candidate} (HTTP ${response.status})`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const parseRes = parseExcelWorkbook(workbook);
      if (parseRes.classes.length > 0) {
        parseRes.source = candidate;
        return parseRes;
      } else {
        errors.push(`${candidate}: nebyly nalezeny žádné třídy se studenty`);
      }
    } catch (err: any) {
      errors.push(`${candidate}: ${err?.message || 'Chyba sítě'}`);
    }
  }

  return {
    classes: [],
    errors: [
      `Nepodařilo se načíst aktuální soubor z GitHubu. Vyzkoušeno: ${errors.join(', ')}`,
    ],
    source: url,
  };
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

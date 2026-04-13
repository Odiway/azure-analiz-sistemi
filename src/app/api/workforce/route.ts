import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const EXCEL_FILE = join(process.cwd(), 'Analiz_İş_Gücü_Planı_X+3_170226.xlsx');

interface WorkforceTask {
  rowIndex: number; // Excel row index (0-based)
  number: string;
  name: string;
  type: string;
  ekip: string;
  sorumlu: string;
  caeResp: string;
  project: string;
  status: string;
  phase3: string;
  cadReady: string;
  weeks: Record<number, number>; // week number -> allocation (1 = full)
}

interface PersonSummary {
  name: string;
  tasks: number;
  projects: string[];
  totalWeekAllocations: number;
  weeklyLoad: Record<number, number>; // week -> total tasks that week
}

function parseExcel(): { tasks: WorkforceTask[]; people: PersonSummary[]; projects: string[] } {
  const fileBuffer = readFileSync(EXCEL_FILE);
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const ws = wb.Sheets['Project Plan and Timing'];

  if (!ws) throw new Error('Sheet not found');

  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const tasks: WorkforceTask[] = [];
  const validCAE = new Set<string>();
  const projectSet = new Set<string>();

  // Data rows start from row 9 (0-indexed)
  // Columns: 1=Number, 3=Name, 4=Type, 5=Ekip, 6=Sorumlu, 7=Status, 8=Phase3,
  //          10=Project, 11=CAE Resp, 12=CAD Readiness
  // Week columns: 13-64 = weeks 1-52 of first year (2026)

  for (let i = 9; i < data.length; i++) {
    const r = data[i];
    const name = String(r[3] || '').trim();
    const cae = String(r[11] || '').trim();
    const prj = String(r[10] || '').trim();

    if (!name || !cae || ['', '-', 'ALL', 'Report', 'Team'].includes(cae)) continue;

    const weeks: Record<number, number> = {};
    for (let w = 13; w <= 64; w++) {
      const v = r[w];
      if (v && String(v).trim() !== '' && String(v).trim() !== ' ') {
        weeks[w - 12] = parseFloat(String(v)) || 1;
      }
    }

    tasks.push({
      rowIndex: i,
      number: String(r[1] || '').trim(),
      name,
      type: String(r[4] || '').trim(),
      ekip: String(r[5] || '').trim(),
      sorumlu: String(r[6] || '').trim(),
      caeResp: cae,
      project: prj,
      status: String(r[7] || '').trim(),
      phase3: String(r[8] || '').trim(),
      cadReady: String(r[12] || '').trim(),
      weeks,
    });

    validCAE.add(cae);
    if (prj) projectSet.add(prj);
  }

  // Build per-person summary
  const personMap: Record<string, { tasks: number; projects: Set<string>; totalWeeks: number; weeklyLoad: Record<number, number> }> = {};

  for (const task of tasks) {
    const p = task.caeResp;
    if (!personMap[p]) {
      personMap[p] = { tasks: 0, projects: new Set(), totalWeeks: 0, weeklyLoad: {} };
    }
    personMap[p].tasks++;
    personMap[p].projects.add(task.project);
    personMap[p].totalWeeks += Object.keys(task.weeks).length;

    for (const [wk, val] of Object.entries(task.weeks)) {
      const weekNum = parseInt(wk);
      personMap[p].weeklyLoad[weekNum] = (personMap[p].weeklyLoad[weekNum] || 0) + val;
    }
  }

  const people: PersonSummary[] = Object.entries(personMap)
    .map(([name, d]) => ({
      name,
      tasks: d.tasks,
      projects: Array.from(d.projects),
      totalWeekAllocations: d.totalWeeks,
      weeklyLoad: d.weeklyLoad,
    }))
    .sort((a, b) => b.tasks - a.tasks);

  return { tasks, people, projects: Array.from(projectSet) };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = parseExcel();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Excel parse error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const updates: { rowIndex: number; week: number; value: number }[] = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Validate all updates
    for (const u of updates) {
      if (typeof u.rowIndex !== 'number' || u.rowIndex < 9) {
        return NextResponse.json({ error: 'Invalid rowIndex' }, { status: 400 });
      }
      if (typeof u.week !== 'number' || u.week < 1 || u.week > 52) {
        return NextResponse.json({ error: 'Invalid week' }, { status: 400 });
      }
      if (typeof u.value !== 'number' || u.value < 0) {
        return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
      }
    }

    const fileBuffer = readFileSync(EXCEL_FILE);
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const ws = wb.Sheets['Project Plan and Timing'];
    if (!ws) return NextResponse.json({ error: 'Sheet not found' }, { status: 500 });

    for (const { rowIndex, week, value } of updates) {
      const col = 12 + week; // week 1 -> col 13 (0-indexed)
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });

      if (value > 0) {
        ws[cellRef] = { t: 'n', v: value };
      } else {
        // Remove the cell (set to empty)
        delete ws[cellRef];
      }
    }

    // Update sheet range if needed
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    ws['!ref'] = XLSX.utils.encode_range(range);

    const output = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    writeFileSync(EXCEL_FILE, output);

    // Re-parse and return fresh data
    const data = parseExcel();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Update error' }, { status: 500 });
  }
}
